const { GoogleGenerativeAI } = require('@google/generative-ai');
const { BaseAIProvider, AIProviderError } = require('../ai.provider');
const config = require('../../../config');

function withTimeout(promise, ms, label) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

class GeminiProvider extends BaseAIProvider {
  constructor(apiKeyOrList = config.ai.geminiApiKeys?.length ? config.ai.geminiApiKeys : config.ai.geminiApiKey, modelName = 'gemini-3.1-flash-lite') {
    super();
    const rawKeys = Array.isArray(apiKeyOrList) ? apiKeyOrList : [apiKeyOrList];
    this.apiKeys = rawKeys.map((k) => (typeof k === 'string' ? k.trim() : '')).filter(Boolean);
    this.apiKey = this.apiKeys[0] || '';
    this._modelName = modelName;
    this._keyIndex = 0;
    this._cooldownUntil = new Map();
    this._clients = new Map();
    this._disableThinkingFlag = false;

    for (const key of this.apiKeys) {
      this._clients.set(key, new GoogleGenerativeAI(key));
    }
    this.client = this.apiKey ? this._clients.get(this.apiKey) : undefined;
  }

  get name() {
    return 'gemini';
  }

  get modelName() {
    return this._modelName;
  }

  _pickHealthyKeys() {
    if (this.apiKeys.length === 0) return [];
    const now = Date.now();
    const ordered = [];
    for (let i = 0; i < this.apiKeys.length; i++) {
      const idx = (this._keyIndex + i) % this.apiKeys.length;
      const key = this.apiKeys[idx];
      const cooldown = this._cooldownUntil.get(key) || 0;
      if (cooldown <= now) {
        ordered.push(key);
      }
    }
    this._keyIndex = (this._keyIndex + 1) % this.apiKeys.length;
    // If all keys are on brief cooldown, try them in order rather than refusing immediately
    return ordered.length > 0 ? ordered : [...this.apiKeys];
  }

  async generateStructuredJson({ prompt, systemInstruction, videoUrl, onDelta = null }) {
    if (this.apiKeys.length === 0) {
      throw new AIProviderError('GEMINI_API_KEY is not configured', this.name);
    }

    const fallbackModels = [
      this._modelName,
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.8-flash',
    ].filter((m, i, arr) => m && arr.indexOf(m) === i);

    const timeoutMs = videoUrl
      ? config.ai?.videoTimeoutMs || 40000
      : config.ai?.requestTimeoutMs || 10000;

    let lastError = null;
    const keysToTry = this._pickHealthyKeys();

    for (const modelToTry of fallbackModels) {
      for (const apiKey of keysToTry) {
        const client = this._clients.get(apiKey);
        const maxAttempts = keysToTry.length > 1 ? 1 : 2;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const generationConfig = {
              responseMimeType: 'application/json',
              temperature: 0.2,
              maxOutputTokens: 1200,
              ...(!this._disableThinkingFlag ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
            };

            const model = client.getGenerativeModel({
              model: modelToTry,
              systemInstruction: systemInstruction || undefined,
              generationConfig,
            });

            const contents = videoUrl
              ? [{ fileData: { fileUri: videoUrl, mimeType: 'video/*' } }, prompt]
              : prompt;

            let responseText = '';
            if (typeof onDelta === 'function' && typeof model.generateContentStream === 'function') {
              const streamRes = await withTimeout(
                model.generateContentStream(contents),
                timeoutMs,
                `Gemini stream (${modelToTry})`
              );
              for await (const chunk of streamRes.stream) {
                const delta = chunk.text();
                if (delta) {
                  responseText += delta;
                  onDelta(delta, responseText);
                }
              }
            } else {
              const result = await withTimeout(
                model.generateContent(contents),
                timeoutMs,
                `Gemini request (${modelToTry})`
              );
              responseText = result.response.text();
            }

            try {
              return JSON.parse(responseText);
            } catch (parseError) {
              throw new AIProviderError(
                `Failed to parse Gemini JSON output: ${parseError.message}`,
                this.name,
                parseError
              );
            }
          } catch (error) {
            lastError = error;
            const msg = error?.message || '';

            // Auto-recover cleanly if an older model rejects thinkingConfig
            if (!this._disableThinkingFlag && (msg.includes('thinkingConfig') || msg.includes('thinking_budget'))) {
              this._disableThinkingFlag = true;
              continue;
            }

            const isRateLimited = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
            if (isRateLimited) {
              this._cooldownUntil.set(apiKey, Date.now() + 25000);
              console.warn(`[GeminiProvider] Key throttled (429) on ${modelToTry}; rotating immediately.`);
              break; // Rotate to next healthy API key or fail over quickly
            }

            const isTemporary = msg.includes('503') || msg.includes('high demand') || msg.includes('timed out');
            if (isTemporary && attempt < maxAttempts) {
              await new Promise((r) => setTimeout(r, 350));
              continue;
            }

            console.warn(`[GeminiProvider] Model ${modelToTry} failed: ${msg}`);
            break;
          }
        }
      }
    }

    throw new AIProviderError(
      `Gemini generation failed across keys/models: ${lastError?.message}`,
      this.name,
      lastError
    );
  }
}

module.exports = GeminiProvider;
