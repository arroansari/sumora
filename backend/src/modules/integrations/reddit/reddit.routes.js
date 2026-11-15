const express = require('express');
const router = express.Router();
const redditController = require('./reddit.controller');
const { authenticate, optionalAuthenticate } = require('../../../middlewares/auth.middleware');

// Public / Callback OAuth Routes
router.get('/connect', optionalAuthenticate, (req, res, next) =>
  redditController.getConnectUrl(req, res, next)
);
router.get('/callback', (req, res, next) =>
  redditController.handleOAuthCallback(req, res, next)
);

router.use(authenticate);

// Feed & Summaries
router.get('/feed', (req, res, next) => redditController.getFeed(req, res, next));
router.get('/posts/:postId/summary', (req, res, next) => redditController.getPostSummary(req, res, next));
router.post('/sync', (req, res, next) => redditController.syncNow(req, res, next));

// Subreddit Source Management
router.get('/sources', (req, res, next) => redditController.listSources(req, res, next));
router.post('/sources', (req, res, next) => redditController.addSource(req, res, next));
router.post('/sources/:id/toggle', (req, res, next) => redditController.toggleSource(req, res, next));
router.delete('/sources/:id', (req, res, next) => redditController.removeSource(req, res, next));

module.exports = router;

