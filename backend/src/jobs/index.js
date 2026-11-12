const { Queue, Worker } = require('bullmq');
const { redisConfig } = require('../config/redis');

// Connection options for BullMQ
const connection = {
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
  maxRetriesPerRequest: null,
};

// Defined queues for Sumora
const QUEUE_NAMES = {
  TRANSCRIPT_INGESTION: 'transcript-ingestion',
  AI_SUMMARIZATION: 'ai-summarization',
  PUSH_NOTIFICATIONS: 'push-notifications',
  CHANNEL_POLLING: 'channel-polling',
};

const queues = {};

function getQueue(name) {
  if (!queues[name]) {
    queues[name] = new Queue(name, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
      },
    });
  }
  return queues[name];
}

module.exports = {
  QUEUE_NAMES,
  getQueue,
  connection,
};
