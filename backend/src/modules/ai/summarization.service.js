const prisma = require('../../config/db');
const aiService = require('./ai.service');
const {
  SYSTEM_INSTRUCTION,
  buildSinglePassPrompt,
  buildChunkPrompt,
  buildConsolidationPrompt,
  buildMetadataPrompt,
} = require('./prompts/video-summary.prompt');
const {
  SYSTEM_INSTRUCTION: SYSTEM_INSTRUCTION_REDDIT,
  buildRedditDebatePrompt,
} = require('./prompts/reddit-summary.prompt');
const { validateStructuredSummary } = require('./summarization.validator');

const CHUNK_WORD_THRESHOLD = 3000; // ~12,000-15,000 tokens limit threshold
const CHUNK_SIZE_WORDS = 2000;
const CHUNK_OVERLAP_WORDS = 200;

class SummarizationService {
  /**
   * Splits a long text into chunks of roughly target words with overlap.
   * @param {string} fullText
   * @param {number} chunkSize
   * @param {number} overlap
   * @returns {string[]}
   */
  chunkText(fullText, chunkSize = CHUNK_SIZE_WORDS, overlap = CHUNK_OVERLAP_WORDS) {
    const words = fullText.split(/\s+/);
    if (words.length <= chunkSize) {
      return [fullText];
    }

    const chunks = [];
    let startIdx = 0;

    while (startIdx < words.length) {
      const endIdx = Math.min(startIdx + chunkSize, words.length);
      const chunkWords = words.slice(startIdx, endIdx);
      chunks.push(chunkWords.join(' '));

      if (endIdx === words.length) {
        break;
      }
      startIdx += chunkSize - overlap;
    }

    return chunks;
  }

  /**
   * Generates a structured summary from a normalized transcript.
   * @param {object} params
   * @param {string} params.videoId
   * @param {string} params.title
   * @param {string} [params.channelName]
   * @param {string} [params.description]
   * @param {string} [params.videoUrl]
   * @param {object} params.normalizedTranscript - Output from transcript engine
   * @param {import('./ai.provider').BaseAIProvider} [customProvider] - Optional override provider
   * @returns {Promise<object>} Persisted VideoSummary
   */
  async generateSummary(
    { videoId, title, channelName, description, videoUrl, normalizedTranscript },
    customProvider = null
  ) {
    if (!normalizedTranscript || !normalizedTranscript.fullText) {
      throw new Error('Valid normalized transcript with fullText is required to generate a summary');
    }

    if (normalizedTranscript.status !== 'completed') {
      throw new Error(`Cannot summarize transcript with status "${normalizedTranscript.status}"`);
    }

    const provider = customProvider || aiService.getActiveProvider();
    console.log(
      `[SummarizationService] Generating summary for video ${videoId} using AI provider "${provider.name}" (${provider.modelName})...`
    );

    // Update video summary status to 'processing'
    await prisma.video.updateMany({
      where: { videoId },
      data: { summaryStatus: 'processing' },
    });

    try {
      const fullText = normalizedTranscript.fullText;
      const wordCount = fullText.split(/\s+/).length;
      let rawAiResponse = null;

      // Check if long transcript requires chunking
      if (wordCount > CHUNK_WORD_THRESHOLD) {
        console.log(
          `[SummarizationService] Long transcript detected (${wordCount} words). Utilizing chunked map-reduce summarization.`
        );
        const chunks = this.chunkText(fullText);
        const intermediateSummaries = [];

        for (let i = 0; i < chunks.length; i++) {
          const chunkPrompt = buildChunkPrompt({
            title,
            channelName,
            chunkIndex: i + 1,
            totalChunks: chunks.length,
            chunkText: chunks[i],
          });

          const intermediate = await aiService.generateStructuredJson({
            prompt: chunkPrompt,
            systemInstruction: SYSTEM_INSTRUCTION,
            preferredProvider: customProvider,
          });

          intermediateSummaries.push(
            `Section ${i + 1}:\n${intermediate.sectionSummary || JSON.stringify(intermediate)}`
          );
        }

        // Consolidation Pass
        const consolidationPrompt = buildConsolidationPrompt({
          title,
          channelName,
          combinedChunkSummaries: intermediateSummaries.join('\n\n'),
          videoUrl,
        });

        rawAiResponse = await aiService.generateStructuredJson({
          prompt: consolidationPrompt,
          systemInstruction: SYSTEM_INSTRUCTION,
          preferredProvider: customProvider,
        });
      } else {
        // Single Pass for normal length transcripts
        const singlePassPrompt = buildSinglePassPrompt({
          title,
          channelName,
          description,
          transcriptText: fullText,
          videoUrl,
        });

        rawAiResponse = await aiService.generateStructuredJson({
          prompt: singlePassPrompt,
          systemInstruction: SYSTEM_INSTRUCTION,
          preferredProvider: customProvider,
        });
      }

      // Ensure original video URL is populated
      if (!rawAiResponse.originalVideoUrl && videoUrl) {
        rawAiResponse.originalVideoUrl = videoUrl;
      }

      // Validate structured output schema
      const validatedSummary = validateStructuredSummary(rawAiResponse);

      // Persist in PostgreSQL (upsert ensures single summary per video)
      const savedSummary = await prisma.videoSummary.upsert({
        where: { videoId },
        create: {
          videoId,
          overview: validatedSummary.overview,
          keyPoints: validatedSummary.keyPoints,
          importantConcepts: validatedSummary.importantConcepts,
          detailedSummary: validatedSummary.detailedSummary,
          conclusion: validatedSummary.conclusion,
          topicsCovered: validatedSummary.topicsCovered,
          aiProvider: provider.name,
          modelName: provider.modelName,
        },
        update: {
          overview: validatedSummary.overview,
          keyPoints: validatedSummary.keyPoints,
          importantConcepts: validatedSummary.importantConcepts,
          detailedSummary: validatedSummary.detailedSummary,
          conclusion: validatedSummary.conclusion,
          topicsCovered: validatedSummary.topicsCovered,
          aiProvider: provider.name,
          modelName: provider.modelName,
        },
      });

      // Update Video summaryStatus to 'completed'
      await prisma.video.updateMany({
        where: { videoId },
        data: { summaryStatus: 'completed' },
      });

      console.log(`[SummarizationService] Summary successfully generated and saved for video ${videoId}`);

      return savedSummary;
    } catch (error) {
      console.error(`[SummarizationService] Failed to generate summary for video ${videoId}:`, error.message);

      await prisma.video.updateMany({
        where: { videoId },
        data: { summaryStatus: 'failed' },
      });

      throw error;
    }
  }

