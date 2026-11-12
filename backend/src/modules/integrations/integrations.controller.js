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

  async handleYouTubeCallback(req, res, next) {
    try {
      const { code, state, error: oauthError } = req.query;

      if (oauthError) {
        return res.status(400).json({
          error: 'OAuthError',
          message: `Google OAuth error: ${oauthError}`,
        });
      }

      if (!code) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Authorization code is required',
        });
      }

      let userId = req.user?.id;
      if (!userId && state) {
        try {
          const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
          userId = decodedState.userId;
        } catch (err) {
          return res.status(400).json({
            error: 'InvalidState',
            message: 'Invalid state parameter in OAuth callback',
          });
        }
      }

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Unable to identify user session from OAuth callback',
        });
      }

      const result = await integrationsService.handleYouTubeCallback(userId, code);

      res.status(200).json({
        success: true,
        message: 'YouTube connected and channels synced successfully',
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

