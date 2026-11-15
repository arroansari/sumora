const express = require('express');
const router = express.Router();
const healthRoutes = require('./health.routes');
const { authRoutes } = require('../modules/auth');
const { integrationsRoutes, webSubRoutes, redditRoutes, redditController } = require('../modules/integrations');
const contentController = require('../modules/integrations/content/contentController');
const { sourcesRoutes } = require('../modules/sources');
const { transcriptRoutes } = require('../modules/transcripts');
const { videosRoutes, videosController } = require('../modules/videos');
const { preferencesRoutes, devicesRoutes } = require('../modules/notifications');
const { authLimiter, apiLimiter } = require('../middlewares/rateLimiter');
const { authenticate } = require('../middlewares/auth.middleware');

// Health check endpoint (/api/health)
router.use('/', healthRoutes);

// Sensitive Authentication endpoints with strict rate limiting (/api/auth/*)
router.use('/auth', authLimiter, authRoutes);

// Space Filters Endpoint (/api/feed/filters?space=...)
router.get('/feed/filters', apiLimiter, (req, res, next) => {
  return contentController.getFilters(req, res, next);
});

// Unified Space Feed Endpoint (/api/feed?space=YOUTUBE | REDDIT | TMDB | OPEN_LIBRARY)
router.get('/feed', apiLimiter, authenticate, (req, res, next) => {
  const target = (req.query.space || req.query.platform || '').toUpperCase();
  if (target === 'REDDIT') {
    return redditController.getFeed(req, res, next);
  }
  if (target === 'TMDB' || target === 'CINEMA') {
    return contentController.getCinemaFeed(req, res, next);
  }
  if (target === 'OPEN_LIBRARY' || target === 'BOOKS' || target === 'BOOK') {
    return contentController.getBookFeed(req, res, next);
  }
  return videosController.getFeed(req, res, next);
});

// General API Endpoints with rate limiting
router.use('/integrations', apiLimiter, integrationsRoutes);
router.use('/sources', apiLimiter, sourcesRoutes);
router.use('/transcripts', apiLimiter, transcriptRoutes);
router.use('/videos', apiLimiter, videosRoutes);
router.use('/reddit', apiLimiter, redditRoutes);
router.use('/preferences', apiLimiter, preferencesRoutes);
router.use('/devices', apiLimiter, devicesRoutes);

// External Webhooks (/api/webhooks/youtube)
router.use('/webhooks', webSubRoutes);

// Root API info
router.get('/', (req, res) => {
  res.json({
    name: 'Sumora API',
    tagline: 'All your content. One place. Smarter insights.',
    version: '1.0.0',
    documentation: '/docs',
  });
});

module.exports = router;
