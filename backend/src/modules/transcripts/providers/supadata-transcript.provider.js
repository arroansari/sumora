const axios = require('axios');
const { BaseTranscriptProvider, TranscriptUnavailableError } = require('../transcript.provider');
const config = require('../../../config');

class SupadataTranscriptProvider extends BaseTranscriptProvider {
  constructor(apiKey = config.supadata?.apiKey) {
    super();
    this.apiKey = apiKey;
  }

  get name() {
    return 'supadata';
  }

  async canHandle(videoId, options = {}) {
    return Boolean(this.apiKey && typeof videoId === 'string' && videoId.length > 0);
  }

  /**
   * Fetches transcript via Supadata YouTube API.
   * Supadata returns { lang, availableLangs, content: [{ text, offset (ms), duration (ms) }] }
   *
   * @param {string} videoId
   * @param {object} [options]
   */
  async fetchTranscript(videoId, options = {}) {
    if (!this.apiKey) {
      throw new TranscriptUnavailableError('Supadata API key is not configured', this.name);
    }

    try {
      console.log(`[SupadataProvider] Fetching transcript for video: ${videoId}...`);
      const response = await axios.get('https://api.supadata.ai/v1/youtube/transcript', {
        params: { videoId },
        headers: {
          'x-api-key': this.apiKey,
        },
        timeout: 12000,
      });

      const data = response.data;

      if (!data || !Array.isArray(data.content) || data.content.length === 0) {
        throw new TranscriptUnavailableError('No transcript content returned by Supadata', this.name);
      }

      // Convert Supadata ms timestamps (offset, duration) to seconds (start, duration)
      const segments = data.content
        .map((item) => {
          const startSeconds = typeof item.offset === 'number' ? item.offset / 1000 : 0;
          const durationSeconds = typeof item.duration === 'number' ? item.duration / 1000 : 0;
          const text = (item.text || '').trim();

          return {
            start: Math.round(startSeconds * 100) / 100,
            duration: Math.round(durationSeconds * 100) / 100,
            text,
          };
        })
        .filter((seg) => seg.text.length > 0);

      if (segments.length === 0) {
        throw new TranscriptUnavailableError('All parsed transcript segments were empty', this.name);
      }

      console.log(
        `[SupadataProvider] Successfully fetched ${segments.length} transcript segments for ${videoId} in ${data.lang || 'en'}`
      );

      return {
        language: data.lang || 'en',
        segments,
      };
    } catch (error) {
      if (error instanceof TranscriptUnavailableError) {
        throw error;
      }
      const status = error.response?.status;
      const errorMsg = error.response?.data?.message || error.message;
      console.warn(`[SupadataProvider] Request failed for ${videoId} (status: ${status}): ${errorMsg}`);
      throw new TranscriptUnavailableError(`Supadata error: ${errorMsg}`, this.name);
    }
  }
}

module.exports = SupadataTranscriptProvider;
