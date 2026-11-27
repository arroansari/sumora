const prisma = require('../../config/db');
const { transcriptService } = require('../transcripts');
const summarizationService = require('../ai/summarization.service');
const config = require('../../config');
const aiStream = require('../../utils/aiStream.util');

class InlinePipelineService {
  /**
   * Processes a single video through the transcript -> AI summary pipeline.
   * Fetches transcript and channel display name concurrently to minimize DB latency.
   */
  async processVideo({ videoId, channelId, title, videoUrl }) {
    console.log(`[InlinePipeline] Starting pipeline for video: ${videoId} — "${title}"`);
    aiStream.publish(videoId, { stage: 'fetching_transcript' });

    try {
      // Run transcript retrieval & channel name lookup in parallel
      const [transcriptResult, channelSource] = await Promise.all([
        transcriptService.getOrFetchTranscript(videoId),
        channelId
          ? prisma.trackedSource
              .findFirst({
                where: { sourceId: channelId, platform: 'youtube' },
                select: { sourceName: true },
              })
              .catch(() => null)
          : Promise.resolve(null),
      ]);

      if (transcriptResult.status === 'transcript_unavailable' || !transcriptResult.transcript) {
        const allowDirectVideo =
          process.env.ALLOW_DIRECT_VIDEO_AI !== 'false' &&
          Boolean(config.ai.geminiApiKeys?.length || config.ai.geminiApiKey);

        if (!allowDirectVideo) {
          aiStream.publish(videoId, {
            stage: 'transcript_unavailable',
            message: transcriptResult.message,
          });
          return { videoId, status: 'transcript_unavailable', message: transcriptResult.message };
        }

        console.log(
          `[InlinePipeline] Native transcript unavailable for ${videoId}. Utilizing direct Gemini video/audio ingestion pipeline.`
        );

        await summarizationService.generateSummaryFromVideo({
          videoId,
          title,
          channelName: channelSource?.sourceName || undefined,
          videoUrl: videoUrl || `https://www.youtube.com/watch?v=${videoId}`,
        });

        console.log(`[InlinePipeline] Direct video pipeline complete for video: ${videoId}`);
        return { videoId, status: 'completed' };
      }

      aiStream.publish(videoId, {
        stage: 'transcript_ready',
        transcript: transcriptResult.transcript,
      });

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

      await prisma.video
        .updateMany({
          where: { videoId },
          data: { summaryStatus: 'failed' },
        })
        .catch(() => {});

      aiStream.publish(videoId, { stage: 'failed', error: error.message });

      return { videoId, status: 'failed', message: error.message };
    }
  }

  fireAndForget(videoParams) {
    setImmediate(() => {
      this.processVideo(videoParams).catch((err) =>
        console.error(`[InlinePipeline] Unhandled fire-and-forget error for ${videoParams.videoId}:`, err.message)
      );
    });
  }
}

module.exports = new InlinePipelineService();
