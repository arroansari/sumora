const redditService = require('./reddit.service');

class RedditController {
  async getFeed(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const subreddit = req.query.subreddit || null;
      const filter = req.query.filter || 'all';
      const search = req.query.search || null;

      const result = await redditService.getRedditFeed(req.user.id, {
        page,
        limit,
        subreddit,
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

  async listSources(req, res, next) {
    try {
      const sources = await redditService.listTrackedSubreddits(req.user.id);
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
      const { subreddit, name, sourceName } = req.body;
      const target = subreddit || name || sourceName;
      if (!target) {
        return res.status(400).json({ success: false, message: 'Subreddit name is required' });
      }

      const source = await redditService.addTrackedSubreddit(req.user.id, target);
      res.status(201).json({
        success: true,
        message: `Successfully tracked r/${source.sourceId}`,
        data: source,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleSource(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await redditService.toggleSubreddit(req.user.id, id);
      res.status(200).json({
        success: true,
        message: `Updated status for ${updated.sourceName}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeSource(req, res, next) {
    try {
      const { id } = req.params;
      const result = await redditService.removeTrackedSubreddit(req.user.id, id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPostSummary(req, res, next) {
    try {
      const { postId } = req.params;
      const summary = await redditService.getPostSummary(postId);
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  async syncNow(req, res, next) {
    try {
      const { subreddit } = req.query;
      const targetSub = subreddit || 'technology';
      const synced = await redditService.syncSubredditPosts(targetSub, 5);
      res.status(200).json({
        success: true,
        message: `Synced ${synced.length} posts from r/${targetSub}`,
        data: synced,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RedditController();

