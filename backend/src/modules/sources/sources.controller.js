const sourcesService = require('./sources.service');

class SourcesController {
  async listSources(req, res, next) {
    try {
      const sources = await sourcesService.listTrackedSources(req.user.id);
      res.status(200).json({
        success: true,
        data: sources,
      });
    } catch (error) {
      next(error);
    }
  }

  async addSource(req, res, next) {
    try {
      const { platform, sourceId, sourceName } = req.body;
      const source = await sourcesService.addTrackedSource(req.user.id, {
        platform,
        sourceId,
        sourceName,
      });
      res.status(201).json({
        success: true,
        message: 'Source tracked successfully',
        data: source,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeSource(req, res, next) {
    try {
      const { id } = req.params;
      const result = await sourcesService.removeTrackedSource(req.user.id, id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SourcesController();

