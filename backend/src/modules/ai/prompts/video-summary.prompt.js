/**
 * Lean 5-Section Video Summarization Prompts for Sumora.
 * Produces structured, dense, highly readable executive summaries:
 * 1. Title (#)
 * 2. Summary (comprehensive narrative paragraph)
 * 3. Highlights (5-8 concise bullet points with emojis)
 * 4. Key Insights (4-6 detailed insights with bold heading, reasoning, and context)
 * 5. Conclusion (1 comprehensive closing paragraph)
 *
 * Ultra-low token footprint (~450-700 tokens), zero fluff, grounded strictly in the transcript.
 */

const SYSTEM_INSTRUCTION = `You are Sumora's ultra-fast AI video briefing engine.
Distill the video transcript into an exact, punchy, executive briefing.

STRICT LENGTH & QUALITY RULES:
1. FACTUAL ACCURACY: Ground everything strictly in the transcript. Discard filler, repetitive banter, and minor details. Keep ONLY the core substance.
2. STRICT LENGTH CAPS (TOTAL OUTPUT MUST BE UNDER 300 WORDS):
   - title: Short engaging title starting with "# ".
   - summary: Exactly 1 dense, informative paragraph (70–100 words max) covering the main subject, background context, key event, and outcome.
   - highlights: Exactly 5 concise bullet points (10–15 words each), each starting with a relevant emoji. Cover the 5 biggest facts/events.
   - keyInsights: Exactly 3 high-impact insights. Each must have a "heading" (bold conceptual takeaway) and an "explanation" (1–2 sentences explaining WHY it matters with evidence/reasoning, max 25 words). Optional "timestamp" (MM:SS) if relevant.
   - conclusion: Exactly 1 punchy takeaway sentence (20–30 words max) summarizing the bottom-line lesson or message.
3. LANGUAGE: If transcript is in Hindi, Hinglish, or other languages, translate and distill into articulate English.
4. JSON ONLY: Respond strictly with valid JSON.`;

/**
 * Builds user prompt for single-pass lean 5-section summarization.
 */
function buildSinglePassPrompt({ title, channelName, description, duration, transcriptText, videoUrl }) {
  return `Distill this transcript into the concise, punchy 5-section executive briefing (under 300 words total).

VIDEO DETAILS:
- Title: ${title || 'Unknown Title'}
- Channel / Creator: ${channelName || 'Unknown Creator'}
- Duration: ${duration || 'N/A'}
- URL: ${videoUrl || 'N/A'}
${description ? `- Context / Description: ${description.slice(0, 250)}` : ''}

TRANSCRIPT:
"""
${transcriptText}
"""

OUTPUT FORMAT:
Respond with a single JSON object strictly matching this schema:
{
  "title": "# Concise, Engaging Title",
  "summary": "Dense 1-paragraph summary (70-100 words max) covering the main subject, background, central argument, and outcome.",
  "highlights": [
    "⚡ Most critical revelation or development",
    "🔍 Key verified fact, number, or claim",
    "📊 Specific milestone or turning point",
    "🎯 Core argument or finding",
    "💡 Final actionable takeaway"
  ],
  "keyInsights": [
    {
      "heading": "Core Insight 1",
      "explanation": "1-2 sentences explaining why this matters with evidence from the video (max 25 words).",
      "timestamp": "MM:SS"
    },
    {
      "heading": "Core Insight 2",
      "explanation": "1-2 sentences explaining why this matters with evidence from the video (max 25 words).",
      "timestamp": "MM:SS"
    },
    {
      "heading": "Core Insight 3",
      "explanation": "1-2 sentences explaining why this matters with evidence from the video (max 25 words).",
      "timestamp": "MM:SS"
    }
  ],
  "conclusion": "1 punchy concluding sentence summarizing the ultimate lesson or bottom-line takeaway (max 30 words)."
}`;
}

/**
 * Builds prompt for direct Gemini video/audio ingestion (when transcript is unavailable).
 */
function buildDirectVideoPrompt({ title, channelName, description, duration, videoUrl }) {
  return `Analyze and distill this video's audio and visual stream into the required 5-section executive format.

VIDEO METADATA:
- Title: ${title || 'Unknown Title'}
- Channel: ${channelName || 'Unknown Creator'}
- Duration: ${duration || 'N/A'}
- Video URL: ${videoUrl || 'N/A'}
${description ? `- Description: ${description.slice(0, 300)}` : ''}

OUTPUT FORMAT:
Respond with a single JSON object strictly matching this schema:
{
  "title": "# Engaging, Meaningful Video Title",
  "summary": "Comprehensive narrative paragraph explaining the entire video, its subject, events, and message in clear, natural language.",
  "highlights": [
    "⚡ Key development or central event with emoji",
    "🔍 Important fact or evidence from the video",
    "🎯 Core conclusion reached by the speaker"
  ],
  "keyInsights": [
    {
      "heading": "Core Insight Heading",
      "explanation": "Detailed explanation explaining why this matters with context and evidence from the video.",
      "timestamp": "MM:SS"
    }
  ],
  "conclusion": "Comprehensive closing paragraph on the speaker's main takeaway and lesson."
}`;
}

// Stubs for chunk/consolidation prompts if needed for extremely large edge cases
function buildChunkPrompt({ title, channelName, chunkIndex, totalChunks, chunkText, startTimestamp, endTimestamp }) {
  return `Summarize chunk ${chunkIndex} of ${totalChunks} (${startTimestamp} - ${endTimestamp}) for "${title}":
${chunkText}
Respond in JSON: { "sectionSummary": "...", "keyPoints": ["..."] }`;
}

function buildConsolidationPrompt({ title, channelName, duration, combinedChunkSummaries, videoUrl }) {
  return `Combine these chunk summaries for "${title}" into the final 5-section executive format:
${combinedChunkSummaries}
Respond with { "title": "# ...", "summary": "...", "highlights": ["..."], "keyInsights": [{ "heading": "...", "explanation": "..." }], "conclusion": "..." }`;
}

module.exports = {
  SYSTEM_INSTRUCTION,
  buildSinglePassPrompt,
  buildDirectVideoPrompt,
  buildChunkPrompt,
  buildConsolidationPrompt,
};
