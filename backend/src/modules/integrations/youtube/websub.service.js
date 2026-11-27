const crypto = require('crypto');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const config = require('../../../config');
const prisma = require('../../../config/db');
const { getQueue, QUEUE_NAMES } = require('../../../jobs');
const inlinePipeline = require('../../pipeline/inline-pipeline.service');
const { batchUpsertVideos } = require('../../../utils/videoBatch.util');

const WEBSUB_HUB_URL = 'https://pubsubhubbub.appspot.com/subscribe';
const YOUTUBE_FEED_TOPIC_BASE = 'https://www.youtube.com/xml/feeds/videos.xml?channel_id=';

class WebSubService {
  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
  }

  /**
   * Generates the YouTube feed topic URL for a given channel ID.
   * @param {string} channelId
   * @returns {string}
   */
  getTopicUrl(channelId) {
    return `${YOUTUBE_FEED_TOPIC_BASE}${channelId}`;
  }

  /**
   * Subscribes to new video upload notifications for a given YouTube channel via WebSub.
   * @param {string} channelId
   * @returns {Promise<boolean>}
   */
  async subscribeToChannel(channelId) {
    const topicUrl = this.getTopicUrl(channelId);
    const callbackUrl = config.websub.callbackUrl;
    const secret = config.websub.secret;

    try {
      const params = new URLSearchParams({
        'hub.callback': callbackUrl,
        'hub.mode': 'subscribe',
        'hub.topic': topicUrl,
        'hub.secret': secret,
        'hub.lease_seconds': '864000', // 10 days
      });

      const response = await axios.post(WEBSUB_HUB_URL, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      return response.status === 202 || response.status === 200;
    } catch (error) {
      console.warn(`[WebSub] Failed to subscribe to channel ${channelId}:`, error.message);
      return false;
    }
  }

  /**
   * Unsubscribes from video upload notifications for a given channel.
   * @param {string} channelId
   * @returns {Promise<boolean>}
   */
  async unsubscribeFromChannel(channelId) {
    const topicUrl = this.getTopicUrl(channelId);
    const callbackUrl = config.websub.callbackUrl;

    try {
      const params = new URLSearchParams({
        'hub.callback': callbackUrl,
        'hub.mode': 'unsubscribe',
        'hub.topic': topicUrl,
      });

      const response = await axios.post(WEBSUB_HUB_URL, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      return response.status === 202 || response.status === 200;
    } catch (error) {
      console.warn(`[WebSub] Failed to unsubscribe from channel ${channelId}:`, error.message);
      return false;
    }
  }

  /**
   * Verifies the HMAC-SHA1 signature from Google Hub (X-Hub-Signature header).
   * @param {string} rawBody - Raw unparsed XML string
   * @param {string} signatureHeader - Value of X-Hub-Signature header (e.g. 'sha1=xxxx')
   * @returns {boolean}
   */
  verifySignature(rawBody, signatureHeader) {
    if (!config.websub.secret) {
      return true;
    }
    if (!signatureHeader || !signatureHeader.startsWith('sha1=')) {
      return false;
    }

    const providedSignature = signatureHeader.substring(5);
    const expectedSignature = crypto
      .createHmac('sha1', config.websub.secret)
      .update(rawBody, 'utf8')
      .digest('hex');

    try {
      const providedBuf = Buffer.from(providedSignature, 'hex');
      const expectedBuf = Buffer.from(expectedSignature, 'hex');
      if (providedBuf.length !== expectedBuf.length) {
        return false;
      }
      return crypto.timingSafeEqual(providedBuf, expectedBuf);
    } catch (err) {
      return false;
    }
  }

  /**
   * Parses the WebSub Atom XML notification payload.
   * @param {string} xmlString
   * @returns {Array<{videoId: string, channelId: string, title: string, videoUrl: string, publishedAt: string, channelName?: string}>}
   */
  parseAtomFeed(xmlString) {
    const parsed = this.xmlParser.parse(xmlString);
    if (!parsed || !parsed.feed) {
      return [];
    }

    const feed = parsed.feed;
    const entries = [];

    if (feed.entry) {
      const rawEntries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];
      for (const entry of rawEntries) {
        const videoId = entry['yt:videoId'] || (entry.id ? entry.id.replace('yt:video:', '') : null);
        const channelId = entry['yt:channelId'];
        const title = entry.title || 'Untitled Video';
        const publishedAt = entry.published || entry.updated || new Date().toISOString();
        let videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        if (entry.link && entry.link['@_href']) {
          videoUrl = entry.link['@_href'];
        }

        if (videoId && channelId) {
          entries.push({
            videoId: String(videoId),
            channelId: String(channelId),
            title: String(title),
            videoUrl: String(videoUrl),
            publishedAt: new Date(publishedAt).toISOString(),
            channelName: entry.author?.name ? String(entry.author.name) : undefined,
          });
        }
      }
    }

    return entries;
  }

  /**
   * Handles incoming WebSub video upload notifications:
   * 1. Validates signature
   * 2. Extracts video details
   * 3. Upserts Video in database (prevents duplicate videos across users)
   * 4. Enqueues background job for transcript retrieval
   * @param {string} rawXmlBody
   * @param {string} signatureHeader
   * @returns {Promise<{processed: number, entries: Array}>}
   */
  async handleNotification(rawXmlBody, signatureHeader) {
    // Verify HMAC signature: require in production, and enforce whenever header or secret is provided
    if (config.websub.secret) {
      if (!signatureHeader && process.env.NODE_ENV === 'production') {
        const error = new Error('Missing required WebSub HMAC signature');
        error.status = 401;
        throw error;
      }
      if (signatureHeader && !this.verifySignature(rawXmlBody, signatureHeader)) {
        const error = new Error('Invalid WebSub HMAC signature');
        error.status = 403;
        throw error;
      }
    }

    const entries = this.parseAtomFeed(rawXmlBody);
    // Attempt to get BullMQ queue (requires Redis). If Redis unavailable, fall through to inline pipeline.
    let queue = null;
    try {
      queue = getQueue(QUEUE_NAMES.TRANSCRIPT_INGESTION);
    } catch (err) {
      console.warn('[WebSub] BullMQ unavailable, using inline pipeline:', err.message);
    }

    for (const entry of entries) {
      // Smart Ingestion Guard: Only trigger expensive AI summarization if at least one user actively tracks this channel
      const activeTrackingCount = await prisma.trackedSource.count({
        where: {
          platform: { in: ['youtube', 'YOUTUBE'] },
          sourceId: entry.channelId,
          isActive: true,
        },
      });

      // Upsert Video in PostgreSQL (idempotent; 1 record per YouTube video)
      const video = await prisma.video.upsert({
        where: { videoId: entry.videoId },
        create: {
          videoId: entry.videoId,
          channelId: entry.channelId,
          title: entry.title,
          videoUrl: entry.videoUrl,
          thumbnailUrl: `https://i.ytimg.com/vi/${entry.videoId}/hqdefault.jpg`,
          publishedAt: new Date(entry.publishedAt),
          transcriptStatus: activeTrackingCount > 0 ? 'pending' : 'skipped',
          summaryStatus: activeTrackingCount > 0 ? 'pending' : 'skipped',
        },
        update: {
          title: entry.title,
          videoUrl: entry.videoUrl,
          thumbnailUrl: `https://i.ytimg.com/vi/${entry.videoId}/hqdefault.jpg`,
        },
      });

      if (activeTrackingCount === 0) {
        console.log(`[WebSub] Skipping AI summarization for ${entry.videoId} - Channel ${entry.channelId} has 0 active tracking users.`);
        continue;
      }

      // Popular-channel pre-warming: when many users track the same creator and
      // PREWARM_MIN_SUBSCRIBERS > 0, pre-compute the summary once for all subscribers.
      const prewarmThreshold = config.ai?.prewarmMinSubscribers || 0;
      if (prewarmThreshold > 0 && activeTrackingCount >= prewarmThreshold && video.summaryStatus !== 'completed') {
        const jobPayload = {
          videoId: entry.videoId,
          channelId: entry.channelId,
          title: entry.title,
          videoUrl: entry.videoUrl,
        };
        if (queue) {
          try {
            await queue.add('fetch-transcript', jobPayload, {
              jobId: `transcript-${entry.videoId}`,
            });
            console.log(
              `[WebSub] Pre-warming summary for popular channel ${entry.channelId} (${activeTrackingCount} trackers) -> ${entry.videoId}`
            );
            continue;
          } catch (qErr) {
            console.warn(`[WebSub] Pre-warm queue failed for ${entry.videoId}:`, qErr.message);
          }
        } else {
          inlinePipeline.fireAndForget(jobPayload);
          continue;
        }
      }

      // On-demand policy: Do not auto-fetch transcripts or summaries for feed items.
      // Video is indexed as 'pending' and only processed when the user explicitly taps to read.
      console.log(
        `[WebSub] Video ${entry.videoId} ("${entry.title}") indexed into feed as pending. Transcript & summary will be generated on user tap.`
      );
    }

    return {
      processed: entries.length,
      entries,
    };
  }
  /**
   * Fetches recent uploads for a single YouTube channel using the public RSS feed
   * (no API key required) and upserts them into the videos table.
   * YouTube's public feed returns up to the last 15 uploads.
   *
   * @param {string} channelId
   * @param {Object} [opts]
   * @param {boolean} [opts.triggerPipeline=false] - whether to fire transcript/summary pipeline
   * @returns {Promise<{upserted: number, entries: Array}>}
   */
  async backfillChannelFeed(channelId, { triggerPipeline = false } = {}) {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

    let xmlText;
    try {
      const response = await axios.get(feedUrl, { timeout: 10000 });
      xmlText = response.data;
    } catch (err) {
      console.warn(`[WebSub] Failed to fetch RSS feed for channel ${channelId}:`, err.message);
      return { upserted: 0, entries: [] };
    }

    const entries = this.parseAtomFeed(xmlText);
    if (!entries.length) return { upserted: 0, entries: [] };

    const items = entries.map((entry) => ({
      videoId: entry.videoId,
      channelId: entry.channelId,
      title: entry.title,
      videoUrl: entry.videoUrl,
      thumbnailUrl: `https://i.ytimg.com/vi/${entry.videoId}/hqdefault.jpg`,
      publishedAt: new Date(entry.publishedAt),
    }));

    const { totalProcessed: upserted } = await batchUpsertVideos(items);

    if (triggerPipeline) {
      const topEntries = entries.slice(0, 3);
      const topStatuses = await prisma.video.findMany({
        where: { videoId: { in: topEntries.map((e) => e.videoId) } },
        select: { videoId: true, summaryStatus: true },
      });
      const statusMap = new Map(topStatuses.map((s) => [s.videoId, s.summaryStatus]));
      for (const entry of topEntries) {
        if (statusMap.get(entry.videoId) !== 'completed') {
          inlinePipeline.fireAndForget({
            videoId: entry.videoId,
            channelId: entry.channelId,
            title: entry.title,
            videoUrl: entry.videoUrl,
          });
        }
      }
    }

    console.log(`[WebSub] Backfill: upserted ${upserted} videos for channel ${channelId}`);
    return { upserted, entries };
  }
}

module.exports = new WebSubService();

