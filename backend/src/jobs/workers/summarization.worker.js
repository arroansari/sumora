const { Worker } = require('bullmq');
const { connection, QUEUE_NAMES, getQueue } = require('../index');
const prisma = require('../../config/db');
const { summarizationService } = require('../../modules/ai');

/**
 * Creates and starts the BullMQ Worker for AI video summarization.
 */
function createSummarizationWorker() {
  const worker = new Worker(
    QUEUE_NAMES.AI_SUMMARIZATION,
    async (job) => {
      const { videoId, channelId, title, videoUrl, transcript } = job.data;
      console.log(`[SummarizationWorker] Processing job ${job.id} for video: ${videoId}`);

      try {
        // 1. Update status to 'processing'
        await prisma.video.updateMany({
          where: { videoId },
          data: { summaryStatus: 'processing' },
        });

        // 2. Generate grounded AI summary
        const summary = await summarizationService.generateSummary({
          videoId,
          title,
          videoUrl,
          normalizedTranscript: transcript,
        });

        // 3. Enqueue push notification job to notify all subscribers
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
              backoff: {
                type: 'exponential',
                delay: 3000,
              },
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

        // Check if final attempt
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
      concurrency: parseInt(process.env.AI_WORKER_CONCURRENCY, 10) || 2,
      limiter: {
        max: parseInt(process.env.AI_MAX_REQUESTS_PER_MINUTE, 10) || 15,
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

