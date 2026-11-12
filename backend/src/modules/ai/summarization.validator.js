const { z } = require('zod');

const conceptItemSchema = z.union([
  z.object({
    concept: z.string().trim().min(1),
    explanation: z.string().trim().min(1),
  }),
  z.string().trim().min(1).transform((val) => ({
    concept: val,
    explanation: 'Concept referenced in video discussion.',
  })),
]);

const videoSummaryOutputSchema = z.object({
  overview: z.string().trim().min(10, 'Overview must be at least 10 characters long'),
  keyPoints: z.array(z.string().trim().min(1)).min(1, 'At least one key point is required'),
  importantConcepts: z.array(conceptItemSchema).default([]),
  detailedSummary: z.string().trim().min(20, 'Detailed summary must be at least 20 characters long'),
  conclusion: z.string().trim().min(5, 'Conclusion must be at least 5 characters long'),
  topicsCovered: z.array(z.string().trim().min(1)).min(1, 'At least one topic must be listed'),
  originalVideoUrl: z.string().optional().default(''),
});

/**
 * Validates and normalizes structured output from the AI model.
 * @param {object} rawOutput - Raw JSON parsed from AI response
 * @returns {object} Validated and formatted summary object
 */
function validateStructuredSummary(rawOutput) {
  return videoSummaryOutputSchema.parse(rawOutput);
}

module.exports = {
  videoSummaryOutputSchema,
  validateStructuredSummary,
};

