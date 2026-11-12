const fs = require('fs');
const admin = require('firebase-admin');
const config = require('../../config');

class FCMService {
  constructor() {
    this.isInitialized = false;
    this.initFirebase();
  }

  initFirebase() {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.isInitialized = true;
        console.log('[FCMService] Firebase Admin SDK initialized successfully');
      } catch (err) {
        console.warn('[FCMService] Failed to initialize Firebase with service account:', err.message);
      }
    } else {
      console.log(
        '[FCMService] Running in Development Mode (No Firebase Service Account provided). Push notifications will be logged to console.'
      );
    }
  }

  /**
   * Builds the standardized push notification payload.
   * Notice: As per Project Spec Section 13, push notifications are short,
   * do not include the full summary, and contain data.videoId so mobile opens the detail screen.
   * @param {object} params
   * @param {string} params.channelName
   * @param {string} params.videoTitle
   * @param {string} params.videoId
   * @param {boolean} [params.isReady=true]
   */
  buildNotificationPayload({ channelName, videoTitle, videoId, isReady = true }) {
    const title = isReady
      ? `New video from ${channelName}. Your AI summary is ready!`
      : `New video from ${channelName}. We're preparing your summary.`;

    const body = `"${videoTitle.slice(0, 70)}" - Tap to read your distilled insights.`;

    return {
      notification: {
        title,
        body,
      },
      data: {
        videoId: String(videoId),
        channelName: String(channelName),
        type: isReady ? 'summary_ready' : 'summary_processing',
        click_action: 'OPEN_SUMMARY_DETAIL',
      },
    };
  }

  /**
   * Dispatches push notifications to a list of device tokens.
   * @param {string[]} deviceTokens
   * @param {object} payload - Output from buildNotificationPayload
   * @returns {Promise<{successCount: number, failureCount: number}>}
   */
  async sendToDevices(deviceTokens, payload) {
    if (!Array.isArray(deviceTokens) || deviceTokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    if (!this.isInitialized) {
      console.log(
        `[FCMService] [MOCK SEND] Dispatched push alert to ${deviceTokens.length} devices:\n  Title: "${payload.notification.title}"\n  Body: "${payload.notification.body}"\n  Target Video ID: "${payload.data.videoId}"`
      );
      return {
        successCount: deviceTokens.length,
        failureCount: 0,
        mock: true,
      };
    }

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: deviceTokens,
        notification: payload.notification,
        data: payload.data,
      });

      console.log(
        `[FCMService] Sent multicast notification: ${response.successCount} succeeded, ${response.failureCount} failed`
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error('[FCMService] Multicast send error:', error.message);
      return {
        successCount: 0,
        failureCount: deviceTokens.length,
        error: error.message,
      };
    }
  }
}

module.exports = new FCMService();

