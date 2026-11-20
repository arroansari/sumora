const { z } = require('zod');

// Flexible string: handles string, array of strings (joins with ' • '), number, or null
const flexibleString = z
  .union([z.string(), z.array(z.any()), z.number()])
  .optional()
  .nullable()
  .transform((val) => {
    if (Array.isArray(val)) {
      return val.map((x) => String(x).trim()).filter(Boolean).join(' • ');
    }
    if (typeof val === 'number') return String(val);
    return (val || '').trim();
  });

// Flexible string array: handles array of strings, or single string (splits by newlines/bullets), or empty
const flexibleStringArray = z
  .union([z.array(z.any()), z.string(), z.number()])
  .optional()
  .nullable()
  .transform((val) => {
    if (Array.isArray(val)) {
      return val.map((x) => String(x).trim()).filter(Boolean);
    }
    if (typeof val === 'string' && val.trim()) {
      return val.split(/\n|•/).map((x) => x.trim()).filter(Boolean);
    }
    if (typeof val === 'number') return [String(val)];
    return [];
  });

const conceptItemSchema = z.union([
  z.object({
    concept: z.string().trim().min(1),
    explanation: flexibleString,
  }),
  z.string().trim().min(1).transform((val) => ({
    concept: val,
    explanation: 'Concept referenced in video discussion.',
  })),
]);

const videoOverviewSchema = z
  .object({
    title: flexibleString,
    channel: flexibleString,
    duration: flexibleString,
    mainSubject: flexibleString,
    mainPurpose: flexibleString,
    whatViewerLearns: flexibleString,
  })
  .optional()
  .nullable();

const backgroundAndContextSchema = z
  .object({
    whyDiscussed: flexibleString,
    precedingEvents: flexibleString,
    keyEntities: flexibleStringArray,
    historicalOrTechnicalContext: flexibleString,
    whyItMatters: flexibleString,
  })
  .optional()
  .nullable();

const breakdownItemSchema = z.object({
  timestampRange: flexibleString,
  topic: flexibleString,
  explanation: flexibleString,
  developments: flexibleString,
  keyFigures: flexibleStringArray,
  evidenceOrNumbers: flexibleString,
  significance: flexibleString,
});

const actualEventsAndClaimsSchema = z
  .object({
    establishedFacts: flexibleStringArray,
    speakerClaims: flexibleStringArray,
    allegationsAndAccusations: flexibleStringArray,
    opinionsAndInterpretations: flexibleStringArray,
    unverifiedOrDisputed: flexibleStringArray,
  })
  .optional()
  .nullable();

const personOrOrgSchema = z.object({
  name: flexibleString,
  role: flexibleString,
  context: flexibleString,
  connection: flexibleString,
});

const pronunciationItemSchema = z.object({
  term: flexibleString,
  readablePhonetic: flexibleString,
  ipa: flexibleString,
  meaning: flexibleString,
  contextInVideo: flexibleString,
});

const statementItemSchema = z.object({
  statement: flexibleString,
  isDirectQuote: z.boolean().optional().default(false),
  context: flexibleString,
  significance: flexibleString,
});

const exampleItemSchema = z.object({
  example: flexibleString,
  explanation: flexibleString,
  purpose: flexibleString,
});

const finalConclusionSchema = z
  .object({
    bottomLine: flexibleString,
    supportingArguments: flexibleStringArray,
    unansweredQuestions: flexibleString,
  })
  .optional()
  .nullable();

const timestampItemSchema = z.object({
  timestamp: flexibleString,
  label: flexibleString,
  seconds: z.number().optional().default(0),
});

