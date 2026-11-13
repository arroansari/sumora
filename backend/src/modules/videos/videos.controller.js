const videosService = require('./videos.service');

class VideosController {
  async getFeed(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const channelId = req.query.channelId || null;
      const from = req.query.from || null;
      const to = req.query.to || null;
      const result = await videosService.getFeed(req.user.id, { page, limit, channelId, from, to });
      res.status(200).json({
        success: true,
        data: result.videos,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getVideo(req, res, next) {
    try {
      const { videoId } = req.params;
      const video = await videosService.getVideoById(req.user.id, videoId);
      res.status(200).json({
        success: true,
        data: video,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req, res, next) {
    try {
      const { videoId } = req.params;
      const result = await videosService.getSummary(videoId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSummaryStatus(req, res, next) {
    try {
      const { videoId } = req.params;
      const result = await videosService.getSummaryStatus(videoId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async requestSummarization(req, res, next) {
    try {
      const { videoId } = req.params;
      const result = await videosService.requestSummarization(videoId);
      res.status(202).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VideosController();

