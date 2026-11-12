const transcriptRoutes = require('./transcript.routes');
const transcriptService = require('./transcript.service');
const transcriptController = require('./transcript.controller');
const transcriptFactory = require('./transcript.factory');
const { BaseTranscriptProvider, TranscriptUnavailableError } = require('./transcript.provider');
const { normalizeTranscript, cleanSegmentText } = require('./transcript.processor');
const { validateNormalizedTranscript } = require('./transcript.validator');

module.exports = {
  transcriptRoutes,
  transcriptService,
  transcriptController,
  transcriptFactory,
  BaseTranscriptProvider,
  TranscriptUnavailableError,
  normalizeTranscript,
  cleanSegmentText,
  validateNormalizedTranscript,
};
