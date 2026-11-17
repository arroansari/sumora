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

  /**
   * Generates structured JSON with automatic provider failover on rate limits (429 / RESOURCE_EXHAUSTED).
   * @param {object} params
   * @param {string} params.prompt
   * @param {string} [params.systemInstruction]
   * @param {string} [params.videoUrl]
   * @param {import('./ai.provider').BaseAIProvider} [params.preferredProvider]
   */
  async generateStructuredJson({ prompt, systemInstruction, videoUrl = null, preferredProvider = null }) {
    const primary = preferredProvider || this.getActiveProvider();

    try {
      return await primary.generateStructuredJson({ prompt, systemInstruction, videoUrl });
    } catch (primaryErr) {
      const isRateLimit =
        primaryErr.message?.includes('RESOURCE_EXHAUSTED') ||
        primaryErr.message?.includes('429') ||
        primaryErr.message?.includes('rate_limit') ||
        primaryErr.message?.includes('Quota exceeded');

      if (isRateLimit) {
        console.warn(`[AIService] ⚠️ Rate limit / quota exceeded on primary provider "${primary.name}". Attempting fallback provider...`);
        const fallbackName = primary.name === 'gemini' ? 'openai' : 'gemini';
        const fallback = this.providers.get(fallbackName);

        if (fallback && fallback.client) {
          console.log(`[AIService] 🔀 Seamlessly switched to fallback provider "${fallback.name}"`);
          return await fallback.generateStructuredJson({ prompt, systemInstruction, videoUrl });
        }
      }

      throw primaryErr;
    }
  }
}

module.exports = new AIService();

