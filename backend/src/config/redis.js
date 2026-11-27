const Redis = require('ioredis');
const config = require('./index');

let redisClient = null;
let fastRedisClient = null;
let fastRedisReady = false;

function buildBaseOptions(overrides = {}) {
  const options = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    ...overrides,
  };

  if (config.redis.tls) {
    options.tls = {
      rejectUnauthorized: config.redis.rejectUnauthorized,
    };
  }
  return options;
}

function createClient(overrides = {}) {
  const options = buildBaseOptions(overrides);
  if (config.redis.url) {
    return new Redis(config.redis.url, options);
  }
  return new Redis({
    ...options,
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
  });
}

function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient();

    redisClient.on('error', (err) => {
      console.warn('[Redis] Connection warning:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });
  }
  return redisClient;
}

/**
 * Non-blocking, fail-fast Redis client for API hot-path features
 * (distributed rate limiting, locks, cache-aside reads).
 * Never queues offline commands so Redis outages degrade gracefully in <1ms.
 */
function getFastRedisClient() {
  if (!fastRedisClient) {
    fastRedisClient = createClient({
      lazyConnect: false,
      enableReadyCheck: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 1500,
      commandTimeout: 750,
      retryStrategy: (times) => {
        if (process.env.NODE_ENV === 'test') return null;
        return Math.min(times * 250, 5000);
      },
    });

    fastRedisClient.on('ready', () => {
      fastRedisReady = true;
      if (fastRedisClient?.stream && typeof fastRedisClient.stream.unref === 'function') {
        fastRedisClient.stream.unref();
      }
    });

    fastRedisClient.on('close', () => {
      fastRedisReady = false;
    });

    fastRedisClient.on('end', () => {
      fastRedisReady = false;
    });

    fastRedisClient.on('error', () => {
      fastRedisReady = false;
    });
  }
  return fastRedisClient;
}

function isRedisReady() {
  return Boolean(fastRedisClient && fastRedisReady && fastRedisClient.status === 'ready');
}

async function closeRedisClients() {
  const closers = [];
  if (redisClient) {
    closers.push(redisClient.quit().catch(() => redisClient.disconnect()));
    redisClient = null;
  }
  if (fastRedisClient) {
    closers.push(fastRedisClient.quit().catch(() => fastRedisClient.disconnect()));
    fastRedisClient = null;
    fastRedisReady = false;
  }
  await Promise.all(closers);
}

module.exports = {
  getRedisClient,
  getFastRedisClient,
  isRedisReady,
  closeRedisClients,
  redisConfig: config.redis,
};