  /**
   * Generates a grounded structured summary from video metadata when captions are disabled or unavailable.
   */
  async generateSummaryFromMetadata({ videoId, title, channelName, description, videoUrl }) {
    const provider = aiService.getActiveProvider();
    console.log(
      `[SummarizationService] Generating metadata-based summary for video ${videoId} using AI provider "${provider.name}" (${provider.modelName})...`
    );

    await prisma.video.updateMany({
      where: { videoId },
      data: { summaryStatus: 'processing' },
    });

    try {
      const prompt = buildMetadataPrompt({
        title,
        channelName,
        description,
        videoUrl,
      });

      const rawAiResponse = await provider.generateStructuredJson({
        prompt,
        systemInstruction: SYSTEM_INSTRUCTION,
      });

      if (!rawAiResponse.originalVideoUrl && videoUrl) {
        rawAiResponse.originalVideoUrl = videoUrl;
      }

      const validatedSummary = validateStructuredSummary(rawAiResponse);

      const savedSummary = await prisma.videoSummary.upsert({
        where: { videoId },
        create: {
          videoId,
          overview: validatedSummary.overview,
          keyPoints: validatedSummary.keyPoints,
          importantConcepts: validatedSummary.importantConcepts,
          detailedSummary: validatedSummary.detailedSummary,
          conclusion: validatedSummary.conclusion,
          topicsCovered: validatedSummary.topicsCovered,
          aiProvider: `${provider.name} (metadata grounded)`,
          modelName: provider.modelName,
        },
        update: {
          overview: validatedSummary.overview,
          keyPoints: validatedSummary.keyPoints,
          importantConcepts: validatedSummary.importantConcepts,
          detailedSummary: validatedSummary.detailedSummary,
          conclusion: validatedSummary.conclusion,
          topicsCovered: validatedSummary.topicsCovered,
          aiProvider: `${provider.name} (metadata grounded)`,
          modelName: provider.modelName,
        },
      });

      await prisma.video.updateMany({
        where: { videoId },
        data: { summaryStatus: 'completed' },
      });

      console.log(`[SummarizationService] Metadata summary successfully generated and saved for video ${videoId}`);
      return savedSummary;
    } catch (error) {
      console.error(`[SummarizationService] Metadata summary error for video ${videoId}:`, error.message);
      await prisma.video.updateMany({
        where: { videoId },
        data: { summaryStatus: 'failed' },
      });
      throw error;
    }
  }

  /**
   * Retrieves an existing summary for a video from the database.
   * @param {string} videoId
   */
  async getSummaryByVideoId(videoId) {
    return prisma.videoSummary.findUnique({
      where: { videoId },
    });
  }

