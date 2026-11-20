const rateLimit = require('express-rate-limit');

/**
 * Strict rate limiter for sensitive authentication endpoints (login, register).
 * Max 15 attempts per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
  skip: () => process.env.NODE_ENV === 'test', // Skip in automated tests
});

/**
 * Standard rate limiter for general API endpoints.
 * Max 300 requests per minute.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests. Please slow down.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Daily rate limiter for AI video summary generation.
 * Max 10 summaries per 24 hours per user/IP to protect free-tier API quotas.
 */
const summarizeLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24-hour window
  max: 10, // 10 summaries per day
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: 'QuotaExceeded',
    message: 'Daily summarization limit reached (10 video summaries/day). Limit resets every 24 hours.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Daily rate limiter for fetching video transcripts.
 * Max 10 video transcripts per 24 hours per user/IP.
 */
const transcriptLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24-hour window
  max: 10, // 10 video transcripts per day
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: 'QuotaExceeded',
    message: 'Daily transcript limit reached (10 video transcripts/day). Limit resets every 24 hours.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

module.exports = {
  authLimiter,
  apiLimiter,
  summarizeLimiter,
  transcriptLimiter,
};

