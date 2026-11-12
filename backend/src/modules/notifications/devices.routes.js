const express = require('express');
const preferencesController = require('./preferences.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.post('/', (req, res, next) => preferencesController.registerDevice(req, res, next));

module.exports = router;

