const { GoogleGenerativeAI } = require('@google/generative-ai');
const { BaseAIProvider, AIProviderError } = require('../ai.provider');
const config = require('../../../config');

class GeminiProvider extends BaseAIProvider {
  constructor(apiKey = config.ai.geminiApiKey, modelName = 'gemini-3.5-flash') {
    super();
    this.apiKey = apiKey;
    this._modelName = modelName;
    if (this.apiKey) {
      this.client = new GoogleGenerativeAI(this.apiKey);
    }
  }

  get name() {
    return 'gemini';
  }

  get modelName() {
    return this._modelName;
  }

  async generateStructuredJson({ prompt, systemInstruction }) {
    if (!this.apiKey) {
      throw new AIProviderError('GEMINI_API_KEY is not configured', this.name);
    }

    try {
      const model = this.client.getGenerativeModel({
        model: this._modelName,
        systemInstruction: systemInstruction || undefined,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2, // Low temperature for factual accuracy
        },
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        throw new AIProviderError(`Failed to parse Gemini JSON output: ${parseError.message}`, this.name, parseError);
      }
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }
      throw new AIProviderError(`Gemini generation failed: ${error.message}`, this.name, error);
    }
  }
}

module.exports = GeminiProvider;

