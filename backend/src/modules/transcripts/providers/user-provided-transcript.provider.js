const { BaseTranscriptProvider, TranscriptUnavailableError } = require('../transcript.provider');

class UserProvidedTranscriptProvider extends BaseTranscriptProvider {
  get name() {
    return 'user_provided';
  }

  async canHandle(videoId, options = {}) {
    return Boolean(options.userTranscriptText || options.userTranscriptSrt);
  }

  /**
   * Converts timestamp string (HH:MM:SS,mmm or MM:SS.mmm) to seconds.
   * @param {string} timeString
   * @returns {number}
   */
  parseTimestampToSeconds(timeString) {
    const parts = timeString.trim().replace(',', '.').split(':');
    if (parts.length === 3) {
      const hours = parseFloat(parts[0]) || 0;
      const minutes = parseFloat(parts[1]) || 0;
      const seconds = parseFloat(parts[2]) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    }
    if (parts.length === 2) {
      const minutes = parseFloat(parts[0]) || 0;
      const seconds = parseFloat(parts[1]) || 0;
      return minutes * 60 + seconds;
    }
    return 0;
  }

  /**
   * Parses SRT or WebVTT formatted subtitles.
   * @param {string} srtText
   * @returns {Array<{start: number, duration: number, text: string}>}
   */
  parseSrtOrVtt(srtText) {
    const normalized = srtText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const blocks = normalized.split(/\n\n+/);
    const segments = [];

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 2) continue;

      // Find line with time arrow -->
      const timeLineIndex = lines.findIndex((l) => l.includes('-->'));
      if (timeLineIndex === -1) continue;

      const timeLine = lines[timeLineIndex];
      const [startStr, endStr] = timeLine.split('-->');
      const start = this.parseTimestampToSeconds(startStr.trim());
      const end = this.parseTimestampToSeconds(endStr.trim().split(/\s+/)[0]);
      const duration = Math.max(0.5, Math.round((end - start) * 100) / 100);

      const text = lines
        .slice(timeLineIndex + 1)
        .join(' ')
        .trim();

      if (text) {
        segments.push({ start, duration, text });
      }
    }

    return segments;
  }

  /**
   * Parses plain text into rough timestamped segments (5-second increments).
   * @param {string} plainText
   * @returns {Array<{start: number, duration: number, text: string}>}
   */
  parsePlainText(plainText) {
    const sentences = plainText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const segments = [];
    let currentTime = 0;
    const estDurationPerSentence = 4;

    for (const sentence of sentences) {
      segments.push({
        start: currentTime,
        duration: estDurationPerSentence,
        text: sentence,
      });
      currentTime += estDurationPerSentence;
    }

    return segments;
  }

  async fetchTranscript(videoId, options = {}) {
    if (options.userTranscriptSrt) {
      const segments = this.parseSrtOrVtt(options.userTranscriptSrt);
      if (segments.length === 0) {
        throw new TranscriptUnavailableError('Provided SRT/VTT file contained no valid segments', this.name);
      }
      return {
        language: options.language || 'en',
        segments,
      };
    }

    if (options.userTranscriptText) {
      const segments = this.parsePlainText(options.userTranscriptText);
      if (segments.length === 0) {
        throw new TranscriptUnavailableError('Provided plain text transcript was empty', this.name);
      }
      return {
        language: options.language || 'en',
        segments,
      };
    }

    throw new TranscriptUnavailableError('No user-provided transcript data was passed', this.name);
  }
}

module.exports = UserProvidedTranscriptProvider;