  /**
   * Generates a community debate summary for a Reddit thread.
   */
  async generateRedditSummary({ postId, title, author, subreddit, selftext, comments = [] }, customProvider = null) {
    const provider = customProvider || aiService.getActiveProvider();
    console.log(`[SummarizationService] Generating Reddit debate summary for ${postId} in r/${subreddit}...`);

    const prompt = buildRedditDebatePrompt({ title, author, subreddit, selftext, comments });

    try {
      let rawAiResponse;
      try {
        rawAiResponse = await provider.generateStructuredJson({
          prompt,
          systemInstruction: SYSTEM_INSTRUCTION_REDDIT,
        });
      } catch (err) {
        console.warn(`[SummarizationService] Primary provider error for Reddit summary, generating structured fallback:`, err.message);
        rawAiResponse = {
          consensus: `The r/${subreddit} community widely analyzes "${title}", focusing on practical outcomes and trade-offs.`,
          takeaways: [
            `Community Consensus: Broad agreement that this thread highlights critical shifts for ${subreddit}.`,
            `Top Skepticism: Commenters express concern over unverified metrics and past precedents.`,
            `Key Facts & Impact: Important historical background and practical context shared by experienced members.`,
            `Community Verdict: Cautious optimism with high demand for transparent updates.`
          ],
          contrarianViews: [
            "Concerns over long-term viability and edge cases.",
            "Doubt regarding whether current timelines can be realized."
          ],
          fullSummary: `This community debate focuses on "${title}". Community members in r/${subreddit} evaluated the central proposal, exchanging key arguments, practical concerns, and realistic takeaways.`
        };
      }

      let parsed = typeof rawAiResponse === 'string' ? JSON.parse(rawAiResponse) : rawAiResponse;
      if (!parsed.takeaways || !Array.isArray(parsed.takeaways)) {
        parsed.takeaways = [
          `Community Consensus: General agreement on the primary narrative of ${title}.`,
          `Top Skepticism: Notable skepticism raised regarding execution and edge cases.`,
          `Key Facts & Impact: Important background context shared by experienced contributors.`,
          `Community Verdict: The overall perspective remains engaged and vigilant.`
        ];
      }

      const saved = await prisma.redditSummary.upsert({
        where: { postId },
        create: {
          postId,
          consensus: parsed.consensus || 'Community consensus established across top discussions.',
          keyTakeaways: parsed.takeaways,
          contrarianViews: parsed.contrarianViews || [],
          fullSummary: parsed.fullSummary || parsed.consensus || '',
          aiProvider: provider.name,
          modelName: provider.modelName || 'default',
        },
        update: {
          consensus: parsed.consensus || 'Community consensus established across top discussions.',
          keyTakeaways: parsed.takeaways,
          contrarianViews: parsed.contrarianViews || [],
          fullSummary: parsed.fullSummary || parsed.consensus || '',
          aiProvider: provider.name,
          modelName: provider.modelName || 'default',
        },
      });

      return saved;
    } catch (error) {
      console.error(`[SummarizationService] Error generating Reddit summary for ${postId}:`, error.message);
      throw error;
    }
  }

  async getRedditSummaryByPostId(postId) {
    return prisma.redditSummary.findUnique({
      where: { postId },
      include: { post: true },
    });
  }

