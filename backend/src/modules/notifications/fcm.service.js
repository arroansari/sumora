const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const config = require('../../config');
const prisma = require('../../config/db');

class FCMService {
  constructor() {
    this.isInitialized = false;
    this.initFirebase();
  }

  initFirebase() {
    let serviceAccount = null;

    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decoded);
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        const candidatePaths = [
          process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
          path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH),
          path.resolve(__dirname, '../../../..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH),
          path.resolve(__dirname, '../../..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH),
        ];
        const validPath = candidatePaths.find((p) => fs.existsSync(p));
        if (validPath) {
          serviceAccount = JSON.parse(fs.readFileSync(validPath, 'utf8'));
        }
      }
    } catch (parseErr) {
      console.error('[FCMService] Failed to parse Firebase Service Account credentials:', parseErr.message);
    }

    if (serviceAccount) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.isInitialized = true;
        console.log('[FCMService] Firebase Admin SDK initialized successfully');
      } catch (err) {
        console.warn('[FCMService] Failed to initialize Firebase with service account:', err.message);
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        console.error(
          '[FCMService] CRITICAL WARNING: No Firebase Service Account configured in production. FCM Push notifications will NOT be delivered!'
        );
      } else {
        console.log(
          '[FCMService] Running in Development Mode (No Firebase Service Account provided). Push notifications will be logged to console.'
        );
      }
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
        apns: {
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'alert',
          },
          payload: {
            aps: {
              alert: {
                title,
                body,
              },
              sound: 'default',
              badge: 1,
              contentAvailable: true,
            },
          },
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'sumora_summaries',
            priority: 'high',
          },
        },
      };
    }

    /**
     * Builds standardized push notification payload for Cinema & OTT streaming releases.
     * @param {object} params
     * @param {string} params.title
     * @param {string} [params.streamingPlatform='Streaming']
     * @param {string} params.externalId
     * @param {string} [params.takeaway='']
     */
    buildCinemaNotificationPayload({ title, streamingPlatform = 'Streaming', externalId, takeaway = '' }) {
      const notifTitle = `🎬 Streaming Alert: ${title}`;
      const notifBody = takeaway
        ? `${takeaway.slice(0, 75)} - Watch on ${streamingPlatform}.`
        : `Available now on ${streamingPlatform}. Tap to see spoiler-free review.`;

      return {
        notification: {
          title: notifTitle,
          body: notifBody,
        },
        data: {
          postId: String(externalId),
          videoId: String(externalId),
          platform: 'cinema',
          type: 'cinema_alert',
          click_action: 'OPEN_CINEMA_DETAIL',
        },
        apns: {
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'alert',
          },
          payload: {
            aps: {
              alert: {
                title: notifTitle,
                body: notifBody,
              },
              sound: 'default',
              badge: 1,
              contentAvailable: true,
            },
          },
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'sumora_summaries',
            priority: 'high',
          },
        },
      };
    }

    /**
     * Builds standardized push notification payload for Non-Fiction Book Insights.
     * @param {object} params
     * @param {string} params.title
     * @param {string} [params.author='Bestselling Author']
     * @param {string} params.externalId
     * @param {string} [params.thesis='']
     */
    buildBookNotificationPayload({ title, author = 'Bestselling Author', externalId, thesis = '' }) {
      const notifTitle = `📚 Daily Book Insight: ${title}`;
      const notifBody = thesis
        ? `by ${author}. ${thesis.slice(0, 70)} - Tap to read mental models.`
        : `Key mental models distilled from ${title} by ${author}.`;

      return {
        notification: {
          title: notifTitle,
          body: notifBody,
        },
        data: {
          postId: String(externalId),
          videoId: String(externalId),
          platform: 'books',
          type: 'book_insight',
          click_action: 'OPEN_BOOK_DETAIL',
        },
        apns: {
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'alert',
          },
          payload: {
            aps: {
              alert: {
                title: notifTitle,
                body: notifBody,
              },
              sound: 'default',
              badge: 1,
              contentAvailable: true,
            },
          },
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'sumora_summaries',
            priority: 'high',
          },
        },
      };
    }

  /**
   * Dispatches push notifications to a list of device tokens.
   * Dispatches push notifications to a list of device tokens, automatically pruning
   * invalid, unregistered, or expired device tokens from PostgreSQL.
   * @param {string[]} deviceTokens
   * @param {object} payload - Output from buildNotificationPayload
   * @returns {Promise<{successCount: number, failureCount: number}>}
   * @returns {Promise<{successCount: number, failureCount: number, prunedCount?: number}>}
   */
  async sendToDevices(deviceTokens, payload) {
      if (!Array.isArray(deviceTokens) || deviceTokens.length === 0) {
        return { successCount: 0, failureCount: 0 };
      }

      if (!this.isInitialized) {
        if (process.env.NODE_ENV === 'production') {
          console.error('[FCMService] Cannot send push notifications: Firebase Admin SDK is not initialized in production.');
          return {
            successCount: 0,
            failureCount: deviceTokens.length,
            error: 'Firebase Admin SDK not initialized in production',
          };
        }

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

        // Automatically prune invalid, unregistered, or mismatched device tokens
        const invalidTokens = [];
        if (response.responses && Array.isArray(response.responses)) {
          response.responses.forEach((resp, index) => {
            if (!resp.success && resp.error) {
              const code = resp.error.code;
              if (
                code === 'messaging/invalid-registration-token' ||
                code === 'messaging/registration-token-not-registered' ||
                code === 'messaging/mismatched-credential'
              ) {
                invalidTokens.push(deviceTokens[index]);
              }
            }
          });
        }

        if (invalidTokens.length > 0) {
          try {
            const deleteResult = await prisma.deviceToken.deleteMany({
              where: { deviceToken: { in: invalidTokens } },
            });
            console.log(`[FCMService] Pruned ${deleteResult.count} unregistered/invalid FCM device tokens.`);
          } catch (pruneErr) {
            console.warn('[FCMService] Error pruning invalid tokens from database:', pruneErr.message);
          }
        }

        return {
          successCount: response.successCount,
          failureCount: response.failureCount,
          prunedCount: invalidTokens.length,
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

