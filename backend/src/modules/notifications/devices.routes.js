const express = require('express');
const preferencesController = require('./preferences.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/', (req, res, next) => preferencesController.registerDevice(req, res, next));
router.post('/test-push', (req, res, next) => preferencesController.sendTestNotification(req, res, next));
router.delete('/:deviceToken', (req, res, next) => preferencesController.unregisterDevice(req, res, next));
router.delete('/', (req, res, next) => preferencesController.unregisterDevice(req, res, next));

module.exports = router;

