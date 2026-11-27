const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { getFastRedisClient } = require('../config/redis');

/**
 * Builds a cluster-safe RedisStore for express-rate-limit when Redis is enabled
 * (non-test environments). Falls back gracefully to in-memory MemoryStore in test
 * or if Redis is temporarily offline (passOnStoreError: true).
 */
function isTestContext() {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.DISABLE_REDIS_RATE_LIMIT === 'true' ||
    Boolean(require.main && require.main.filename && require.main.filename.includes('/tests/'))
  );
}

function createStore(prefix) {
  if (isTestContext()) {
    return undefined;
  }

  const client = getFastRedisClient();
  const store = new RedisStore({
    prefix,
    sendCommand: (...args) => {
      if (client.status !== 'ready') {
        return Promise.reject(new Error('Redis rate-limit store not ready'));
      }
      return client.call(...args);
    },
  });

  // Prevent unhandled promise rejection if Redis is down during module load
  if (store.incrementScriptSha && typeof store.incrementScriptSha.catch === 'function') {
    store.incrementScriptSha.catch(() => {});
  }
  if (store.getScriptSha && typeof store.getScriptSha.catch === 'function') {
    store.getScriptSha.catch(() => {});
  }

  return store;
}

/**
 * Strict rate limiter for sensitive authentication endpoints (login, register).
 * Max 15 attempts per 15 minutes per IP across all cluster workers.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createStore('rl:auth:'),
  message: {
    error: 'TooManyRequests',
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Standard rate limiter for general API endpoints.
 * Max 300 requests per minute across all cluster workers.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createStore('rl:api:'),
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests. Please slow down.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DAILY_SUMMARIZE_MAX =
  parseInt(process.env.SUMMARIZE_DAILY_LIMIT, 10) || (IS_PRODUCTION ? 25 : 200);
const DAILY_TRANSCRIPT_MAX =
  parseInt(process.env.TRANSCRIPT_DAILY_LIMIT, 10) || (IS_PRODUCTION ? 25 : 200);

/**
 * Daily rate limiter for AI video summary generation.
 * Defaults to 25 summaries per 24h in production (200 in development) per user/IP across cluster workers.
 */
const summarizeLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: DAILY_SUMMARIZE_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createStore('rl:summarize:'),
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: 'QuotaExceeded',
    message: `Daily summarization limit reached (${DAILY_SUMMARIZE_MAX} video summaries/day). Limit resets every 24 hours.`,
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Daily rate limiter for fetching video transcripts.
 * Defaults to 25 transcripts per 24h in production (200 in development) per user/IP across cluster workers.
 */
const transcriptLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: DAILY_TRANSCRIPT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createStore('rl:transcript:'),
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: 'QuotaExceeded',
    message: `Daily transcript limit reached (${DAILY_TRANSCRIPT_MAX} video transcripts/day). Limit resets every 24 hours.`,
  },
  skip: () => process.env.NODE_ENV === 'test',
});

module.exports = {
  authLimiter,
  apiLimiter,
  summarizeLimiter,
  transcriptLimiter,
};
