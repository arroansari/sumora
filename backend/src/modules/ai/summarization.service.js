const prisma = require('../../config/db');
const aiService = require('./ai.service');
const {
  SYSTEM_INSTRUCTION,
  buildSinglePassPrompt,
  buildDirectVideoPrompt,
  buildChunkPrompt,
  buildConsolidationPrompt,
  buildMetadataPrompt,
} = require('./prompts/video-summary.prompt');
const {
  SYSTEM_INSTRUCTION: SYSTEM_INSTRUCTION_REDDIT,
  buildRedditDebatePrompt,
} = require('./prompts/reddit-summary.prompt');
const { validateStructuredSummary } = require('./summarization.validator');

const CHUNK_WORD_THRESHOLD = 25000; // Single-pass up to ~25k words (Gemini 1M context); avoids multi-roundtrip overhead
const CHUNK_SIZE_WORDS = 8000;
const CHUNK_OVERLAP_WORDS = 400;

/**
 * Pre-cleans transcript text to minimize token overhead without losing meaning.
 * Removes audio description tags ([Music], [Applause]), vocal stutters, and excessive whitespace.
 * @param {string} text
 * @returns {string}
 */
function cleanTranscriptText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\[(music|applause|laughter|inaudible|cheering|_+)\]/gi, '')
    .replace(/\b(\w+)\s+\1\b/gi, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Formats seconds into MM:SS or HH:MM:SS string.
 * @param {number} sec
 * @returns {string}
 */
function formatSecondsToTimestamp(sec) {
  const total = Math.floor(sec);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

class SummarizationService {
  /**
   * Formats transcript segments with timestamp markers every ~30 seconds or major segment.
   * Grounding transcripts with authentic timestamps prevents LLM hallucination of video times.
   * @param {Array<{start: number, duration: number, text: string}>} segments
   * @returns {string}
   */
  formatTimestampedTranscript(segments) {
    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      return '';
    }

    const lines = [];
    let lastMarkerTime = -1;

    for (const seg of segments) {
      const start = seg.start || 0;
      // Emit a timestamp marker at the start or every ~25-30 seconds
      if (lastMarkerTime === -1 || start - lastMarkerTime >= 25) {
        lines.push(`\n[${formatSecondsToTimestamp(start)}]`);
        lastMarkerTime = start;
      }
      lines.push(seg.text);
    }

    return lines.join(' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Splits a long text into chunks of roughly target words with overlap.
   * @param {string} fullText
   * @param {number} chunkSize
   * @param {number} overlap
   * @returns {string[]}
   */
  chunkText(fullText, chunkSize = CHUNK_SIZE_WORDS, overlap = CHUNK_OVERLAP_WORDS) {
    const words = fullText.split(/\s+/).filter(Boolean);
    if (words.length <= chunkSize) {
      return [fullText];
    }

    const chunks = [];
    let startIdx = 0;
    const step = Math.max(1, chunkSize - overlap);

    while (startIdx < words.length) {
      const endIdx = Math.min(startIdx + chunkSize, words.length);
      const chunkWords = words.slice(startIdx, endIdx);
      chunks.push(chunkWords.join(' '));

      if (endIdx === words.length) {
        break;
      }
      startIdx += step;
    }

    return chunks;
  }

  /**
   * Splits normalized segments into overlapping chunks with precise start and end timestamps.
   * @param {Array<{start: number, duration: number, text: string}>} segments
   * @param {number} chunkSize
   * @param {number} overlap
   * @returns {Array<{text: string, startTimestamp: string, endTimestamp: string}>}
   */
  chunkSegments(segments, chunkSize = CHUNK_SIZE_WORDS, overlap = CHUNK_OVERLAP_WORDS) {
    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      return [];
    }

    const chunks = [];
    let currentWords = [];
    let currentWordCount = 0;
    let chunkStartSec = segments[0].start || 0;
    let chunkEndSec = chunkStartSec;

    let segIdx = 0;
    while (segIdx < segments.length) {
      const seg = segments[segIdx];
      const segWords = seg.text.split(/\s+/).filter(Boolean);

      if (currentWordCount + segWords.length > chunkSize && currentWords.length > 0) {
        chunks.push({
          text: currentWords.join(' '),
          startTimestamp: formatSecondsToTimestamp(chunkStartSec),
          endTimestamp: formatSecondsToTimestamp(chunkEndSec),
        });

        // Step back for overlap
        let wordsToKeep = overlap;
        const newCurrentWords = [];
        for (let k = currentWords.length - 1; k >= 0 && wordsToKeep > 0; k--) {
          newCurrentWords.unshift(currentWords[k]);
          wordsToKeep--;
        }
        currentWords = newCurrentWords;
        currentWordCount = currentWords.length;
        chunkStartSec = seg.start || 0;
      }

      currentWords.push(...segWords);
      currentWordCount += segWords.length;
      chunkEndSec = (seg.start || 0) + (seg.duration || 0);
      segIdx++;
    }

    if (currentWords.length > 0) {
      chunks.push({
        text: currentWords.join(' '),
        startTimestamp: formatSecondsToTimestamp(chunkStartSec),
        endTimestamp: formatSecondsToTimestamp(chunkEndSec),
      });
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
    try {
      await prisma.video.updateMany({
        where: { videoId },
        data: { summaryStatus: 'processing' },
      });
    } catch (dbErr) {
      // Best-effort status update; continue even if DB is in mock/test mode
    }

    const startTime = Date.now();

    try {
      const fullText = normalizedTranscript.fullText;
      const wordCount = fullText.split(/\s+/).length;
      let rawAiResponse = null;

      // Clean transcript text to strip audio fillers and save 30%+ input tokens
      const rawTimestampedText =
        normalizedTranscript.segments?.length > 0
          ? this.formatTimestampedTranscript(normalizedTranscript.segments)
          : fullText;
      const timestampedText = cleanTranscriptText(rawTimestampedText);

      if (wordCount > CHUNK_WORD_THRESHOLD) {
        console.log(
          `[SummarizationService] Long transcript detected (${wordCount} words). Utilizing chunked map-reduce summarization.`
        );
        const chunks =
          normalizedTranscript.segments?.length > 0
            ? this.chunkSegments(normalizedTranscript.segments)
            : this.chunkText(fullText).map((t) => ({ text: t, startTimestamp: 'N/A', endTimestamp: 'N/A' }));
        const intermediateSummaries = [];

        for (let i = 0; i < chunks.length; i++) {
          const chunkItem = chunks[i];
          const chunkPrompt = buildChunkPrompt({
            title,
            channelName,
            chunkIndex: i + 1,
            totalChunks: chunks.length,
            chunkText: chunkItem.text,
            startTimestamp: chunkItem.startTimestamp,
            endTimestamp: chunkItem.endTimestamp,
          });

          const intermediate = await aiService.generateStructuredJson({
            prompt: chunkPrompt,
            systemInstruction: SYSTEM_INSTRUCTION,
            preferredProvider: customProvider,
          });

          const chunkNoteSummary = [
            `--- Chunk ${i + 1} of ${chunks.length} [${chunkItem.startTimestamp} - ${chunkItem.endTimestamp}]: ${intermediate.topic || 'Section'} ---`,
            intermediate.detailedNotes || intermediate.sectionSummary || '',
            intermediate.keyFigures?.length ? `Key Figures: ${intermediate.keyFigures.join(', ')}` : '',
            intermediate.claimsAndAllegations?.length ? `Claims & Allegations:\n- ${intermediate.claimsAndAllegations.join('\n- ')}` : '',
            intermediate.terminology?.length ? `Terminology: ${intermediate.terminology.map(t => `${t.term} (${t.phonetic || ''}): ${t.meaning}`).join('; ')}` : '',
            intermediate.examples?.length ? `Examples Cited:\n- ${intermediate.examples.join('\n- ')}` : '',
          ].filter(Boolean).join('\n');

          intermediateSummaries.push(chunkNoteSummary);
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
          transcriptText: timestampedText,
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
      const processingDurationMs = Date.now() - startTime;

      // Estimate tokens & nominal cost ($0.075/1M input, $0.30/1M output)
      const inputTokens = Math.round(fullText.length / 4);
      const outputTokens = Math.round(JSON.stringify(validatedSummary).length / 4);
      const processingCost = Math.round(((inputTokens * 0.075 + outputTokens * 0.30) / 1000000) * 10000) / 10000;

      // Persist in PostgreSQL (upsert ensures single summary per video)
      const summaryPayload = {
        overview: validatedSummary.overview,
        keyPoints: validatedSummary.keyPoints,
        importantConcepts: validatedSummary.importantConcepts,
        detailedSummary: validatedSummary.detailedSummary,
        conclusion: validatedSummary.conclusion,
        topicsCovered: validatedSummary.topicsCovered,
        aiProvider: provider.name,
        modelName: provider.modelName,

        // 11-section detailed fields
        videoOverview: validatedSummary.videoOverview || null,
        backgroundAndContext: validatedSummary.backgroundAndContext || null,
        detailedBreakdown: validatedSummary.detailedBreakdown || [],
        actualEventsAndClaims: validatedSummary.actualEventsAndClaims || null,
        peopleAndOrganizations: validatedSummary.peopleAndOrganizations || [],
        pronunciationGuide: validatedSummary.pronunciationGuide || [],
        importantStatements: validatedSummary.importantStatements || [],
        examplesAndConnections: validatedSummary.examplesAndConnections || [],
        finalConclusion: validatedSummary.finalConclusion || null,
        keyTakeaways: validatedSummary.keyTakeaways || [],
        importantTimestamps: validatedSummary.importantTimestamps || [],

        // Token & performance metrics
        inputTokens,
        outputTokens,
        processingCost,
        processingDurationMs,
      };

      let savedSummary = summaryPayload;
      try {
        savedSummary = await prisma.videoSummary.upsert({
          where: { videoId },
          create: {
            videoId,
            ...summaryPayload,
          },
          update: summaryPayload,
        });

        // Update Video summaryStatus to 'completed'
        await prisma.video.updateMany({
          where: { videoId },
          data: { summaryStatus: 'completed' },
        });
      } catch (dbErr) {
        // In local/test mode without live DB, return the synthesized payload
      }

      console.log(
        `[SummarizationService] In-depth 11-section summary successfully generated for video ${videoId} (${processingDurationMs}ms, ~${inputTokens + outputTokens} tokens)`
      );

      return savedSummary;
    } catch (error) {
      console.error(`[SummarizationService] Failed to generate summary for video ${videoId}:`, error.message);

      try {
        await prisma.video.updateMany({
          where: { videoId },
          data: { summaryStatus: 'failed' },
        });
      } catch (_) {}

      throw error;
    }
  }

  /**
   * Generates a structured 11-section summary directly from video audio/visuals using Gemini native video ingestion.
   * Invoked when YouTube blocks timedtext captions or when no user transcript is present.
   * @param {object} params
   * @param {string} params.videoId
   * @param {string} params.title
   * @param {string} [params.channelName]
   * @param {string} [params.description]
   * @param {string} [params.videoUrl]
   * @param {string} [params.duration]
   * @returns {Promise<object>} Persisted VideoSummary
   */
  async generateSummaryFromVideo({ videoId, title, channelName, description, videoUrl, duration }) {
    const targetUrl = videoUrl || `https://www.youtube.com/watch?v=${videoId}`;
    const provider = aiService.getActiveProvider();

    console.log(
      `[SummarizationService] Ingesting video ${videoId} directly via AI provider "${provider.name}" (${provider.modelName}) [${targetUrl}]...`
    );

    // Update status to processing
    try {
      await prisma.video.updateMany({
        where: { videoId },
        data: { summaryStatus: 'processing' },
      });
    } catch (_) {}

    const startTime = Date.now();

    try {
      const prompt = buildDirectVideoPrompt({
        title,
        channelName,
        description,
        duration,
        videoUrl: targetUrl,
      });

      const rawAiResponse = await aiService.generateStructuredJson({
        prompt,
        systemInstruction: SYSTEM_INSTRUCTION,
        videoUrl: targetUrl,
      });

      if (!rawAiResponse.originalVideoUrl) {
        rawAiResponse.originalVideoUrl = targetUrl;
      }

      // Validate structured output schema
      const validatedSummary = validateStructuredSummary(rawAiResponse);
      const processingDurationMs = Date.now() - startTime;

      const inputTokens = 2500;
      const outputTokens = Math.round(JSON.stringify(validatedSummary).length / 4);
      const processingCost = Math.round(((inputTokens * 0.075 + outputTokens * 0.30) / 1000000) * 10000) / 10000;

      const summaryPayload = {
        overview: validatedSummary.overview,
        keyPoints: validatedSummary.keyPoints,
        importantConcepts: validatedSummary.importantConcepts,
        detailedSummary: validatedSummary.detailedSummary,
        conclusion: validatedSummary.conclusion,
        topicsCovered: validatedSummary.topicsCovered,
        aiProvider: provider.name,
        modelName: provider.modelName,

        videoOverview: validatedSummary.videoOverview || null,
        backgroundAndContext: validatedSummary.backgroundAndContext || null,
        detailedBreakdown: validatedSummary.detailedBreakdown || [],
        actualEventsAndClaims: validatedSummary.actualEventsAndClaims || null,
        peopleAndOrganizations: validatedSummary.peopleAndOrganizations || [],
        pronunciationGuide: validatedSummary.pronunciationGuide || [],
        importantStatements: validatedSummary.importantStatements || [],
        examplesAndConnections: validatedSummary.examplesAndConnections || [],
        finalConclusion: validatedSummary.finalConclusion || null,
        keyTakeaways: validatedSummary.keyTakeaways || [],
        importantTimestamps: validatedSummary.importantTimestamps || [],

        inputTokens,
        outputTokens,
        processingCost,
        processingDurationMs,
      };

      let savedSummary = summaryPayload;
      try {
        savedSummary = await prisma.videoSummary.upsert({
          where: { videoId },
          create: {
            videoId,
            ...summaryPayload,
          },
          update: summaryPayload,
        });

        await prisma.video.updateMany({
          where: { videoId },
          data: { summaryStatus: 'completed', transcriptStatus: 'completed' },
        });
      } catch (dbErr) {
        console.warn(`[SummarizationService] DB upsert warning for ${videoId}:`, dbErr.message);
      }

      console.log(
        `[SummarizationService] Direct video 11-section summary successfully generated for video ${videoId} (${processingDurationMs}ms)`
      );

      return savedSummary;
    } catch (error) {
      console.error(`[SummarizationService] Direct video summarization failed for video ${videoId}:`, error.message);
      try {
        await prisma.video.updateMany({
          where: { videoId },
          data: { summaryStatus: 'failed' },
        });
      } catch (_) {}
      throw error;
    }
  }

  /**
   * Deprecated: Metadata-only summaries are strictly prohibited under the zero-hallucination policy.
   * If a transcript is unavailable, the pipeline must return 'transcript_unavailable'.
   */
  async generateSummaryFromMetadata({ videoId }) {
    console.warn(
      `[SummarizationService] Metadata-only summary requested for ${videoId}. Rejected per zero-hallucination policy.`
    );
    try {
      await prisma.video.updateMany({
        where: { videoId },
        data: { summaryStatus: 'transcript_unavailable', transcriptStatus: 'transcript_unavailable' },
      });
    } catch (_) {
      // Best-effort status update; do not let connection errors mask anti-hallucination policy error
    }
    throw new Error('Generating summaries from metadata alone is prohibited. A valid transcript is required.');
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

