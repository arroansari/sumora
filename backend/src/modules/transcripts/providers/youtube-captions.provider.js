const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const { BaseTranscriptProvider, TranscriptUnavailableError } = require('../transcript.provider');

class YouTubeCaptionsProvider extends BaseTranscriptProvider {
  constructor() {
    super();
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
  }

  get name() {
    return 'youtube_captions';
  }

  async canHandle(videoId, options = {}) {
    // Can attempt for any valid YouTube video ID (alphanumeric + _ - of length 11)
    return typeof videoId === 'string' && videoId.length > 0;
  }

  /**
   * Parses timedtext XML format (<transcript><text start="0" dur="5">Hello</text></transcript>)
   * @param {string} xmlString
   * @returns {Array<{start: number, duration: number, text: string}>}
   */
  parseTimedTextXml(xmlString) {
    const parsed = this.xmlParser.parse(xmlString);
    if (!parsed || !parsed.transcript || !parsed.transcript.text) {
      return [];
    }

    const rawNodes = Array.isArray(parsed.transcript.text)
      ? parsed.transcript.text
      : [parsed.transcript.text];

    const segments = [];
    for (const node of rawNodes) {
      const start = parseFloat(node['@_start'] || 0);
      const duration = parseFloat(node['@_dur'] || 0);
      // fast-xml-parser places node content in '#text' if attributes exist
      const text = typeof node === 'string' ? node : node['#text'] || '';

      if (text && text.trim()) {
        segments.push({
          start,
          duration,
          text: String(text).trim(),
        });
      }
    }

    return segments;
  }

  /**
   * Fetches public captions for a YouTube video.
   * @param {string} videoId
   * @param {object} [options]
   */
  async fetchTranscript(videoId, options = {}) {
    // If mock segments are provided (e.g. for deterministic unit testing), return them
    if (options.mockXml) {
      const segments = this.parseTimedTextXml(options.mockXml);
      if (segments.length === 0) {
        throw new TranscriptUnavailableError('No caption segments found in timed text', this.name);
      }
      return {
        language: options.language || 'en',
        segments,
      };
    }

    try {
      // 1. Fetch public video page to extract caption tracks from ytInitialPlayerResponse
      const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const response = await axios.get(watchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 10000,
      });

      const html = response.data;

      // Extract caption tracks from player response
      const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});(?:\s*var\s+|\s*<\/script>)/s);
      if (!playerResponseMatch) {
        throw new TranscriptUnavailableError('Could not parse YouTube player response', this.name);
      }

      let playerResponse;
      try {
        playerResponse = JSON.parse(playerResponseMatch[1]);
      } catch (err) {
        throw new TranscriptUnavailableError('Invalid player response JSON', this.name);
      }

      const captionTracks =
        playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;

      if (!captionTracks || !Array.isArray(captionTracks) || captionTracks.length === 0) {
        throw new TranscriptUnavailableError('Captions are not available or disabled by creator', this.name);
      }

      // Prioritize English or default track
      const selectedTrack =
        captionTracks.find((t) => t.languageCode === 'en' || t.languageCode?.startsWith('en')) ||
        captionTracks[0];

      if (!selectedTrack || !selectedTrack.baseUrl) {
        throw new TranscriptUnavailableError('No valid caption track URL found', this.name);
      }

      // 2. Fetch timedtext captions XML
      const timedTextResponse = await axios.get(selectedTrack.baseUrl, {
        timeout: 8000,
      });

      const segments = this.parseTimedTextXml(timedTextResponse.data);
      if (!segments || segments.length === 0) {
        throw new TranscriptUnavailableError('Caption track was empty or unparseable', this.name);
      }

      return {
        language: selectedTrack.languageCode || 'en',
        segments,
      };
    } catch (error) {
      if (error instanceof TranscriptUnavailableError) {
        throw error;
      }
      throw new TranscriptUnavailableError(`Failed to retrieve YouTube captions: ${error.message}`, this.name);
    }
  }
}

module.exports = YouTubeCaptionsProvider;

