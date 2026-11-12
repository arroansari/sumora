const express = require('express');
const webSubController = require('./websub.controller');

const router = express.Router();

// GET challenge verification handshake
router.get('/youtube', (req, res) => webSubController.verifyWebhook(req, res));

// POST upload notification
router.post('/youtube', (req, res, next) => webSubController.handleWebhookNotification(req, res, next));

module.exports = router;

