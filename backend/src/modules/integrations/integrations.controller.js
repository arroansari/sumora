const integrationsService = require('./integrations.service');

class IntegrationsController {
  async listIntegrations(req, res, next) {
    try {
      const accounts = await integrationsService.listConnectedAccounts(req.user.id);
      res.status(200).json({
        success: true,
        data: accounts,
      });
    } catch (error) {
      next(error);
    }
  }

  getYouTubeConnect(req, res, next) {
    try {
      const result = integrationsService.getYouTubeConnectUrl(req.user.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/integrations/youtube/callback
   * Receives the OAuth2 authorization code from Google.
   * Decodes userId from state, exchanges code for tokens, syncs subscriptions,
   * then deep-links back to the mobile app via sumora://oauth/callback
   */
  async handleYouTubeCallback(req, res, next) {
    try {
      const { code, state, error: oauthError } = req.query;

      // ── OAuth error from Google (user denied, etc.) ──────────────────
      if (oauthError) {
        const errorUrl = `sumora://oauth/callback?success=false&error=${encodeURIComponent(oauthError)}`;
        return res.redirect(errorUrl);
      }

      if (!code) {
        const errorUrl = `sumora://oauth/callback?success=false&error=missing_code`;
        return res.redirect(errorUrl);
      }

      // ── Resolve userId from JWT (authenticated endpoint) or state ────
      let userId = req.user?.id;
      if (!userId && state) {
        try {
          const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
          userId = decodedState.userId;
        } catch (err) {
          const errorUrl = `sumora://oauth/callback?success=false&error=invalid_state`;
          return res.redirect(errorUrl);
        }
      }

      if (!userId) {
        const errorUrl = `sumora://oauth/callback?success=false&error=unauthenticated`;
        return res.redirect(errorUrl);
      }

      // ── Run full token exchange + subscription sync ───────────────────
      await integrationsService.handleYouTubeCallback(userId, code);

      // ── Deep-link back to the mobile app on success ───────────────────
      return res.redirect(`sumora://oauth/callback?success=true`);
    } catch (error) {
      console.error('[IntegrationsController] YouTube callback error:', error.message);
      const errorUrl = `sumora://oauth/callback?success=false&error=${encodeURIComponent(error.message)}`;
      return res.redirect(errorUrl);
    }
  }

  async syncYouTube(req, res, next) {
    try {
      const result = await integrationsService.syncYouTubeSubscriptions(req.user.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async disconnect(req, res, next) {
    try {
      const { id } = req.params;
      const result = await integrationsService.disconnectAccount(req.user.id, id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new IntegrationsController();
