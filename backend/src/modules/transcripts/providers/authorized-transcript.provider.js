const { BaseTranscriptProvider, TranscriptUnavailableError } = require('../transcript.provider');

class AuthorizedTranscriptProvider extends BaseTranscriptProvider {
  get name() {
    return 'authorized_provider';
  }

  async canHandle(videoId, options = {}) {
    // Active when authorized partner options or pre-cleared transcript feed exists
    return Boolean(options.partnerApiUrl || options.authorizedTranscriptFeed);
  }

  async fetchTranscript(videoId, options = {}) {
    if (!options.partnerApiUrl && !options.authorizedTranscriptFeed) {
      throw new TranscriptUnavailableError(
        'Authorized partner transcript service is not configured for this video',
        this.name
      );
    }

    // Adaptor logic for authorized third-party partner or syndication feed
    if (options.authorizedTranscriptFeed) {
      return {
        language: options.language || 'en',
        segments: options.authorizedTranscriptFeed,
      };
    }

    throw new TranscriptUnavailableError('Partner API did not return a valid transcript', this.name);
  }
}

module.exports = AuthorizedTranscriptProvider;

