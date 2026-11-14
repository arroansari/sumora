const { Worker } = require('bullmq');

let workerInstances = [];

/**
 * Returns connection options for BullMQ workers.
 * lazyConnect = false here so the Worker can detect Redis availability,
 * but enableOfflineQueue = false prevents queuing up commands that never flush.
 */
function getConnectionOptions() {
  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    connectTimeout: 3000,
    retryStrategy: (times) => {
      // After 2 retries give up — inline pipeline will handle processing
      if (times > 2) return null; // stop retrying
      return Math.min(times * 500, 2000);
    },
  };
}

const QUEUE_NAMES = {
  TRANSCRIPT_INGESTION: 'transcript-ingestion',
  AI_SUMMARIZATION: 'ai-summarization',
  PUSH_NOTIFICATIONS: 'push-notifications',
  CHANNEL_POLLING: 'channel-polling',
};

let queuesCache = {};

/**
 * Returns a BullMQ Queue or null when Redis is unavailable.
 * Callers must handle null and use the inline pipeline as fallback.
 */
function getQueue(name) {
  if (queuesCache[name] === null) return null;

  if (!queuesCache[name]) {
    try {
      const { Queue } = require('bullmq');
      queuesCache[name] = new Queue(name, {
        connection: getConnectionOptions(),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
        },
      });

      // If the underlying ioredis connection emits errors, mark queue as null
      queuesCache[name].on('error', (err) => {
        if (err.message?.includes('ECONNREFUSED') || err.message?.includes('Connection is closed')) {
          console.warn(`[Jobs] Queue "${name}" Redis error — switching to inline pipeline: ${err.message}`);
          queuesCache[name] = null;
        }
      });
    } catch (err) {
      console.warn(`[Jobs] Could not create queue "${name}": ${err.message}`);
      queuesCache[name] = null;
      return null;
    }
  }

  return queuesCache[name];
}

const connection = getConnectionOptions();

module.exports = { QUEUE_NAMES, getQueue, connection };
