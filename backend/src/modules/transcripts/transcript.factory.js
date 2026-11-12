const YouTubeCaptionsProvider = require('./providers/youtube-captions.provider');
const AuthorizedTranscriptProvider = require('./providers/authorized-transcript.provider');
const UserProvidedTranscriptProvider = require('./providers/user-provided-transcript.provider');

class TranscriptFactory {
  constructor() {
    this.providers = new Map();
    this.priorityOrder = [];

    // Register default providers
    this.registerProvider(new YouTubeCaptionsProvider());
    this.registerProvider(new AuthorizedTranscriptProvider());
    this.registerProvider(new UserProvidedTranscriptProvider());

    // Default priority order
    this.setPriority(['youtube_captions', 'authorized_provider', 'user_provided']);
  }

  /**
   * Registers a new transcript provider instance.
   * @param {import('./transcript.provider').BaseTranscriptProvider} provider
   */
  registerProvider(provider) {
    if (!provider || !provider.name) {
      throw new Error('Provider must be an instance of BaseTranscriptProvider with a valid name');
    }
    this.providers.set(provider.name, provider);
    if (!this.priorityOrder.includes(provider.name)) {
      this.priorityOrder.push(provider.name);
    }
  }

  /**
   * Unregisters a provider by name.
   * @param {string} name
   */
  unregisterProvider(name) {
    this.providers.delete(name);
    this.priorityOrder = this.priorityOrder.filter((p) => p !== name);
  }

  /**
   * Updates the priority order of providers.
   * @param {string[]} order - Array of provider names
   */
  setPriority(order) {
    if (!Array.isArray(order)) {
      throw new Error('Priority order must be an array of provider names');
    }
    this.priorityOrder = order.filter((name) => this.providers.has(name));
  }

  /**
   * Returns registered provider instances in active priority order.
   * @returns {Array<import('./transcript.provider').BaseTranscriptProvider>}
   */
  getProvidersInPriorityOrder() {
    return this.priorityOrder
      .map((name) => this.providers.get(name))
      .filter(Boolean);
  }

  /**
   * Retrieves a specific provider by name.
   * @param {string} name
   */
  getProvider(name) {
    return this.providers.get(name) || null;
  }
}

module.exports = new TranscriptFactory();

