const OpenAI = require('openai');
const { BaseAIProvider, AIProviderError } = require('../ai.provider');
const config = require('../../../config');

class OpenAIProvider extends BaseAIProvider {
  constructor(apiKey = config.ai.openaiApiKey, modelName = 'gpt-4o-mini') {
    super();
    this.apiKey = apiKey;
    this._modelName = modelName;
    if (this.apiKey) {
      this.client = new OpenAI({ apiKey: this.apiKey });
    }
  }

  get name() {
    return 'openai';
  }

  get modelName() {
    return this._modelName;
  }

  async generateStructuredJson({ prompt, systemInstruction }) {
    if (!this.apiKey) {
      throw new AIProviderError('OPENAI_API_KEY is not configured', this.name);
    }

    try {
      const messages = [];
      if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await this.client.chat.completions.create({
        model: this._modelName,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AIProviderError('Empty response received from OpenAI', this.name);
      }

      return JSON.parse(content);
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(`OpenAI generation failed: ${error.message}`, this.name, error);
    }
  }
}

module.exports = OpenAIProvider;

