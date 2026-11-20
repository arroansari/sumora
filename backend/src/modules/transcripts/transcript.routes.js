const express = require('express');
const transcriptController = require('./transcript.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { transcriptLimiter } = require('../../middlewares/rateLimiter');

const router = express.Router();

// GET transcript for video (capped to 10/day per user)
router.get('/:videoId', authenticate, transcriptLimiter, (req, res, next) =>
  transcriptController.getTranscript(req, res, next)
);

// POST user-provided transcript fallback
router.post('/:videoId', authenticate, (req, res, next) =>
  transcriptController.submitTranscript(req, res, next)
);

module.exports = router;

