const SYSTEM_INSTRUCTION = `You are an expert AI content distillation engine for Sumora.
Your mission is to transform complex, long, or chaotic videos into crystal-clear, highly engaging, and effortlessly readable summaries that anyone can digest in under 60 seconds.

STYLE & TONE GUIDELINES:
1. SIMPLE & ACCESSIBLE LANGUAGE: Write in plain, everyday conversational English. Avoid stuffy academic jargon, robotic corporate speak, and overly complex sentence structures.
2. HIGH PUNCHINESS & RETENTION: Keep sentences crisp and paragraphs short (2-3 sentences max). Make it engaging and easy to skim.
3. GROUNDED IN TRUTH: Summarize ONLY information explicitly supported by the transcript or metadata. Never hallucinate facts or statistics.
4. MULTILINGUAL/HINDI FLUENCY: If the original video is in Hindi, Hinglish, or another regional language, translate the core ideas into natural, crystal-clear, culturally accurate English.
5. NO REPETITION & NO FILLER: Strip out all self-promotion, sponsor shout-outs, rhetorical babble, and repetitive points. Focus 100% on high-value takeaways.
6. STRUCTURED JSON: Always respond with valid JSON matching the exact requested schema.`;

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
  "overview": "A clear, compelling 2-3 sentence overview written in plain words explaining what happened or what this video is about.",
  "keyPoints": [
    "Punchy, memorable takeaway or point 1 in simple language",
    "Punchy, memorable takeaway or point 2 in simple language",
    "Punchy, memorable takeaway or point 3 in simple language"
  ],
  "importantConcepts": [
    {
      "concept": "Name of concept or topic",
      "explanation": "Clear explanation in plain, everyday language that a 12-year-old could easily understand"
    }
  ],
  "detailedSummary": "A clean breakdown with short, readable paragraphs (2-3 sentences each) covering the core story, key arguments, and highlights without overwhelming the reader.",
  "conclusion": "The bottom-line takeaway or final verdict in 1-2 punchy sentences.",
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

/**
 * Builds a prompt for generating a summary from video metadata when captions are disabled or unavailable.
 */
function buildMetadataPrompt({ title, channelName, description, videoUrl }) {
  return `Please generate a comprehensive, structured video summary based on the following verified video metadata.

VIDEO METADATA:
- Title: ${title || 'Unknown Title'}
- Channel: ${channelName || 'YouTube Creator'}
- Original Video URL: ${videoUrl || 'N/A'}
${description ? `- Creator Description: ${description.slice(0, 800)}` : ''}

OUTPUT FORMAT:
Respond with a JSON object adhering to this exact structure:
{
  "overview": "A clear, compelling 2-3 sentence overview written in plain words explaining what happened or what this video is about.",
  "keyPoints": [
    "Punchy, memorable takeaway or point 1 in simple language",
    "Punchy, memorable takeaway or point 2 in simple language",
    "Punchy, memorable takeaway or point 3 in simple language"
  ],
  "importantConcepts": [
    {
      "concept": "Name of concept, event, or central theme",
      "explanation": "Clear explanation in plain, everyday language that a 12-year-old could easily understand"
    }
  ],
  "detailedSummary": "A clean breakdown with short, readable paragraphs (2-3 sentences each) covering the premise, core highlights, and progression without overwhelming the reader.",
  "conclusion": "The bottom-line takeaway or final verdict in 1-2 punchy sentences.",
  "topicsCovered": [
    "Topic 1",
    "Topic 2",
    "Topic 3"
  ],
  "originalVideoUrl": "${videoUrl || ''}"
}
  ],
  "originalVideoUrl": "${videoUrl || ''}"
}`;
}

module.exports = {
  SYSTEM_INSTRUCTION,
  buildSinglePassPrompt,
  buildChunkPrompt,
  buildConsolidationPrompt,
  buildMetadataPrompt,
};

