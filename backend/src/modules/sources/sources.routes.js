const express = require('express');
const sourcesController = require('./sources.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', (req, res, next) => sourcesController.listSources(req, res, next));
router.post('/', (req, res, next) => sourcesController.addSource(req, res, next));
router.delete('/:id', (req, res, next) => sourcesController.removeSource(req, res, next));

module.exports = router;

