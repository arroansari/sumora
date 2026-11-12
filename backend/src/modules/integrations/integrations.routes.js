const express = require('express');
const integrationsController = require('./integrations.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

// List connected integrations
router.get('/', authenticate, (req, res, next) =>
  integrationsController.listIntegrations(req, res, next)
);

// Initiate YouTube OAuth connection
router.get('/youtube/connect', authenticate, (req, res, next) =>
  integrationsController.getYouTubeConnect(req, res, next)
);

// YouTube OAuth callback (receives state/code, optional token in auth header or state)
router.get('/youtube/callback', (req, res, next) =>
  integrationsController.handleYouTubeCallback(req, res, next)
);

// Disconnect integration
router.delete('/:id', authenticate, (req, res, next) =>
  integrationsController.disconnect(req, res, next)
);

module.exports = router;

