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
  async generateStructuredJson({ prompt, systemInstruction, videoUrl = null, preferredProvider = null, onDelta = null }) {
    const primary = preferredProvider || this.getActiveProvider();

    try {
      return await primary.generateStructuredJson({ prompt, systemInstruction, videoUrl, onDelta });
    } catch (primaryErr) {
      const msg = primaryErr?.message || '';
      const isFailoverWorthy =
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('429') ||
        msg.includes('rate_limit') ||
        msg.includes('Quota exceeded') ||
        msg.includes('timed out') ||
        msg.includes('503');

      if (isFailoverWorthy) {
        console.warn(`[AIService] ⚠️ Failover triggered from "${primary.name}" (${msg.slice(0, 80)}). Switching provider...`);
        const fallbackName = primary.name === 'gemini' ? 'openai' : 'gemini';
        const fallback = this.providers.get(fallbackName);

        if (fallback && fallback.client && !videoUrl) {
          console.log(`[AIService] 🔀 Switched cleanly to fallback provider "${fallback.name}"`);
          return await fallback.generateStructuredJson({ prompt, systemInstruction, videoUrl, onDelta });
        }
      }

      throw primaryErr;
    }
  }
}

module.exports = new AIService();

