const prisma = require('../../config/db');
const aiService = require('./ai.service');
const {
  SYSTEM_INSTRUCTION,
  buildSinglePassPrompt,
  buildChunkPrompt,
  buildConsolidationPrompt,
} = require('./prompts/video-summary.prompt');
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

          const intermediate = await provider.generateStructuredJson({
            prompt: chunkPrompt,
            systemInstruction: SYSTEM_INSTRUCTION,
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

        rawAiResponse = await provider.generateStructuredJson({
          prompt: consolidationPrompt,
          systemInstruction: SYSTEM_INSTRUCTION,
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

        rawAiResponse = await provider.generateStructuredJson({
          prompt: singlePassPrompt,
          systemInstruction: SYSTEM_INSTRUCTION,
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
   * Retrieves an existing summary for a video from the database.
   * @param {string} videoId
   */
  async getSummaryByVideoId(videoId) {
    return prisma.videoSummary.findUnique({
      where: { videoId },
    });
  }
}

module.exports = new SummarizationService();

