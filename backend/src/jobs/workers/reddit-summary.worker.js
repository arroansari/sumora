const { Worker } = require('bullmq');
const { connection, QUEUE_NAMES } = require('../index');
const summarizationService = require('../../modules/ai/summarization.service');

function createRedditSummaryWorker() {
  const worker = new Worker(
    QUEUE_NAMES.REDDIT_SUMMARY,
    async (job) => {
      console.log(`[RedditSummaryWorker] Processing summary job ${job.id} for post ${job.data.postId}...`);
      const { postId, title, author, subreddit, selftext, comments } = job.data;

      const summary = await summarizationService.generateRedditSummary({
        postId,
        title,
        author,
        subreddit,
        selftext,
        comments,
      });

      return { status: 'completed', summaryId: summary.id };
    },
    { connection, concurrency: 3 }
  );

  return worker;
}

module.exports = { createRedditSummaryWorker };

