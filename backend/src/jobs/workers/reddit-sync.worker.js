const { Worker } = require('bullmq');
const { connection, QUEUE_NAMES } = require('../index');
const prisma = require('../../config/db');

function createRedditSyncWorker() {
  const redditService = require('../../modules/integrations/reddit/reddit.service');

  const worker = new Worker(
    QUEUE_NAMES.REDDIT_SYNC,
    async (job) => {
      console.log(`[RedditSyncWorker] Processing sync job ${job.id}...`);
      const { subreddit, limit = 10 } = job.data || {};

      if (subreddit) {
        await redditService.syncSubredditPosts(subreddit, limit);
      } else {
        // Sync all active subreddits across all users
        const activeSources = await prisma.trackedSource.findMany({
          where: { platform: 'reddit', isActive: true },
          distinct: ['sourceId'],
        });

        for (const source of activeSources) {
          try {
            await redditService.syncSubredditPosts(source.sourceId, limit);
          } catch (err) {
            console.warn(`[RedditSyncWorker] Error syncing r/${source.sourceId}:`, err.message);
          }
        }
      }

      return { status: 'completed' };
    },
    { connection, concurrency: 2 }
  );

  return worker;
}

module.exports = { createRedditSyncWorker };

