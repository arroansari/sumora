const { GoogleGenerativeAI } = require('@google/generative-ai');
const { BaseAIProvider, AIProviderError } = require('../ai.provider');
const config = require('../../../config');

class GeminiProvider extends BaseAIProvider {
  constructor(apiKey = config.ai.geminiApiKey, modelName = 'gemini-3.1-flash-lite') {
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

  async generateStructuredJson({ prompt, systemInstruction, videoUrl }) {
    if (!this.apiKey) {
      throw new AIProviderError('GEMINI_API_KEY is not configured', this.name);
    }

    const fallbackModels = [
      this._modelName,
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.8-flash',
    ].filter((m, i, arr) => m && arr.indexOf(m) === i);
    let lastError = null;

    for (const modelToTry of fallbackModels) {
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          const model = this.client.getGenerativeModel({
            model: modelToTry,
            systemInstruction: systemInstruction || undefined,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2, // Low temperature for factual accuracy
              maxOutputTokens: 1200,
            },
          });

          const contents = videoUrl
            ? [
                {
                  fileData: {
                    fileUri: videoUrl,
                    mimeType: 'video/*',
                  },
                },
                prompt,
              ]
            : prompt;

          const result = await model.generateContent(contents);
          const responseText = result.response.text();

          try {
            return JSON.parse(responseText);
          } catch (parseError) {
            throw new AIProviderError(`Failed to parse Gemini JSON output: ${parseError.message}`, this.name, parseError);
          }
        } catch (error) {
          lastError = error;
          const isTemporary =
            error.message?.includes('503') ||
            error.message?.includes('429') ||
            error.message?.includes('high demand') ||
            error.message?.includes('RESOURCE_EXHAUSTED');

          if (isTemporary && attempts < maxAttempts) {
            const backoffMs = attempts * 1500;
            console.warn(
              `[GeminiProvider] Model ${modelToTry} experienced temporary demand spike (${error.message.slice(0, 80)}). Retrying attempt ${attempts + 1}/${maxAttempts} in ${backoffMs}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            continue;
          }

          console.warn(`[GeminiProvider] Model ${modelToTry} failed: ${error.message}.`);
          break; // Move to next fallback model
        }
      }
    }

    throw new AIProviderError(`Gemini generation failed on all models: ${lastError?.message}`, this.name, lastError);
  }
}

module.exports = GeminiProvider;

