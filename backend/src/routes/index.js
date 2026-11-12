const express = require('express');
const router = express.Router();
const healthRoutes = require('./health.routes');
const { authRoutes } = require('../modules/auth');
const { integrationsRoutes, webSubRoutes } = require('../modules/integrations');
const { sourcesRoutes } = require('../modules/sources');
const { transcriptRoutes } = require('../modules/transcripts');
const { videosRoutes } = require('../modules/videos');
const { preferencesRoutes, devicesRoutes } = require('../modules/notifications');
const { authLimiter, apiLimiter } = require('../middlewares/rateLimiter');

// Health check endpoint (/api/health)
router.use('/', healthRoutes);

// Sensitive Authentication endpoints with strict rate limiting (/api/auth/*)
router.use('/auth', authLimiter, authRoutes);

// General API Endpoints with rate limiting
router.use('/integrations', apiLimiter, integrationsRoutes);
router.use('/sources', apiLimiter, sourcesRoutes);
router.use('/transcripts', apiLimiter, transcriptRoutes);
router.use('/videos', apiLimiter, videosRoutes);
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
