const { Worker } = require('bullmq');
const { connection, QUEUE_NAMES, getQueue } = require('../index');
const prisma = require('../../config/db');
const config = require('../../config');
const { summarizationService } = require('../../modules/ai');

/**
 * Creates and starts the BullMQ Worker for AI video summarization.
 */
function createSummarizationWorker() {
  const concurrency = config.ai?.workerConcurrency || parseInt(process.env.AI_WORKER_CONCURRENCY, 10) || 10;
  const maxPerMinute = config.ai?.maxRequestsPerMinute || parseInt(process.env.AI_MAX_REQUESTS_PER_MINUTE, 10) || 120;

  const worker = new Worker(
    QUEUE_NAMES.AI_SUMMARIZATION,
    async (job) => {
      const { videoId, channelId, title, videoUrl, transcript, directVideoFallback } = job.data;
      console.log(`[SummarizationWorker] Processing job ${job.id} for video: ${videoId}`);

      try {
        const [, channelSource] = await Promise.all([
          prisma.video.updateMany({
            where: { videoId },
            data: { summaryStatus: 'processing' },
          }),
          channelId
            ? prisma.trackedSource
                .findFirst({
                  where: { sourceId: channelId, platform: 'youtube' },
                  select: { sourceName: true },
                })
                .catch(() => null)
            : Promise.resolve(null),
        ]);

        const summary = directVideoFallback
          ? await summarizationService.generateSummaryFromVideo({
              videoId,
              title,
              channelName: channelSource?.sourceName || undefined,
              videoUrl,
            })
          : await summarizationService.generateSummary({
              videoId,
              title,
              channelName: channelSource?.sourceName || undefined,
              videoUrl,
              normalizedTranscript: transcript,
            });

        const notificationQueue = getQueue(QUEUE_NAMES.PUSH_NOTIFICATIONS);
        if (notificationQueue) {
          await notificationQueue.add(
            'dispatch-notification',
            {
              videoId,
              channelId,
              title,
              headline: summary.overview?.slice(0, 100) || title,
            },
            {
              jobId: `notification-${videoId}`,
              attempts: 3,
              backoff: { type: 'exponential', delay: 3000 },
              removeOnComplete: true,
            }
          );
        }

        return {
          status: 'completed',
          videoId,
          summaryId: summary.id,
        };
      } catch (error) {
        console.error(`[SummarizationWorker] Job failed for video ${videoId}:`, error.message);

        if (job.attemptsMade + 1 >= (job.opts?.attempts || 3)) {
          await prisma.video.updateMany({
            where: { videoId },
            data: { summaryStatus: 'failed' },
          });
        }

        throw error;
      }
    },
    {
      connection,
      concurrency,
      limiter: {
        max: maxPerMinute,
        duration: 60000,
      },
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[SummarizationWorker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`);
  });

  return worker;
}

module.exports = {
  createSummarizationWorker,
};
