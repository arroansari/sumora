const { Worker } = require('bullmq');
const { connection, QUEUE_NAMES, getQueue } = require('../index');
const prisma = require('../../config/db');
const config = require('../../config');
const { transcriptService } = require('../../modules/transcripts');
const aiStream = require('../../utils/aiStream.util');

/**
 * Creates and starts the BullMQ Worker for transcript ingestion.
 */
function createTranscriptWorker() {
  const concurrency = parseInt(process.env.TRANSCRIPT_WORKER_CONCURRENCY, 10) || 10;

  const worker = new Worker(
    QUEUE_NAMES.TRANSCRIPT_INGESTION,
    async (job) => {
      const { videoId, channelId, title, videoUrl } = job.data;
      console.log(`[TranscriptWorker] Processing job ${job.id} for video: ${videoId} (${title})`);
      aiStream.publish(videoId, { stage: 'fetching_transcript' });

      try {
        await prisma.video.updateMany({
          where: { videoId },
          data: { transcriptStatus: 'fetching_transcript' },
        });

        const result = await transcriptService.getOrFetchTranscript(videoId);

        if (result.status === 'transcript_unavailable' || !result.transcript) {
          const allowDirectVideo =
            process.env.ALLOW_DIRECT_VIDEO_AI !== 'false' &&
            Boolean(config.ai.geminiApiKeys?.length || config.ai.geminiApiKey);

          const summaryQueue = allowDirectVideo ? getQueue(QUEUE_NAMES.AI_SUMMARIZATION) : null;
          if (summaryQueue) {
            console.log(
              `[TranscriptWorker] Transcript unavailable for ${videoId}; queuing direct Gemini video fallback.`
            );
            await summaryQueue.add(
              'generate-summary-direct-video',
              {
                videoId,
                channelId,
                title,
                videoUrl,
                directVideoFallback: true,
              },
              {
                jobId: `summary-${videoId}`,
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: true,
              }
            );
            return { status: 'queued_direct_video', videoId };
          }

          console.log(
            `[TranscriptWorker] Transcript unavailable for video ${videoId}. Halting pipeline without summary generation.`
          );

          await prisma.video.updateMany({
            where: { videoId },
            data: {
              transcriptStatus: 'transcript_unavailable',
              summaryStatus: 'transcript_unavailable',
            },
          });

          aiStream.publish(videoId, {
            stage: 'transcript_unavailable',
            message: result.message,
          });

          return {
            status: 'transcript_unavailable',
            videoId,
            message: result.message,
          };
        }

        aiStream.publish(videoId, {
          stage: 'transcript_ready',
          transcript: result.transcript,
        });

        console.log(`[TranscriptWorker] Transcript retrieved for video ${videoId}. Enqueueing AI summarization...`);
        const summaryQueue = getQueue(QUEUE_NAMES.AI_SUMMARIZATION);

        if (summaryQueue) {
          await summaryQueue.add(
            'generate-summary',
            {
              videoId,
              channelId,
              title,
              videoUrl,
              transcript: result.transcript,
            },
            {
              jobId: `summary-${videoId}`,
              attempts: 3,
              backoff: { type: 'exponential', delay: 5000 },
              removeOnComplete: true,
            }
          );
        }

        return {
          status: 'completed',
          videoId,
        };
      } catch (error) {
        console.error(`[TranscriptWorker] Job failed for video ${videoId}:`, error.message);

        await prisma.video.updateMany({
          where: { videoId },
          data: { transcriptStatus: 'failed' },
        });

        throw error;
      }
    },
    {
      connection,
      concurrency,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[TranscriptWorker] Job ${job?.id} permanently failed: ${err.message}`);
  });

  return worker;
}

module.exports = {
  createTranscriptWorker,
};
