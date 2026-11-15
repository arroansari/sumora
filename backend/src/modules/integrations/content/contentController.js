const contentService = require('./contentService');

class ContentController {
  async getCinemaFeed(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const filter = req.query.filter || 'all';
      const search = req.query.search || null;

      const result = await contentService.getCinemaFeed(req.user?.id, {
        page,
        limit,
        filter,
        search,
      });

      res.status(200).json({
        success: true,
        data: result.posts,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookFeed(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const filter = req.query.filter || 'all';
      const search = req.query.search || null;

      const result = await contentService.getBookFeed(req.user?.id, {
        page,
        limit,
        filter,
        search,
      });

      res.status(200).json({
        success: true,
        data: result.posts,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFilters(req, res, next) {
    try {
      const space = req.query.space || req.query.platform || 'YOUTUBE';
      const filters = contentService.getFilters(space);

      res.status(200).json({
        success: true,
        data: filters,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ContentController();

