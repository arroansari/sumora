const express = require('express');
const sourcesController = require('./sources.controller');
const { redditController } = require('../integrations/reddit');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate);

// YouTube / General Sources
router.get('/', (req, res, next) => sourcesController.listSources(req, res, next));
router.post('/', (req, res, next) => sourcesController.addSource(req, res, next));
router.post('/:id/toggle', (req, res, next) => sourcesController.toggleSource(req, res, next));
router.patch('/:id/toggle', (req, res, next) => sourcesController.toggleSource(req, res, next));
router.patch('/:id', (req, res, next) => sourcesController.toggleSource(req, res, next));
router.delete('/:id', (req, res, next) => sourcesController.removeSource(req, res, next));

// Reddit Subreddit Sources
router.get('/reddit', (req, res, next) => redditController.listSources(req, res, next));
router.post('/reddit', (req, res, next) => redditController.addSource(req, res, next));
router.post('/reddit/:id/toggle', (req, res, next) => redditController.toggleSource(req, res, next));
router.delete('/reddit/:id', (req, res, next) => redditController.removeSource(req, res, next));

module.exports = router;

