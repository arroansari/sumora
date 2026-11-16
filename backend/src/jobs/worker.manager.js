/**
 * WorkerManager
 *
 * Attempts to start BullMQ workers that require a Redis connection.
 * When Redis is unavailable, workers are skipped gracefully and the
 * inline pipeline (inline-pipeline.service.js) handles all processing.
 *
 * All worker errors are caught locally — none are allowed to propagate
 * to the process level and crash the server.
 */

class WorkerManager {
  constructor() {
    this.workers = [];
    this.isRunning = false;
    this._redisAvailable = null; // null = untested
  }

  async _checkRedisAvailable() {
    return new Promise((resolve) => {
      try {
        const Redis = require('ioredis');
        const { connection } = require('./index');
        const client = new Redis({
          ...connection,
          lazyConnect: false,
          connectTimeout: 2000,
          maxRetriesPerRequest: 0,
          retryStrategy: null,
          enableOfflineQueue: false,
        });

        const timer = setTimeout(() => {
          try { client.disconnect(); } catch {}
          resolve(false);
        }, 2500);

        client.ping()
          .then(() => {
            clearTimeout(timer);
            try { client.disconnect(); } catch {}
            resolve(true);
          })
          .catch(() => {
            clearTimeout(timer);
            try { client.disconnect(); } catch {}
            resolve(false);
          });
      } catch {
        resolve(false);
      }
    });
  }

  async startAll() {
    if (this.isRunning) {
      console.log('[WorkerManager] Workers already running');
      return;
    }

    const redisAvailable = await this._checkRedisAvailable();
    this._redisAvailable = redisAvailable;

    if (!redisAvailable) {
      console.log('[WorkerManager] Redis not available — BullMQ workers skipped.');
      console.log('[WorkerManager] Inline pipeline will process all transcript and summarization jobs.');
      return;
    }

    try {
      console.log('[WorkerManager] Redis available — starting BullMQ background workers…');

      const { createTranscriptWorker } = require('./workers/transcript.worker');
      const { createSummarizationWorker } = require('./workers/summarization.worker');
      const { createNotificationWorker } = require('./workers/notification.worker');
      const { createRedditSyncWorker } = require('./workers/reddit-sync.worker');
      const { createRedditSummaryWorker } = require('./workers/reddit-summary.worker');

      const transcriptWorker = createTranscriptWorker();
      const summarizationWorker = createSummarizationWorker();
      const notificationWorker = createNotificationWorker();
      const redditSyncWorker = createRedditSyncWorker();
      const redditSummaryWorker = createRedditSummaryWorker();

      // Attach error handlers so worker errors never reach the process
      [transcriptWorker, summarizationWorker, notificationWorker, redditSyncWorker, redditSummaryWorker].forEach((w) => {
        w.on('error', (err) => {
          console.warn(`[WorkerManager] Worker error (non-fatal):`, err.message);
        });
      });

      this.workers.push(transcriptWorker, summarizationWorker, notificationWorker, redditSyncWorker, redditSummaryWorker);
      this.isRunning = true;
      console.log(`[WorkerManager] ${this.workers.length} workers active`);
    } catch (error) {
      console.warn('[WorkerManager] Failed to start workers — inline pipeline will be used:', error.message);
    }
  }

  async stopAll() {
    console.log('[WorkerManager] Gracefully shutting down workers…');
    for (const worker of this.workers) {
      try {
        await worker.close();
      } catch (err) {
        console.warn('[WorkerManager] Error closing worker:', err.message);
      }
    }
    this.workers = [];
    this.isRunning = false;
    console.log('[WorkerManager] All workers closed');
  }
}

module.exports = new WorkerManager();
