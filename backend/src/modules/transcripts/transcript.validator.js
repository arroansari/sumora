const { z } = require('zod');

const segmentSchema = z.object({
  start: z.number().min(0),
  duration: z.number().min(0),
  text: z.string().trim().min(1),
});

const normalizedTranscriptSchema = z.object({
  videoId: z.string().min(1),
  language: z.string().min(2),
  source: z.string().min(1),
  segments: z.array(segmentSchema).min(1, 'Transcript must contain at least one valid text segment'),
  fullText: z.string().trim().min(10, 'Transcript text is too short to be viable'),
  status: z.enum(['completed', 'unavailable', 'failed']),
});

/**
 * Validates raw segments received from a provider before processing.
 * @param {Array} segments
 * @returns {boolean}
 */
function validateRawSegments(segments) {
  if (!Array.isArray(segments) || segments.length === 0) {
    return false;
  }
  const hasText = segments.some((s) => s && typeof s.text === 'string' && s.text.trim().length > 0);
  return hasText;
}

/**
 * Validates a completed Normalized Transcript object against the strict schema.
 * @param {object} transcript
 * @returns {object} validated object
 */
function validateNormalizedTranscript(transcript) {
  return normalizedTranscriptSchema.parse(transcript);
}

module.exports = {
  validateRawSegments,
  validateNormalizedTranscript,
  normalizedTranscriptSchema,
};

