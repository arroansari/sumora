const redditService = require('./reddit.service');
const { verifyOAuthState } = require('../../../utils/oauth.util');
const prisma = require('../../../config/db');

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

  /**
   * GET /api/auth/reddit/connect or GET /api/integrations/reddit/connect
   */
  getConnectUrl(req, res, next) {
    try {
      const userId = req.user?.id || req.query.userId || null;
      const result = redditService.getConnectUrl(userId);
      if (req.headers.accept?.includes('text/html') && !req.xhr) {
        return res.redirect(result.url);
      }
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/reddit/callback (and GET /api/integrations/reddit/callback)
   * Handles the Reddit OAuth2 callback with authorization code.
   * Decodes userId from state/JWT, exchanges code for tokens, syncs subreddits,
   * then deep-links back to the mobile app or renders confirmation HTML.
   */
  async handleOAuthCallback(req, res, next) {
    try {
      const { code, state, error: oauthError } = req.query;

      // Handle OAuth error
      if (oauthError) {
        const errorMsg = `Reddit authorization failed: ${oauthError}`;
        if (req.headers.accept?.includes('text/html')) {
          return res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Reddit Connection Failed · Sumora</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B0F19; color: #FFFFFF; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                .card { background: #161F30; border: 1px solid #EF444455; border-radius: 20px; padding: 32px; max-width: 440px; text-align: center; }
                h1 { color: #EF4444; font-size: 22px; margin-bottom: 12px; }
                p { color: #94A3B8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
                a.btn { display: inline-block; background: #EF4444; color: #FFFFFF; font-weight: 700; padding: 12px 24px; border-radius: 12px; text-decoration: none; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Connection Failed</h1>
                <p>${errorMsg}</p>
                <a class="btn" href="sumora://oauth/callback?success=false&platform=reddit&error=${encodeURIComponent(oauthError)}">Return to Sumora</a>
              </div>
            </body>
            </html>
          `);
        }
        return res.redirect(`sumora://oauth/callback?success=false&platform=reddit&error=${encodeURIComponent(oauthError)}`);
      }

      if (!code) {
        if (req.headers.accept?.includes('text/html')) {
          return res.status(400).send('Missing authorization code in Reddit callback.');
        }
        return res.redirect(`sumora://oauth/callback?success=false&platform=reddit&error=missing_code`);
      }

      // Resolve and verify userId from JWT or HMAC-signed state
      let userId = req.user?.id;
      if (!userId && state) {
        const decodedState = verifyOAuthState(state);
        if (decodedState && decodedState.userId && decodedState.userId !== 'anonymous') {
          userId = decodedState.userId;
        }
      }

      if (userId) {
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
          userId = null;
        }
      }

      if (!userId) {
        const errorMsg = 'unauthenticated_or_invalid_state';
        if (req.headers.accept?.includes('text/html')) {
          return res.status(401).send(`
            <!DOCTYPE html>
            <html>
            <body style="font-family: sans-serif; background: #0B0F19; color: #fff; text-align: center; padding: 40px;">
              <h2 style="color: #EF4444;">Authentication Required</h2>
              <p style="color: #94A3B8;">Please log in to Sumora before connecting Reddit.</p>
              <a style="color: #FF4500;" href="sumora://oauth/callback?success=false&platform=reddit&error=unauthenticated">Return to App</a>
            </body>
            </html>
          `);
        }
        return res.redirect(`sumora://oauth/callback?success=false&platform=reddit&error=${errorMsg}`);
      }

      // Run token exchange and subscribed subreddit sync
      const result = await redditService.handleRedditCallback(userId, code);

      if (req.headers.accept?.includes('text/html')) {
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Reddit Connected · Sumora</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B0F19; color: #FFFFFF; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
              .card { background: #161F30; border: 1px solid #10B98144; border-radius: 20px; padding: 36px 28px; max-width: 440px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
              .badge { display: inline-flex; width: 64px; height: 64px; border-radius: 32px; background: #FF4500; align-items: center; justify-content: center; font-size: 28px; font-weight: 900; color: #fff; margin-bottom: 20px; }
              h1 { color: #FFFFFF; font-size: 22px; font-weight: 800; margin: 0 0 10px 0; }
              p { color: #94A3B8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
              a.btn { display: inline-block; background: #FF4500; color: #FFFFFF; font-weight: 800; font-size: 15px; padding: 14px 28px; border-radius: 14px; text-decoration: none; transition: opacity 0.2s; }
              a.btn:hover { opacity: 0.9; }
            </style>
            <script>
              setTimeout(function() {
                window.location.href = "sumora://oauth/callback?success=true&platform=reddit";
              }, 600);
            </script>
          </head>
          <body>
            <div class="card">
              <div class="badge">r/</div>
              <h1>Reddit Connected!</h1>
              <p>Your Reddit account (u/${result.profile.name}) has been connected. Imported ${result.importedSubredditsCount} subscribed subreddits into Sumora.</p>
              <a class="btn" href="sumora://oauth/callback?success=true&platform=reddit">Open Sumora App</a>
            </div>
          </body>
          </html>
        `);
      }

      return res.redirect(`sumora://oauth/callback?success=true&platform=reddit`);
    } catch (error) {
      console.error('[RedditController] OAuth callback error:', error.message);
      if (req.headers.accept?.includes('text/html')) {
        return res.status(500).send(`
          <!DOCTYPE html>
          <html>
          <body style="font-family: sans-serif; background: #0B0F19; color: #fff; text-align: center; padding: 40px;">
            <h2 style="color: #EF4444;">Connection Error</h2>
            <p style="color: #94A3B8;">${error.message}</p>
            <a style="color: #FF4500;" href="sumora://oauth/callback?success=false&platform=reddit&error=${encodeURIComponent(error.message)}">Return to App</a>
          </body>
          </html>
        `);
      }
      return res.redirect(`sumora://oauth/callback?success=false&platform=reddit&error=${encodeURIComponent(error.message)}`);
    }
  }
}

module.exports = new RedditController();

