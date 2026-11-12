const { Worker } = require('bullmq');
const { connection, QUEUE_NAMES, getQueue } = require('../index');
const prisma = require('../../config/db');
const { transcriptService } = require('../../modules/transcripts');

/**
 * Creates and starts the BullMQ Worker for transcript ingestion.
 */
function createTranscriptWorker() {
  const worker = new Worker(
    QUEUE_NAMES.TRANSCRIPT_INGESTION,
    async (job) => {
      const { videoId, channelId, title, videoUrl } = job.data;
      console.log(`[TranscriptWorker] Processing job ${job.id} for video: ${videoId} (${title})`);

      try {
        // 1. Update Video status to fetching_transcript
        await prisma.video.updateMany({
          where: { videoId },
          data: { transcriptStatus: 'fetching_transcript' },
        });

        // 2. Retrieve & normalize transcript via provider chain
        const result = await transcriptService.getOrFetchTranscript(videoId);

        // 3. Handle unavailable transcript
        if (result.status === 'transcript_unavailable' || !result.transcript) {
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

          return {
            status: 'transcript_unavailable',
            videoId,
            message: result.message,
          };
        }

        // 4. On successful transcript retrieval, enqueue AI summarization job
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
              jobId: `summary-${videoId}`, // Prevent duplicate summary jobs for the same video
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 5000,
              },
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
      concurrency: 5, // Process up to 5 video transcripts concurrently
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

