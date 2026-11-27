const prisma = require('../../config/db');
const cache = require('../../utils/cache.util');

const PREFS_CACHE_TTL_SEC = 300;

class PreferencesService {
  /**
   * Retrieves notification preferences for a user.
   * @param {string} userId
   */
  async getPreferences(userId) {
    const cacheKey = `cache:prefs:${userId}`;
    const cached = await cache.getJson(cacheKey);
    if (cached) return cached;

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
      const result = [defaultPref];
      await cache.setJson(cacheKey, result, PREFS_CACHE_TTL_SEC);
      return result;
    }

    await cache.setJson(cacheKey, preferences, PREFS_CACHE_TTL_SEC);
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

    const updated = await prisma.notificationPreference.upsert({
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
    await cache.del(`cache:prefs:${userId}`);
    return updated;
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

  /**
   * Dispatches an immediate test push notification to the user's registered devices.
   * Useful for verifying real device token delivery and Firebase/APNs setup.
   * @param {string} userId
   */
  async sendTestNotification(userId) {
    const fcmService = require('./fcm.service');
    const devices = await prisma.deviceToken.findMany({
      where: { userId },
      select: { deviceToken: true },
    });

    if (devices.length === 0) {
      return {
        success: false,
        message: 'No device tokens registered for this user in the database.',
        deviceCount: 0,
      };
    }

    const payload = fcmService.buildNotificationPayload({
      channelName: 'Sumora Test Alert',
      videoTitle: 'Your production push notification system is active and verified!',
      videoId: 'test_production_verification',
      isReady: true,
    });

    const tokens = devices.map((d) => d.deviceToken);
    const result = await fcmService.sendToDevices(tokens, payload);
    return {
      success: true,
      message: `Dispatched test notification to ${tokens.length} device(s).`,
      deviceCount: tokens.length,
      ...result,
    };
  }
}

module.exports = new PreferencesService();

