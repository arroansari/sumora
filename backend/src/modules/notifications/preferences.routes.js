const express = require('express');
const preferencesController = require('./preferences.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', (req, res, next) => preferencesController.getPreferences(req, res, next));
router.put('/', (req, res, next) => preferencesController.updatePreference(req, res, next));

module.exports = router;

