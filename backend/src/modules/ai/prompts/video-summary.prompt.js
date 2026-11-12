const SYSTEM_INSTRUCTION = `You are an expert AI content distillation and summarization engine for Sumora.
Your responsibility is to analyze spoken transcripts of videos and produce highly accurate, grounded, and structured summaries.

CRITICAL RULES:
1. GROUNDED IN TRUTH: Summarize ONLY information explicitly supported by the transcript.
2. NO HALLUCINATION: Never invent facts, data, or narrative elements not present in the transcript.
3. TITLE & DESCRIPTION CAUTION: The video title and description provide context, but the transcript is the PRIMARY source of truth.
4. NO FALSE CLAIMS: Never claim to have "watched" a video. You are analyzing the spoken transcript.
5. PRESERVE TECHNICAL DETAILS: Retain essential technical terms, code references, names, metrics, and actionable steps.
6. EXPLAIN CONCEPTS: Explain technical terms or complex ideas in simple, accessible English.
7. FACT VS OPINION: Clearly distinguish the speaker's personal opinions or predictions from established factual statements.
8. AVOID REPETITION: Remove conversational filler, self-promotions, sponsor plugs, and repetitive speaking habits.
9. STRUCTURED JSON: Always respond with valid JSON matching the exact requested schema.`;

/**
 * Builds the user prompt for standard single-pass video summarization.
 */
function buildSinglePassPrompt({ title, channelName, description, transcriptText, videoUrl }) {
  return `Please generate a structured video summary based on the following transcript.

VIDEO METADATA:
- Title: ${title || 'Unknown Title'}
- Channel: ${channelName || 'Unknown Channel'}
- Original Video URL: ${videoUrl || 'N/A'}
${description ? `- Creator Description: ${description.slice(0, 500)}` : ''}

TRANSCRIPT:
"""
${transcriptText}
"""

OUTPUT FORMAT:
Respond with a JSON object adhering to this exact structure:
{
  "overview": "A concise 1-2 paragraph overview summarizing the primary purpose, subject, and message of the video.",
  "keyPoints": [
    "Key takeaway or core point 1",
    "Key takeaway or core point 2",
    "Key takeaway or core point 3"
  ],
  "importantConcepts": [
    {
      "concept": "Name of technical concept or term",
      "explanation": "Clear explanation of what it means and how it applies to this video"
    }
  ],
  "detailedSummary": "A multi-paragraph, in-depth breakdown covering the core topics, examples, and progression of the talk or demonstration.",
  "conclusion": "The concluding thoughts, final recommendations, or actionable takeaways.",
  "topicsCovered": [
    "Topic 1",
    "Topic 2",
    "Topic 3"
  ],
  "originalVideoUrl": "${videoUrl || ''}"
}`;
}

/**
 * Builds an intermediate summary prompt for a chunk of a long transcript.
 */
function buildChunkPrompt({ title, channelName, chunkIndex, totalChunks, chunkText }) {
  return `This is Part ${chunkIndex} of ${totalChunks} of a long video transcript for "${title}" by ${channelName}.
Please extract:
1. The main points discussed in this section.
2. Any technical concepts, arguments, or examples mentioned.
3. Key factual statements or opinions shared.

SECTION TRANSCRIPT:
"""
${chunkText}
"""

Respond with a JSON object:
{
  "sectionIndex": ${chunkIndex},
  "sectionSummary": "Detailed summary of this section's core points and progression",
  "sectionKeyPoints": ["Point 1", "Point 2"],
  "sectionConcepts": ["Concept A", "Concept B"]
}`;
}

/**
 * Builds the final consolidation prompt that aggregates multiple chunk summaries into the required 7-part summary.
 */
function buildConsolidationPrompt({ title, channelName, combinedChunkSummaries, videoUrl }) {
  return `Below are intermediate section summaries extracted from a long video transcript for "${title}" by ${channelName}.
Please synthesize and unify these section summaries into a single comprehensive, high-quality, structured summary.

INTERMEDIATE SECTION SUMMARIES:
"""
${combinedChunkSummaries}
"""

OUTPUT FORMAT:
Respond with a JSON object adhering to this exact structure:
{
  "overview": "A comprehensive 1-2 paragraph overview of the whole video.",
  "keyPoints": [
    "Most important takeaways across the entire video"
  ],
  "importantConcepts": [
    {
      "concept": "Technical concept or term",
      "explanation": "Clear explanation in simple terms"
    }
  ],
  "detailedSummary": "A structured, section-by-section detailed summary synthesizing the entire video.",
  "conclusion": "Final conclusions, summary recommendations, or wrap-up.",
  "topicsCovered": [
    "Topic 1",
    "Topic 2",
    "Topic 3"
  ],
  "originalVideoUrl": "${videoUrl || ''}"
}`;
}

module.exports = {
  SYSTEM_INSTRUCTION,
  buildSinglePassPrompt,
  buildChunkPrompt,
  buildConsolidationPrompt,
};