const videoSummaryOutputSchema = z.object({
  // Legacy / core compatible fields
  overview: z
    .union([z.string(), z.array(z.any()), z.number()])
    .transform((val) => {
      if (Array.isArray(val)) return val.map((x) => String(x).trim()).filter(Boolean).join(' • ');
      if (typeof val === 'number') return String(val);
      return (val || '').trim();
    })
    .pipe(z.string().min(5, 'Overview is required')),
  keyPoints: flexibleStringArray,
  importantConcepts: z.array(conceptItemSchema).default([]),
  detailedSummary: z
    .union([z.string(), z.array(z.any()), z.number()])
    .transform((val) => {
      if (Array.isArray(val)) return val.map((x) => String(x).trim()).filter(Boolean).join('\n\n');
      if (typeof val === 'number') return String(val);
      return (val || '').trim();
    })
    .pipe(z.string().min(5, 'Detailed summary is required')),
  conclusion: z
    .union([z.string(), z.array(z.any()), z.number()])
    .transform((val) => {
      if (Array.isArray(val)) return val.map((x) => String(x).trim()).filter(Boolean).join(' • ');
      if (typeof val === 'number') return String(val);
      return (val || '').trim();
    })
    .pipe(z.string().min(2, 'Conclusion is required')),
  topicsCovered: flexibleStringArray,
  originalVideoUrl: z.string().optional().default(''),

  // 11-section advanced fields
  videoOverview: videoOverviewSchema,
  backgroundAndContext: backgroundAndContextSchema,
  detailedBreakdown: z.array(breakdownItemSchema).optional().default([]),
  actualEventsAndClaims: actualEventsAndClaimsSchema,
  peopleAndOrganizations: z.array(personOrOrgSchema).optional().default([]),
  pronunciationGuide: z.array(pronunciationItemSchema).optional().default([]),
  importantStatements: z.array(statementItemSchema).optional().default([]),
  examplesAndConnections: z.array(exampleItemSchema).optional().default([]),
  finalConclusion: finalConclusionSchema,
  keyTakeaways: flexibleStringArray,
  importantTimestamps: z.array(timestampItemSchema).optional().default([]),
});

/**
 * Validates and normalizes structured output from the AI model.
 * @param {object} rawOutput - Raw JSON parsed from AI response
 * @returns {object} Validated and formatted summary object
 */
function validateStructuredSummary(rawOutput) {
  if (!rawOutput || typeof rawOutput !== 'object') {
    throw new Error('Summary output must be a valid object');
  }

  // ── Support for Lean 5-Section Schema ──
  if (rawOutput.summary) {
    rawOutput.overview = rawOutput.summary;
    rawOutput.detailedSummary = rawOutput.summary;
  }
  if (rawOutput.highlights && Array.isArray(rawOutput.highlights) && rawOutput.highlights.length > 0) {
    rawOutput.keyPoints = rawOutput.highlights;
    rawOutput.keyTakeaways = rawOutput.highlights;
  }
  if (Array.isArray(rawOutput.keyInsights) && rawOutput.keyInsights.length > 0) {
    rawOutput.importantConcepts = rawOutput.keyInsights.map((ki) => ({
      concept: ki.heading || ki.concept || 'Key Insight',
      explanation: ki.explanation || ki.text || '',
      timestamp: ki.timestamp || undefined,
    }));
  }
  if (rawOutput.title) {
    const cleanTitle = String(rawOutput.title).replace(/^#+\s*/, '').trim();
    rawOutput.videoOverview = {
      ...(rawOutput.videoOverview || {}),
      title: cleanTitle,
      mainSubject: cleanTitle,
      whatViewerLearns: rawOutput.summary || rawOutput.overview,
    };
  }

  // ── Fallbacks for legacy 11-section schema ──
  if (!rawOutput.overview && rawOutput.videoOverview?.whatViewerLearns) {
    rawOutput.overview = rawOutput.videoOverview.whatViewerLearns;
  }
  if ((!rawOutput.keyPoints || rawOutput.keyPoints.length === 0) && rawOutput.keyTakeaways?.length > 0) {
    rawOutput.keyPoints = rawOutput.keyTakeaways;
  }
  if (!rawOutput.conclusion && rawOutput.finalConclusion?.bottomLine) {
    rawOutput.conclusion = rawOutput.finalConclusion.bottomLine;
  }
  if (!rawOutput.detailedSummary && rawOutput.detailedBreakdown?.length > 0) {
    rawOutput.detailedSummary = rawOutput.detailedBreakdown
      .map((b) => `### ${b.timestampRange ? `[${b.timestampRange}] ` : ''}${b.topic}\n\n${b.explanation}`)
      .join('\n\n');
  }

  // Ensure topicsCovered has sensible default if missing
  if (!rawOutput.topicsCovered || !Array.isArray(rawOutput.topicsCovered) || rawOutput.topicsCovered.length === 0) {
    rawOutput.topicsCovered = ['Executive Summary', 'Key Insights'];
  }

  return videoSummaryOutputSchema.parse(rawOutput);
}

module.exports = {
  videoSummaryOutputSchema,
  validateStructuredSummary,
};
