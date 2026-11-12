const aiService = require('./ai.service');
const summarizationService = require('./summarization.service');
const { BaseAIProvider, AIProviderError } = require('./ai.provider');
const { validateStructuredSummary, videoSummaryOutputSchema } = require('./summarization.validator');
const GeminiProvider = require('./providers/gemini.provider');
const OpenAIProvider = require('./providers/openai.provider');
const MockAIProvider = require('./providers/mock.provider');
const prompts = require('./prompts/video-summary.prompt');

module.exports = {
  aiService,
  summarizationService,
  BaseAIProvider,
  AIProviderError,
  validateStructuredSummary,
  videoSummaryOutputSchema,
  GeminiProvider,
  OpenAIProvider,
  MockAIProvider,
  prompts,
};
