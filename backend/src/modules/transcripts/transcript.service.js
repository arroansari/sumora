const prisma = require('../../config/db');
const transcriptFactory = require('./transcript.factory');
const { validateRawSegments, validateNormalizedTranscript } = require('./transcript.validator');
const { normalizeTranscript } = require('./transcript.processor');
const { TranscriptUnavailableError } = require('./transcript.provider');

class TranscriptService {
  /**
   * Retrieves, normalizes, and persists a transcript for a video using the prioritized provider chain.
   * @param {string} videoId
   * @param {object} [options]
   * @returns {Promise<{transcript: object|null, status: string, error?: string}>}
   */
  async getOrFetchTranscript(videoId, options = {}) {
    // 1. Check if normalized transcript already exists in database
    const existing = await prisma.videoTranscript.findUnique({
      where: { videoId },
    });

    if (existing && existing.status === 'completed') {
      return {
        transcript: {
          videoId: existing.videoId,
          language: existing.language,
          source: existing.source,
          segments: existing.segments,
          fullText: existing.fullText,
          status: existing.status,
        },
        status: 'completed',
      };
    }

    // 2. Update Video status to 'fetching_transcript'
    await prisma.video.updateMany({
      where: { videoId },
      data: { transcriptStatus: 'fetching_transcript' },
    });

    const providers = transcriptFactory.getProvidersInPriorityOrder();
    let retrievedData = null;
    let successfulProviderName = null;
    const providerErrors = [];

    // 3. Attempt each provider in priority order
    for (const provider of providers) {
      try {
        const canHandle = await provider.canHandle(videoId, options);
        if (!canHandle) {
          continue;
        }

        console.log(`[TranscriptService] Attempting provider "${provider.name}" for video ${videoId}...`);
        const result = await provider.fetchTranscript(videoId, options);

        if (result && validateRawSegments(result.segments)) {
          retrievedData = result;
          successfulProviderName = provider.name;
          console.log(`[TranscriptService] Successfully retrieved transcript via "${provider.name}"`);
          break;
        }
      } catch (err) {
        providerErrors.push({
          provider: provider.name,
          message: err.message,
        });
        console.warn(`[TranscriptService] Provider "${provider.name}" failed: ${err.message}`);
      }
    }

    // 4. Handle Case: No provider was able to return an accessible transcript
    if (!retrievedData) {
      console.warn(`[TranscriptService] All transcript providers failed for video ${videoId}`);

      await prisma.video.updateMany({
        where: { videoId },
        data: {
          transcriptStatus: 'transcript_unavailable',
          summaryStatus: 'transcript_unavailable',
        },
      });

      return {
        transcript: null,
        status: 'transcript_unavailable',
        message: 'An accessible transcript could not be retrieved, so a summary cannot be generated yet.',
        providerErrors,
      };
    }

    // 5. Clean, format, and normalize the raw transcript
    const normalized = normalizeTranscript({
      videoId,
      language: retrievedData.language || 'en',
      source: successfulProviderName,
      rawSegments: retrievedData.segments,
    });

    // 6. Validate normalized schema
    validateNormalizedTranscript(normalized);

    // 7. Persist to PostgreSQL (VideoTranscript) and update Video status
    const savedTranscript = await prisma.videoTranscript.upsert({
      where: { videoId },
      create: {
        videoId,
        language: normalized.language,
        source: normalized.source,
        segments: normalized.segments,
        fullText: normalized.fullText,
        status: 'completed',
      },
      update: {
        language: normalized.language,
        source: normalized.source,
        segments: normalized.segments,
        fullText: normalized.fullText,
        status: 'completed',
      },
    });

    await prisma.video.updateMany({
      where: { videoId },
      data: { transcriptStatus: 'completed' },
    });

    return {
      transcript: {
        videoId: savedTranscript.videoId,
        language: savedTranscript.language,
        source: savedTranscript.source,
        segments: savedTranscript.segments,
        fullText: savedTranscript.fullText,
        status: savedTranscript.status,
      },
      status: 'completed',
    };
  }

  /**
   * Allows manual submission of a transcript by user or creator.
   * @param {string} videoId
   * @param {object} params
   * @param {string} [params.text] - Plain text
   * @param {string} [params.srt] - SRT or VTT string
   * @param {string} [params.language] - e.g. "en"
   */
  async submitUserTranscript(videoId, { text, srt, language = 'en' }) {
    return this.getOrFetchTranscript(videoId, {
      userTranscriptText: text,
      userTranscriptSrt: srt,
      language,
    });
  }
}

module.exports = new TranscriptService();

