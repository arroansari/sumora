/**
 * Abstract Base Class for AI Providers.
 */
class BaseAIProvider {
  /**
   * Unique name of the AI provider (e.g. "gemini", "openai")
   * @returns {string}
   */
  get name() {
    throw new Error('AI provider must implement getter: name');
  }

  /**
   * Default or configured model name (e.g. "gemini-1.5-flash", "gpt-4o-mini")
   * @returns {string}
   */
  get modelName() {
    throw new Error('AI provider must implement getter: modelName');
  }

  /**
   * Generates a structured JSON response from the given prompt.
   * @param {object} params
   * @param {string} params.prompt - User prompt
   * @param {string} [params.systemInstruction] - System prompt / role instructions
   * @param {object} [params.schema] - Optional schema definition
   * @returns {Promise<object>} Parsed JSON object
   */
  async generateStructuredJson({ prompt, systemInstruction, schema }) {
    throw new Error(`Provider ${this.name} must implement generateStructuredJson()`);
  }
}

class AIProviderError extends Error {
  constructor(message, provider = null, originalError = null) {
    super(message);
    this.name = 'AIProviderError';
    this.provider = provider;
    this.originalError = originalError;
  }
}

module.exports = {
  BaseAIProvider,
  AIProviderError,
};

