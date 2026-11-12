const prisma = require('../../config/db');

class PreferencesService {
  /**
   * Retrieves notification preferences for a user.
   * @param {string} userId
   */
  async getPreferences(userId) {
    const preferences = await prisma.notificationPreference.findMany({
      where: { userId },
    });

    if (preferences.length === 0) {
      const defaultPref = await prisma.notificationPreference.create({
        data: {
          userId,
          platform: 'youtube',
          enabled: true,
        },
      });
      return [defaultPref];
    }

    return preferences;
  }

  /**
   * Updates or toggles a user's notification preference for a platform.
   * @param {string} userId
   * @param {object} params
   * @param {string} params.platform - e.g. "youtube"
   * @param {boolean} params.enabled
   */
  async updatePreference(userId, { platform = 'youtube', enabled }) {
    if (typeof enabled !== 'boolean') {
      const error = new Error('"enabled" boolean field is required');
      error.status = 400;
      throw error;
    }

    return prisma.notificationPreference.upsert({
      where: {
        userId_platform: {
          userId,
          platform,
        },
      },
      create: {
        userId,
        platform,
        enabled,
      },
      update: {
        enabled,
      },
    });
  }

  /**
   * Registers a mobile device token for push notifications.
   * @param {string} userId
   * @param {object} params
   * @param {string} params.deviceToken
   * @param {string} [params.platform="android"]
   */
  async registerDeviceToken(userId, { deviceToken, platform = 'android' }) {
    if (!deviceToken || typeof deviceToken !== 'string') {
      const error = new Error('Valid "deviceToken" string is required');
      error.status = 400;
      throw error;
    }

    const normalizedPlatform = ['ios', 'android'].includes(platform.toLowerCase())
      ? platform.toLowerCase()
      : 'android';

    return prisma.deviceToken.upsert({
      where: {
        userId_deviceToken: {
          userId,
          deviceToken,
        },
      },
      create: {
        userId,
        deviceToken,
        platform: normalizedPlatform,
      },
      update: {
        platform: normalizedPlatform,
      },
    });
  }

  /**
   * Unregisters a device token (e.g. upon user logout).
   * @param {string} userId
   * @param {string} deviceToken
   */
  async unregisterDeviceToken(userId, deviceToken) {
    return prisma.deviceToken.deleteMany({
      where: {
        userId,
        deviceToken,
      },
    });
  }
}

module.exports = new PreferencesService();

