const preferencesService = require('./preferences.service');

class PreferencesController {
  async getPreferences(req, res, next) {
    try {
      const preferences = await preferencesService.getPreferences(req.user.id);
      res.status(200).json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePreference(req, res, next) {
    try {
      const { platform, enabled } = req.body;
      const updated = await preferencesService.updatePreference(req.user.id, {
        platform,
        enabled,
      });
      res.status(200).json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async registerDevice(req, res, next) {
    try {
      const { deviceToken, platform } = req.body;
      const device = await preferencesService.registerDeviceToken(req.user.id, {
        deviceToken,
        platform,
      });
      res.status(201).json({
        success: true,
        message: 'Device token registered successfully',
        data: device,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PreferencesController();

