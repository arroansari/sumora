/**
 * Abstract Base Class for Transcript Providers.
 * Any new transcript provider must extend this class and implement the required methods.
 */
class BaseTranscriptProvider {
  /**
   * Unique identifier for the provider.
   * @returns {string}
   */
  get name() {
    throw new Error('Provider must implement getter: name');
  }

  /**
   * Checks whether this provider is capable of handling the request for the given video.
   * @param {string} videoId
   * @param {object} [options]
   * @returns {Promise<boolean>|boolean}
   */
  async canHandle(videoId, options = {}) {
    return true;
  }

  /**
   * Fetches the raw transcript segments for the video.
   * Must return an object with:
   * {
   *   language: string,
   *   segments: Array<{ start: number, duration: number, text: string }>,
   *   rawText?: string
   * }
   * Or return null / throw error if unavailable.
   * @param {string} videoId
   * @param {object} [options]
   * @returns {Promise<{language: string, segments: Array<{start: number, duration: number, text: string}>, rawText?: string}|null>}
   */
  async fetchTranscript(videoId, options = {}) {
    throw new Error(`Provider ${this.name} must implement fetchTranscript()`);
  }
}

class TranscriptUnavailableError extends Error {
  constructor(message = 'Transcript is unavailable for this video', provider = null) {
    super(message);
    this.name = 'TranscriptUnavailableError';
    this.provider = provider;
    this.status = 404;
  }
}

module.exports = {
  BaseTranscriptProvider,
  TranscriptUnavailableError,
};

