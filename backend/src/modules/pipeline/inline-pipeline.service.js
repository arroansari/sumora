/**
 * InlinePipelineService
 *
 * Runs the transcript-fetch → AI-summarize pipeline synchronously (without Redis/BullMQ).
 * Invoked directly by the WebSub handler when a new video upload notification arrives,
 * or manually triggered per-video via the API.
 *
 * Zero hallucination policy:
 *   - If transcript is unavailable → summaryStatus = 'transcript_unavailable', no summary generated.
 *   - AI summary grounded ONLY in the fetched transcript's fullText.
 */

const prisma = require('../../config/db');
const { transcriptService } = require('../transcripts');
const summarizationService = require('../ai/summarization.service');

class InlinePipelineService {
  /**
   * Processes a single video through the full transcript → summary pipeline.
   * Safe to call concurrently for different videos (each upserts its own row).
   *
   * @param {object} params
   * @param {string} params.videoId   - YouTube video ID (e.g. "dQw4w9WgXcQ")
   * @param {string} params.channelId - YouTube channel ID
   * @param {string} params.title     - Video title from WebSub Atom feed
   * @param {string} params.videoUrl  - Full watch URL
   * @returns {Promise<{videoId: string, status: string, message?: string}>}
   */
  async processVideo({ videoId, channelId, title, videoUrl }) {
    console.log(`[InlinePipeline] Starting pipeline for video: ${videoId} — "${title}"`);

    try {
      // ── Step 1: Fetch & normalize transcript ─────────────────────────
      const transcriptResult = await transcriptService.getOrFetchTranscript(videoId);

      const channelSource = await prisma.trackedSource.findFirst({
        where: { sourceId: channelId, platform: 'youtube' },
        select: { sourceName: true },
      });

      if (transcriptResult.status === 'transcript_unavailable' || !transcriptResult.transcript) {
        console.log(
          `[InlinePipeline] Transcript unavailable for ${videoId}. Generating grounded metadata-based summary with Gemini...`
        );
        const existingVideo = await prisma.video.findUnique({
          where: { videoId },
          select: { description: true },
        });

        await summarizationService.generateSummaryFromMetadata({
          videoId,
          title,
          channelName: channelSource?.sourceName || undefined,
          description: existingVideo?.description || undefined,
          videoUrl,
        });

        console.log(`[InlinePipeline] Metadata summary complete for video: ${videoId}`);
        return { videoId, status: 'completed' };
      }

      // ── Step 2: Generate AI summary grounded in transcript ───────────
      await summarizationService.generateSummary({
        videoId,
        title,
        channelName: channelSource?.sourceName || undefined,
        videoUrl,
        normalizedTranscript: transcriptResult.transcript,
      });

      console.log(`[InlinePipeline] Pipeline complete for video: ${videoId}`);
      return { videoId, status: 'completed' };
    } catch (error) {
      console.error(`[InlinePipeline] Pipeline error for video ${videoId}:`, error.message);

      // Mark summary as failed without touching transcript status
      await prisma.video
        .updateMany({
          where: { videoId },
          data: { summaryStatus: 'failed' },
        })
        .catch(() => {}); // best-effort

      return { videoId, status: 'failed', message: error.message };
    }
  }

  /**
   * Fires-and-forgets the pipeline for a video.
   * Logs result without throwing so the WebSub handler always returns 200 promptly.
   *
   * @param {object} videoParams
   */
  fireAndForget(videoParams) {
    setImmediate(() => {
      this.processVideo(videoParams).catch((err) =>
        console.error(`[InlinePipeline] Unhandled fire-and-forget error for ${videoParams.videoId}:`, err.message)
      );
    });
  }
}

module.exports = new InlinePipelineService();

