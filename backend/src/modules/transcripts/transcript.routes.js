const express = require('express');
const transcriptController = require('./transcript.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

// GET transcript for video
router.get('/:videoId', authenticate, (req, res, next) =>
  transcriptController.getTranscript(req, res, next)
);

// POST user-provided transcript fallback
router.post('/:videoId', authenticate, (req, res, next) =>
  transcriptController.submitTranscript(req, res, next)
);

module.exports = router;

