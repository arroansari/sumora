const crypto = require('crypto');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const config = require('../../../config');
const prisma = require('../../../config/db');
const { getQueue, QUEUE_NAMES } = require('../../../jobs');

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
    // Verify signature if provided
    if (signatureHeader && !this.verifySignature(rawXmlBody, signatureHeader)) {
      const error = new Error('Invalid WebSub HMAC signature');
      error.status = 403;
      throw error;
    }

    const entries = this.parseAtomFeed(rawXmlBody);
    const queue = getQueue(QUEUE_NAMES.TRANSCRIPT_INGESTION);

    for (const entry of entries) {
      // Upsert Video in PostgreSQL (idempotent; 1 record per YouTube video)
      const video = await prisma.video.upsert({
        where: { videoId: entry.videoId },
        create: {
          videoId: entry.videoId,
          channelId: entry.channelId,
          title: entry.title,
          videoUrl: entry.videoUrl,
          publishedAt: new Date(entry.publishedAt),
          transcriptStatus: 'pending',
          summaryStatus: 'pending',
        },
        update: {
          title: entry.title,
          videoUrl: entry.videoUrl,
        },
      });

      // Enqueue job for asynchronous processing without blocking WebSub response
      if (queue) {
        await queue.add(
          'fetch-transcript',
          {
            videoId: entry.videoId,
            channelId: entry.channelId,
            title: entry.title,
            videoUrl: entry.videoUrl,
          },
          {
            jobId: `transcript-${entry.videoId}`, // Deduplicate BullMQ jobs
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000,
            },
            removeOnComplete: true,
          }
        );
      }
    }

    return {
      processed: entries.length,
      entries,
    };
  }
}

module.exports = new WebSubService();