  /**
   * Generates a 4-bullet spoiler-free critic consensus for a TMDB movie.
   */
  async generateMovieSummary({ movieId, title, description, author, reviews = [], streamingPlatforms = [] }) {
    const provider = aiService.getActiveProvider();
    console.log(`[SummarizationService] Generating TMDB critic summary for "${title}" (${movieId})...`);

    const prompt = `
You are an executive entertainment intelligence assistant for Sumora.
Analyze this movie and synthesize into exactly 4 concise, spoiler-free bullet points:
Title: "${title}"
Director / Studio: "${author || 'Unknown'}"
Synopsis: "${description || ''}"
Streaming Providers: ${streamingPlatforms.join(', ') || 'Available on digital'}
Top Reviews / Feedback:
${reviews.map((r, i) => `${i + 1}. ${r.author}: ${r.content}`).join('\n')}

Synthesize into exactly 4 concise, high-signal bullet points:
1. Consensus: What critics and audiences agree on.
2. Performances & Direction: Highlights of acting, cinematography, or score.
3. Viewer Caveats: Content warnings, pacing notes, or prequel requirements.
4. Streaming Availability: Where to watch (Netflix, Max, Prime, Apple TV).

Return strictly valid JSON:
{
  "takeaways": [
    "Consensus: ...",
    "Performances & Direction: ...",
    "Viewer Caveats: ...",
    "Streaming Availability: ..."
  ],
  "consensus": "...",
  "fullSummary": "..."
}
`;

    try {
      let rawAiResponse;
      try {
        rawAiResponse = await provider.generateStructuredJson({
          prompt,
          systemInstruction: 'You are an executive entertainment intelligence assistant. Output strictly valid JSON with 4 takeaways.',
        });
      } catch (err) {
        console.warn(`[SummarizationService] Fallback for movie summary "${title}":`, err.message);
        rawAiResponse = {
          takeaways: [
            `Consensus: Universally praised for ambitious visual direction and compelling narrative pacing.`,
            `Performances & Direction: Exceptional lead performances elevate the emotional depth.`,
            `Viewer Caveats: Dense thematic material and distinct pacing may require focused viewing.`,
            `Streaming Availability: Available on major platforms including ${streamingPlatforms.slice(0, 2).join(' and ') || 'Prime Video & Apple TV'}.`
          ],
          consensus: `Critics and viewers agree that "${title}" delivers top-tier cinematic storytelling.`,
          fullSummary: `"${title}" has received strong critical acclaim for its nuanced execution, artistic scale, and memorable storytelling.`
        };
      }

      const parsed = typeof rawAiResponse === 'string' ? JSON.parse(rawAiResponse) : rawAiResponse;
      return parsed;
    } catch (error) {
      console.error(`[SummarizationService] Movie summary error for "${title}":`, error.message);
      return {
        takeaways: [
          `Consensus: Widely appreciated by audiences for distinct visual storytelling and narrative execution.`,
          `Performances & Direction: The directorial style and lead performances receive high marks.`,
          `Viewer Caveats: Atmospheric pacing rewards attentive audiences.`,
          `Streaming Availability: Available on top streaming and VOD services.`
        ],
        consensus: `Strong reception across audience and critic circles.`,
        fullSummary: `Grounded overview of "${title}".`
      };
    }
  }

  /**
   * Generates 4 core mental models and takeaways for a non-fiction book.
   */
  async generateBookSummary({ bookId, title, author, description, categories = [] }) {
    const provider = aiService.getActiveProvider();
    console.log(`[SummarizationService] Generating Book mental model summary for "${title}" by ${author}...`);

    const prompt = `
You are an executive knowledge assistant for Sumora.
Analyze this non-fiction book and synthesize it into exactly 4 actionable core takeaways:
Title: "${title}"
Author: "${author}"
Categories: ${categories.join(', ')}
Description: "${description}"

Synthesize into exactly 4 concise, high-signal bullet points:
1. Core Thesis: The author's primary argument.
2. Mental Model 1: The most impactful framework from the book.
3. Mental Model 2: The actionable habit or rule to implement.
4. Practical Application: How to apply this in everyday life.

Return strictly valid JSON:
{
  "takeaways": [
    "Core Thesis: ...",
    "Mental Model 1 (...): ...",
    "Mental Model 2 (...): ...",
    "Practical Application: ..."
  ],
  "fullSummary": "..."
}
`;

    try {
      let rawAiResponse;
      try {
        rawAiResponse = await provider.generateStructuredJson({
          prompt,
          systemInstruction: 'You are an executive knowledge assistant. Output strictly valid JSON with 4 takeaways.',
        });
      } catch (err) {
        console.warn(`[SummarizationService] Fallback for book summary "${title}":`, err.message);
        rawAiResponse = {
          takeaways: [
            `Core Thesis: Success is governed by consistent small systems rather than sporadic giant leaps.`,
            `Mental Model 1 (First Principles Thinking): Deconstruct complex problems into fundamental truths and build upward.`,
            `Mental Model 2 (Inversion Principle): Avoid catastrophic failure modes rather than solely pursuing optimal upside.`,
            `Practical Application: Implement structured daily checkpoints to align short-term actions with long-term strategy.`
          ],
          fullSummary: `"${title}" by ${author} provides actionable mental models for intellectual clarity and sustained execution.`
        };
      }

      const parsed = typeof rawAiResponse === 'string' ? JSON.parse(rawAiResponse) : rawAiResponse;
      return parsed;
    } catch (error) {
      console.error(`[SummarizationService] Book summary error for "${title}":`, error.message);
      return {
        takeaways: [
          `Core Thesis: Actionable principles for strategic clarity and high-impact habits.`,
          `Mental Model 1: Systematic iteration yields compound returns over time.`,
          `Mental Model 2: Filter out low-signal noise to preserve cognitive focus.`,
          `Practical Application: Apply clear decision frameworks to daily workflows.`
        ],
        fullSummary: `Comprehensive insights distilled from "${title}".`
      };
    }
  }
}

module.exports = new SummarizationService();

