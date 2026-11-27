const OpenAI = require('openai');
const { BaseAIProvider, AIProviderError } = require('../ai.provider');
const config = require('../../../config');

class OpenAIProvider extends BaseAIProvider {
  constructor(apiKeyOrList = config.ai.openaiApiKeys?.length ? config.ai.openaiApiKeys : config.ai.openaiApiKey, modelName = 'gpt-4o-mini') {
    super();
    const rawKeys = Array.isArray(apiKeyOrList) ? apiKeyOrList : [apiKeyOrList];
    this.apiKeys = rawKeys.map((k) => (typeof k === 'string' ? k.trim() : '')).filter(Boolean);
    this.apiKey = this.apiKeys[0] || '';
    this._modelName = modelName;
    this._keyIndex = 0;
    this._clients = new Map();

    const timeout = config.ai?.requestTimeoutMs || 10000;
    for (const key of this.apiKeys) {
      this._clients.set(key, new OpenAI({ apiKey: key, timeout }));
    }
    this.client = this.apiKey ? this._clients.get(this.apiKey) : undefined;
  }

  get name() {
    return 'openai';
  }

  get modelName() {
    return this._modelName;
  }

  _nextClient() {
    if (this.apiKeys.length === 0) return null;
    const key = this.apiKeys[this._keyIndex % this.apiKeys.length];
    this._keyIndex = (this._keyIndex + 1) % this.apiKeys.length;
    return this._clients.get(key);
  }

  async generateStructuredJson({ prompt, systemInstruction, onDelta = null }) {
    if (this.apiKeys.length === 0) {
      throw new AIProviderError('OPENAI_API_KEY is not configured', this.name);
    }

    const messages = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    let lastError = null;
    for (let i = 0; i < this.apiKeys.length; i++) {
      const client = this._nextClient();
      try {
        let content = '';
        if (typeof onDelta === 'function') {
          const stream = await client.chat.completions.create({
            model: this._modelName,
            messages,
            response_format: { type: 'json_object' },
            temperature: 0.2,
            max_tokens: 1200,
            stream: true,
          });
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || '';
            if (delta) {
              content += delta;
              onDelta(delta, content);
            }
          }
        } else {
          const response = await client.chat.completions.create({
            model: this._modelName,
            messages,
            response_format: { type: 'json_object' },
            temperature: 0.2,
            max_tokens: 1200,
          });
          content = response.choices[0]?.message?.content || '';
        }

        if (!content) {
          throw new AIProviderError('Empty response received from OpenAI', this.name);
        }

        return JSON.parse(content);
      } catch (error) {
        lastError = error;
        const status = error?.status || error?.response?.status;
        if (status === 429 && i + 1 < this.apiKeys.length) {
          continue; // Rotate immediately to next OpenAI key
        }
        if (error instanceof AIProviderError && i + 1 >= this.apiKeys.length) {
          throw error;
        }
      }
    }

    throw new AIProviderError(`OpenAI generation failed: ${lastError?.message}`, this.name, lastError);
  }
}

module.exports = OpenAIProvider;
