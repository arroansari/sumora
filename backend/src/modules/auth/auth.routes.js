const express = require('express');
const authController = require('./auth.controller');
const { validateRegister, validateLogin } = require('./auth.validator');
const { authenticate, optionalAuthenticate } = require('../../middlewares/auth.middleware');
const { redditController } = require('../integrations/reddit');

const router = express.Router();

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

// ─── Reddit OAuth Endpoints (/api/auth/reddit/*) ──────────────────────────────
router.get('/reddit/connect', optionalAuthenticate, (req, res, next) =>
  redditController.getConnectUrl(req, res, next)
);
router.get('/reddit/callback', (req, res, next) =>
  redditController.handleOAuthCallback(req, res, next)
);

module.exports = router;

