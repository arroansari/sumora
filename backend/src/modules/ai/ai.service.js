const config = require('../../config');
const GeminiProvider = require('./providers/gemini.provider');
const OpenAIProvider = require('./providers/openai.provider');
const MockAIProvider = require('./providers/mock.provider');

class AIService {
  constructor() {
    this.providers = new Map();
    this.registerProvider(new GeminiProvider());
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new MockAIProvider());

    this.activeProviderName = config.ai.provider || 'gemini';
  }

  registerProvider(provider) {
    this.providers.set(provider.name, provider);
  }

  setActiveProvider(name) {
    if (!this.providers.has(name)) {
      throw new Error(`AI Provider "${name}" is not registered`);
    }
    this.activeProviderName = name;
  }

  getActiveProvider() {
    // If configured provider has no API key in development/test, fallback to mock if test env
    const provider = this.providers.get(this.activeProviderName);
    if (!provider) {
      return this.providers.get('mock');
    }
    return provider;
  }
}

module.exports = new AIService();

