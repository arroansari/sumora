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
    // Quick TCP ping to Redis before attempting to start workers
    return new Promise((resolve) => {
      const net = require('net');
      const host = process.env.REDIS_HOST || '127.0.0.1';
      const port = parseInt(process.env.REDIS_PORT, 10) || 6379;

      const socket = new net.Socket();
      socket.setTimeout(1500);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.connect(port, host);
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

      const transcriptWorker = createTranscriptWorker();
      const summarizationWorker = createSummarizationWorker();
      const notificationWorker = createNotificationWorker();

      // Attach error handlers so worker errors never reach the process
      [transcriptWorker, summarizationWorker, notificationWorker].forEach((w) => {
        w.on('error', (err) => {
          console.warn(`[WorkerManager] Worker error (non-fatal):`, err.message);
        });
      });

      this.workers.push(transcriptWorker, summarizationWorker, notificationWorker);
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
