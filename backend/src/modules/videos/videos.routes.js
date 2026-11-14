const express = require('express');
const videosController = require('./videos.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

// Video feed
router.get('/', (req, res, next) => videosController.getFeed(req, res, next));

// Sync fresh YouTube uploads on demand (pull-to-refresh)
router.post('/sync-feed', (req, res, next) =>
  videosController.syncFeed(req, res, next)
);

// Import any YouTube video by URL or ID on-demand
router.post('/import', (req, res, next) =>
  videosController.importVideo(req, res, next)
);

// Single video
router.get('/:videoId', (req, res, next) => videosController.getVideo(req, res, next));

// Full summary
router.get('/:videoId/summary', (req, res, next) => videosController.getSummary(req, res, next));

// Summary processing status
router.get('/:videoId/summary/status', (req, res, next) =>
  videosController.getSummaryStatus(req, res, next)
);

// Trigger summarization
router.post('/:videoId/summarize', (req, res, next) =>
  videosController.requestSummarization(req, res, next)
);

module.exports = router;

