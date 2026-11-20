const { Worker } = require('bullmq');

const config = require('../config');

let workerInstances = [];

/**
 * Returns connection options for BullMQ workers and queues.
 * lazyConnect = false here so BullMQ can detect Redis availability,
 * but enableOfflineQueue = false prevents queuing up commands that never flush.
 */
function getConnectionOptions() {
  const isTls = config.redis.tls;
  const tlsOptions = isTls
    ? { tls: { rejectUnauthorized: config.redis.rejectUnauthorized } }
    : {};

  if (config.redis.url) {
    // When using URL string with BullMQ / ioredis
    // If URL starts with rediss:// or tls is enabled, include tls option
    try {
      const parsedUrl = new URL(config.redis.url);
      const isRediss = parsedUrl.protocol === 'rediss:';
      return {
        host: parsedUrl.hostname,
        port: parseInt(parsedUrl.port, 10) || (isRediss ? 6380 : 6379),
        password: parsedUrl.password ? decodeURIComponent(parsedUrl.password) : undefined,
        username: parsedUrl.username ? decodeURIComponent(parsedUrl.username) : undefined,
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        connectTimeout: 5000,
        ...(isRediss || isTls ? { tls: { rejectUnauthorized: config.redis.rejectUnauthorized } } : {}),
        retryStrategy: (times) => {
          if (times > 3) return null; // stop retrying after 3 attempts
          return Math.min(times * 1000, 3000);
        },
      };
    } catch {
      // Fallback if URL parsing fails
    }
  }

  return {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    ...tlsOptions,
    retryStrategy: (times) => {
      if (times > 3) return null; // stop retrying after 3 attempts
      return Math.min(times * 1000, 3000);
    },
  };
}

const QUEUE_NAMES = {
  TRANSCRIPT_INGESTION: 'transcript-ingestion',
  AI_SUMMARIZATION: 'ai-summarization',
  PUSH_NOTIFICATIONS: 'push-notifications',
  CHANNEL_POLLING: 'channel-polling',
  REDDIT_SYNC: 'reddit-sync-queue',
  REDDIT_SUMMARY: 'reddit-summary-queue',
};

let queuesCache = {};
let isRedisDisabled = false;

function setRedisDisabled(disabled) {
  isRedisDisabled = Boolean(disabled);
}

/**
 * Returns a BullMQ Queue or null when Redis is unavailable.
 * Callers must handle null and use the inline pipeline as fallback.
 */
function getQueue(name) {
  if (isRedisDisabled) return null;
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

module.exports = { QUEUE_NAMES, getQueue, connection, setRedisDisabled };
