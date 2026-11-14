const prisma = require('../config/db');
const webSubService = require('../modules/integrations/youtube/websub.service');
const youTubeService = require('../modules/integrations/youtube/youtube.service');
const integrationsService = require('../modules/integrations/integrations.service');
const inlinePipeline = require('../modules/pipeline/inline-pipeline.service');

class SchedulerService {
  constructor() {
    this.timer = null;
    this.isRunning = false;
    // Default interval: 6 hours (21,600,000 ms)
    this.intervalMs = parseInt(process.env.FEED_SYNC_INTERVAL_MS, 10) || 6 * 60 * 60 * 1000;
  }

  /**
   * Starts the recurring background feed sync schedule.
   */
  start() {
    console.log(`[Scheduler] Daily background feed sync initialized (Interval: ${this.intervalMs / (60 * 60 * 1000)}h).`);
    
    // Run an initial sync check shortly after startup (after 15 seconds) so it doesn't block boot
    setTimeout(() => {
      this.runSync('startup').catch((err) => {
        console.warn('[Scheduler] Startup sync note:', err.message);
      });
    }, 15000);

    // Schedule regular periodic runs
    this.timer = setInterval(() => {
      this.runSync('periodic').catch((err) => {
        console.warn('[Scheduler] Scheduled sync error:', err.message);
      });
    }, this.intervalMs);
  }

  /**
   * Stops the recurring schedule.
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[Scheduler] Background feed sync stopped.');
    }
  }

  /**
   * Executes a full feed sync pass across all tracked YouTube channels.
   * Processes channels in small batches to respect network limits.
   * @param {string} triggerSource
   */
  async runSync(triggerSource = 'manual') {
    if (this.isRunning) {
      console.log(`[Scheduler] Sync already in progress, skipping trigger (${triggerSource}).`);
      return { skipped: true };
    }

    this.isRunning = true;
    console.log(`[Scheduler] Starting background feed sync pass (${triggerSource})...`);

    try {
      // Find all unique YouTube channel IDs tracked across all users
      const tracked = await prisma.trackedSource.findMany({
        where: { platform: 'youtube' },
        select: { sourceId: true, userId: true },
      });

      const channelIds = Array.from(new Set(tracked.map((t) => t.sourceId)));
      if (channelIds.length === 0) {
        console.log('[Scheduler] No tracked YouTube channels found to sync.');
        return { channelsChecked: 0, newVideos: 0 };
      }

      // Check if any user has an active OAuth access token we can use
      const activeAccount = await prisma.connectedAccount.findFirst({
        where: { platform: 'youtube', status: 'active' },
        select: { userId: true },
      });
      const accessToken = activeAccount ? await integrationsService.getValidAccessToken(activeAccount.userId) : null;

      console.log(`[Scheduler] Checking YouTube feeds for ${channelIds.length} tracked channels (OAuth: ${accessToken ? 'Active' : 'RSS'})...`);

      let totalUpserted = 0;
      const batchSize = 5;

      const processChannel = async (channelId) => {
        if (accessToken) {
          const uploads = await youTubeService.getChannelUploads(channelId, accessToken, 3);
          if (uploads.length > 0) {
            for (const upload of uploads) {
              const existing = await prisma.video.findUnique({
                where: { videoId: upload.videoId },
                select: { id: true, summaryStatus: true },
              });

              await prisma.video.upsert({
                where: { videoId: upload.videoId },
                create: {
                  videoId: upload.videoId,
                  channelId: upload.channelId,
                  title: upload.title,
                  videoUrl: upload.videoUrl,
                  thumbnailUrl: upload.thumbnailUrl,
                  publishedAt: new Date(upload.publishedAt),
                  transcriptStatus: 'pending',
                  summaryStatus: 'pending',
                },
                update: {
                  title: upload.title,
                  thumbnailUrl: upload.thumbnailUrl,
                },
              });

              if (!existing) {
                totalUpserted++;
                inlinePipeline.fireAndForget({
                  videoId: upload.videoId,
                  channelId: upload.channelId,
                  title: upload.title,
                  videoUrl: upload.videoUrl,
                });
              }
            }
            return { upserted: uploads.length };
          }
        }

        // Fallback: WebSub RSS feed parser
        return webSubService.backfillChannelFeed(channelId, { triggerPipeline: true });
      };

      // Process in batches of 5 to avoid overwhelming network
      for (let i = 0; i < channelIds.length; i += batchSize) {
        const batch = channelIds.slice(i, i + batchSize);
        const results = await Promise.allSettled(batch.map((channelId) => processChannel(channelId)));

        for (const res of results) {
          if (res.status === 'fulfilled' && res.value?.upserted) {
            totalUpserted += res.value.upserted;
          }
        }
      }

      console.log(
        `[Scheduler] ✅ Feed sync completed: checked ${channelIds.length} channels, processed ${totalUpserted} videos.`
      );

      return {
        channelsChecked: channelIds.length,
        newVideos: totalUpserted,
      };
    } catch (err) {
      console.error('[Scheduler] Error during feed sync pass:', err.message);
      throw err;
    } finally {
      this.isRunning = false;
    }
  }
}

module.exports = new SchedulerService();
