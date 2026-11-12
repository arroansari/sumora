const { createTranscriptWorker } = require('./workers/transcript.worker');
const { createSummarizationWorker } = require('./workers/summarization.worker');
const { createNotificationWorker } = require('./workers/notification.worker');

class WorkerManager {
  constructor() {
    this.workers = [];
    this.isRunning = false;
  }

  startAll() {
    if (this.isRunning) {
      console.log('[WorkerManager] Workers are already running');
      return;
    }

    try {
      console.log('[WorkerManager] Starting BullMQ background workers...');
      this.workers.push(createTranscriptWorker());
      this.workers.push(createSummarizationWorker());
      this.workers.push(createNotificationWorker());
      this.isRunning = true;
      console.log(`[WorkerManager] ${this.workers.length} workers successfully active`);
    } catch (error) {
      console.warn('[WorkerManager] Failed to start workers (is Redis running?):', error.message);
    }
  }

  async stopAll() {
    console.log('[WorkerManager] Gracefully shutting down workers...');
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

