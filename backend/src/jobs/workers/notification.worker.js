const { Worker } = require('bullmq');
const { connection, QUEUE_NAMES } = require('../index');
const prisma = require('../../config/db');
const fcmService = require('../../modules/notifications/fcm.service');

/**
 * Creates and starts the BullMQ Worker for dispatching summary push notifications.
 */
function createNotificationWorker() {
  const worker = new Worker(
    QUEUE_NAMES.PUSH_NOTIFICATIONS,
    async (job) => {
      const { videoId, channelId, title } = job.data;
      console.log(`[NotificationWorker] Processing notifications for video ${videoId} (channel ${channelId})`);

      try {
        // 1. Find all users tracking this channel
        const trackedSources = await prisma.trackedSource.findMany({
          where: {
            platform: 'youtube',
            sourceId: channelId,
          },
          select: {
            userId: true,
            sourceName: true,
          },
        });

        if (trackedSources.length === 0) {
          console.log(`[NotificationWorker] No users currently tracking channel ${channelId}`);
          return { dispatched: 0 };
        }

        const channelName = trackedSources[0].sourceName || 'Channel';
        const userIds = trackedSources.map((s) => s.userId);

        // 2. Check which users have YouTube notifications enabled
        const preferences = await prisma.notificationPreference.findMany({
          where: {
            userId: { in: userIds },
            platform: 'youtube',
            enabled: true,
          },
          select: { userId: true },
        });

        const eligibleUserIds = preferences.map((p) => p.userId);
        if (eligibleUserIds.length === 0) {
          console.log(`[NotificationWorker] All tracking users have notifications disabled for channel ${channelId}`);
          return { dispatched: 0 };
        }

        // 3. Find registered mobile device tokens for eligible users
        const deviceRecords = await prisma.deviceToken.findMany({
          where: {
            userId: { in: eligibleUserIds },
          },
          select: {
            deviceToken: true,
          },
        });

        const tokens = deviceRecords.map((d) => d.deviceToken);

        // 4. Build FCM payload according to Section 13 requirements
        const payload = fcmService.buildNotificationPayload({
          channelName,
          videoTitle: title,
          videoId,
          isReady: true,
        });

        // 5. Send push notifications
        const sendResult = await fcmService.sendToDevices(tokens, payload);

        console.log(
          `[NotificationWorker] Notification results for video "${videoId}": ${sendResult.successCount} sent to devices across ${eligibleUserIds.length} eligible users`
        );

        return {
          videoId,
          channelId,
          eligibleUsersCount: eligibleUserIds.length,
          tokensCount: tokens.length,
          sendResult,
        };
      } catch (error) {
        console.error(`[NotificationWorker] Failed to process notifications for video ${videoId}:`, error.message);
        throw error;
      }
    },
    {
      connection,
      concurrency: 5,
    }
  );

  return worker;
}

module.exports = {
  createNotificationWorker,
};
