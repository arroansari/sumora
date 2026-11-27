const videosService = require('./videos.service');
const aiStream = require('../../utils/aiStream.util');

class VideosController {
  async getFeed(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const cursor = req.query.cursor || null;
      const channelId = req.query.channelId || null;
      const from = req.query.from || null;
      const to = req.query.to || null;
      const search = req.query.search || null;
      const sort = req.query.sort || null;

      if (sort === 'popular' && channelId) {
        const popularVids = await videosService.getPopularVideosForChannel(channelId, limit);
        return res.status(200).json({
          success: true,
          data: popularVids,
          pagination: { page: 1, limit, total: popularVids.length, totalPages: 1 },
        });
      }

      const jsonBody = await videosService.getFeedHttpJson(req.user.id, { page, limit, cursor, channelId, from, to, search });
      res.status(200).type('application/json').send(jsonBody);
    } catch (error) {
      next(error);
    }
  }

  async getPopularVideos(req, res, next) {
    try {
      const { channelId } = req.params;
      const limit = parseInt(req.query.limit, 10) || 10;
      const videos = await videosService.getPopularVideosForChannel(channelId, limit);
      res.status(200).json({
        success: true,
        data: videos,
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

  async streamSummary(req, res, next) {
    try {
      const { videoId } = req.params;
      const snapshot = await videosService.getSummaryStreamSnapshot(videoId);

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      if (typeof res.flushHeaders === 'function') res.flushHeaders();

      let closed = false;
      let unsubscribe = () => {};
      let keepaliveTimer = null;

      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (keepaliveTimer) clearInterval(keepaliveTimer);
        unsubscribe();
        if (!res.writableEnded) {
          res.end();
        }
      };

      const sendEvent = (payload) => {
        if (closed || res.writableEnded) return;
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      };

      const hasDetailed = Boolean(snapshot.summary && snapshot.summary.videoOverview);
      if (snapshot.summaryStatus === 'completed' && hasDetailed) {
        sendEvent({
          videoId,
          stage: 'completed',
          transcript: snapshot.transcript || null,
          summary: snapshot.summary,
        });
        cleanup();
        return;
      }

      if (snapshot.summaryStatus === 'transcript_unavailable') {
        sendEvent({ videoId, stage: 'transcript_unavailable' });
        cleanup();
        return;
      }

      sendEvent({
        videoId,
        stage: snapshot.summaryStatus || 'pending',
        transcriptStatus: snapshot.transcriptStatus,
        transcript: snapshot.transcript || null,
      });

      unsubscribe = aiStream.subscribe(videoId, (event) => {
        sendEvent(event);
        if (['completed', 'failed', 'transcript_unavailable'].includes(event?.stage)) {
          cleanup();
        }
      });

      keepaliveTimer = setInterval(() => {
        if (!closed && !res.writableEnded) {
          res.write(': ping\n\n');
        }
      }, 15000);
      keepaliveTimer.unref();

      req.on('close', cleanup);
      res.on('close', cleanup);
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

  async importVideo(req, res, next) {
    try {
      const { url, channelId } = req.body;
      const video = await videosService.importVideoByUrl(req.user.id, { url, channelId });
      res.status(201).json({
        success: true,
        data: video,
      });
    } catch (error) {
      next(error);
    }
  }

  async syncFeed(req, res, next) {
    try {
      const { priorityChannelIds = [] } = req.body || {};
      const result = await videosService.syncLatestFeedUploads(req.user.id, {
        priorityChannelIds,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async searchYouTube(req, res, next) {
    try {
      const query = req.query.q || req.query.query || '';
      const channelName = req.query.channelName || null;
      const channelId = req.query.channelId || null;
      const limit = parseInt(req.query.limit, 10) || 15;

      const videos = await videosService.searchYouTubeVideos({
        query,
        channelName,
        channelId,
        limit,
      });

      res.status(200).json({
        success: true,
        data: videos,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VideosController();

