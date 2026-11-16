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
    // Track WebSub lease renewals (5 days threshold before 10-day expiration)
    this.webSubRenewals = new Map();
    this.RENEWAL_THRESHOLD_MS = 5 * 24 * 60 * 60 * 1000;
  }

  /**
   * Automatically renews WebSub hub subscriptions for tracked YouTube channels
   * every 5 days, well before Google's 10-day lease expires.
   * @param {string[]} channelIds
   */
  async renewWebSubSubscriptions(channelIds) {
    const now = Date.now();
    let renewedCount = 0;

    for (const channelId of channelIds) {
      const lastRenewed = this.webSubRenewals.get(channelId) || 0;
      if (now - lastRenewed >= this.RENEWAL_THRESHOLD_MS) {
        try {
          const success = await webSubService.subscribeToChannel(channelId);
          if (success) {
            this.webSubRenewals.set(channelId, now);
            renewedCount++;
          }
        } catch (err) {
          console.warn(`[Scheduler] WebSub lease renewal warning for channel ${channelId}:`, err.message);
        }
      }
    }

    if (renewedCount > 0) {
      console.log(`[Scheduler] 🔄 Renewed WebSub subscriptions for ${renewedCount} YouTube channels (10-day lease refreshed).`);
    }
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
                // On-Demand Architecture: Historical/backlog videos are indexed in DB at $0 cost.
                // AI summarization is generated lazily only when a user taps "Read Summary".
              }
            }
            return { upserted: uploads.length };
          }
        }

        // Fallback: WebSub RSS feed parser (indexes videos without triggering expensive AI batch summarization)
        return webSubService.backfillChannelFeed(channelId, { triggerPipeline: false });
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

      // Automatically renew WebSub leases for all tracked channels
      await this.renewWebSubSubscriptions(channelIds);

      // Also sync active Reddit subreddits
      try {
        const redditService = require('../modules/integrations/reddit/reddit.service');
        const activeSubreddits = await prisma.trackedSource.findMany({
          where: { platform: 'reddit', isActive: true },
          distinct: ['sourceId'],
        });
        for (const sub of activeSubreddits) {
          await redditService.syncSubredditPosts(sub.sourceId, 5).catch(() => {});
        }
      } catch (redditErr) {
        console.warn('[Scheduler] Reddit sync note:', redditErr.message);
      }

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
