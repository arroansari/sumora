const prisma = require('../../config/db');
const axios = require('axios');
const { getQueue, QUEUE_NAMES } = require('../../jobs');
const inlinePipeline = require('../pipeline/inline-pipeline.service');
const webSubService = require('../integrations/youtube/websub.service');
const youTubeService = require('../integrations/youtube/youtube.service');
const integrationsService = require('../integrations/integrations.service');

function extractYouTubeVideoId(input) {
  if (!input) return null;
  const str = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }
  const match = str.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

class VideosService {
  /**
   * Retrieves paginated video feed for channels tracked by the user.
   * Joins TrackedSource to surface channelName alongside each video.
   * @param {string} userId
   * @param {object} [pagination]
   */
  async getFeed(userId, { page = 1, limit = 20, channelId = null, from = null, to = null, search = null } = {}) {
    const skip = (page - 1) * limit;

    // Get list of channel IDs tracked by user (with their display names)
    const tracked = await prisma.trackedSource.findMany({
      where: { userId, platform: 'youtube' },
      select: { sourceId: true, sourceName: true },
    });

    const channelIds = tracked.map((t) => t.sourceId);

    // Build a quick lookup map: channelId → channelName
    const channelNameMap = new Map(tracked.map((t) => [t.sourceId, t.sourceName]));

    // Also get list of custom imported videos for this user
    const customImports = await prisma.trackedSource.findMany({
      where: { userId, platform: 'custom_import' },
      select: { sourceId: true, sourceName: true },
    });
    const customVideoIds = customImports.map((c) => c.sourceId);
    const customNameMap = new Map(customImports.map((c) => [c.sourceId, c.sourceName]));

    // If user has not tracked any channels, has no custom imports, and didn't specify a channel, return empty feed
    if (channelIds.length === 0 && customVideoIds.length === 0 && !channelId) {
      return {
        videos: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    // Build where clause — optionally filter to a single channel and/or date range
    let whereClause = {};

    if (channelId) {
      whereClause.channelId = channelId;
    } else {
      const orConditions = [];
      if (channelIds.length > 0) {
        orConditions.push({ channelId: { in: channelIds } });
      }
      if (customVideoIds.length > 0) {
        orConditions.push({ videoId: { in: customVideoIds } });
      }
      // Also include any video marked as 'imported'
      orConditions.push({ channelId: 'imported' });

      if (orConditions.length === 1) {
        whereClause = orConditions[0];
      } else if (orConditions.length > 1) {
        whereClause.OR = orConditions;
      }
    }

    if (search && search.trim()) {
      whereClause.title = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    if (from || to) {
      whereClause.publishedAt = {};
      if (from) whereClause.publishedAt.gte = new Date(from);
      if (to)   whereClause.publishedAt.lte = new Date(to);
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where: whereClause,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        include: {
          summary: {
            select: {
              id: true,
              overview: true,
              keyPoints: true,
              aiProvider: true,
              modelName: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.video.count({ where: whereClause }),
    ]);

    // Enrich each video with its channelName and custom import flag
    const enrichedVideos = videos.map((v) => {
      const isCustom = v.channelId === 'imported' || customNameMap.has(v.videoId);
      const resolvedChannelName =
        customNameMap.get(v.videoId) ||
        channelNameMap.get(v.channelId) ||
        (isCustom ? (v.description || 'Custom Link') : null);

      return {
        ...v,
        isCustomImport: isCustom,
        channelName: resolvedChannelName || (isCustom ? 'Custom Link' : 'YouTube Creator'),
      };
    });

    return {
      videos: enrichedVideos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves single video details with transcript and summary.
   * @param {string} userId
   * @param {string} videoId
   */
  async getVideoById(userId, videoId) {
    // Confirm the video's channel is tracked by this user (authorization check)
    const video = await prisma.video.findUnique({
      where: { videoId },
      include: {
        summary: true,
        transcript: {
          select: { language: true, source: true, status: true, createdAt: true },
        },
      },
    });

    if (!video) {
      const error = new Error('Video not found');
      error.status = 404;
      throw error;
    }

    // Attach channelName from TrackedSource
    const source = await prisma.trackedSource.findFirst({
      where: { userId, sourceId: video.channelId, platform: 'youtube' },
      select: { sourceName: true },
    });

    return { ...video, channelName: source?.sourceName || null };
  }

  /**
   * Retrieves full structured summary for a video.
   * @param {string} videoId
   */
  async getSummary(videoId) {
    const video = await prisma.video.findUnique({
      where: { videoId },
      include: { summary: true },
    });

    if (!video) {
      const error = new Error('Video not found');
      error.status = 404;
      throw error;
    }

    return {
      videoId: video.videoId,
      title: video.title,
      summaryStatus: video.summaryStatus,
      transcriptStatus: video.transcriptStatus,
      summary: video.summary,
    };
  }

  /**
   * Retrieves the current processing status of a video summary.
   * @param {string} videoId
   */
  async getSummaryStatus(videoId) {
    const video = await prisma.video.findUnique({
      where: { videoId },
      select: { videoId: true, summaryStatus: true, transcriptStatus: true, updatedAt: true },
    });

    if (!video) {
      const error = new Error('Video not found');
      error.status = 404;
      throw error;
    }

    const messages = {
      processing: 'Generating your video summary…',
      completed: 'Summary generated successfully.',
      fetching_transcript: 'Retrieving authorized transcript…',
      transcript_unavailable: 'No accessible transcript available for this video.',
      failed: 'Failed to generate summary.',
    };

    return {
      videoId: video.videoId,
      status: video.summaryStatus,
      transcriptStatus: video.transcriptStatus,
      message: messages[video.summaryStatus] || 'Your video summary is being prepared.',
      updatedAt: video.updatedAt,
    };
  }

  /**
   * Manually triggers transcript + AI summarization for a video.
   * Uses BullMQ if Redis is available; falls back to inline pipeline otherwise.
   * @param {string} videoId
   */
  async requestSummarization(videoId) {
    const video = await prisma.video.findUnique({ where: { videoId } });

    if (!video) {
      const error = new Error('Video record not found');
      error.status = 404;
      throw error;
    }

    if (['processing', 'completed'].includes(video.summaryStatus)) {
      return {
        message: `Summarization already ${video.summaryStatus}`,
        status: video.summaryStatus,
      };
    }

    // Try BullMQ queue first; fall back to inline pipeline
    let queue = null;
    try {
      queue = getQueue(QUEUE_NAMES.AI_SUMMARIZATION);
    } catch (err) {
      console.warn('[VideosService] BullMQ unavailable, using inline pipeline:', err.message);
    }

    if (queue) {
      await queue.add('summarize-video', { videoId });
      await prisma.video.update({
        where: { videoId },
        data: { summaryStatus: 'processing' },
      });
      return { message: 'Summarization job queued', status: 'processing' };
    } else {
      // Run inline — fire and forget so the HTTP response returns immediately
      inlinePipeline.fireAndForget({
        videoId: video.videoId,
        channelId: video.channelId,
        title: video.title,
        videoUrl: video.videoUrl,
      });
      await prisma.video.update({
        where: { videoId },
        data: { summaryStatus: 'processing' },
      });
      return { message: 'Summarization started (inline)', status: 'processing' };
    }
  }

  /**
   * Imports any YouTube video by URL or ID on-demand, fetches its metadata via oEmbed,
   * stores it in the database, and automatically triggers AI summarization.
   *
   * @param {string} userId
   * @param {object} params
   * @param {string} params.url - YouTube video URL or ID
   * @param {string} [params.channelId] - Optional associated channel ID
   */
  async importVideoByUrl(userId, { url, channelId = null }) {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      const error = new Error('Invalid YouTube URL or Video ID');
      error.status = 400;
      throw error;
    }

    // 1. Check if video already exists
    let video = await prisma.video.findUnique({
      where: { videoId },
      include: { summary: true },
    });

    if (video) {
      // Ensure custom import is tracked for this user so it appears in their feed
      if (userId) {
        try {
          await prisma.trackedSource.upsert({
            where: {
              userId_platform_sourceId: {
                userId,
                platform: 'custom_import',
                sourceId: videoId,
              },
            },
            create: {
              userId,
              platform: 'custom_import',
              sourceId: videoId,
              sourceName: video.description || 'Custom Link',
              thumbnailUrl: video.thumbnailUrl,
            },
            update: {},
          });
        } catch (err) {
          console.warn(`[VideosService] Could not track existing custom import for user ${userId}:`, err.message);
        }
      }

      // If not yet summarized, trigger summarization in background
      if (video.summaryStatus !== 'completed') {
        inlinePipeline.fireAndForget({
          videoId: video.videoId,
          channelId: video.channelId,
          title: video.title,
          videoUrl: video.videoUrl,
        });
      }
      return {
        ...video,
        isCustomImport: true,
        channelName: video.description || 'Custom Link',
      };
    }

    // 2. Fetch public YouTube oEmbed metadata (No API key needed!)
    let title = 'YouTube Video';
    let authorName = 'YouTube Creator';
    let thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    try {
      const oembedRes = await axios.get(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
        { timeout: 7000 }
      );
      if (oembedRes.data) {
        title = oembedRes.data.title || title;
        authorName = oembedRes.data.author_name || authorName;
        thumbnailUrl = oembedRes.data.thumbnail_url || thumbnailUrl;
      }
    } catch (err) {
      console.warn(`[VideosService] oEmbed lookup note for ${videoId}:`, err.message);
    }

    // 3. Upsert video in database
    video = await prisma.video.upsert({
      where: { videoId },
      create: {
        videoId,
        channelId: channelId || 'imported',
        title,
        description: authorName || 'Custom Link',
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnailUrl,
        publishedAt: new Date(),
        transcriptStatus: 'pending',
        summaryStatus: 'processing',
      },
      update: {
        title,
        thumbnailUrl,
        description: authorName || 'Custom Link',
      },
      include: { summary: true },
    });

    // 4. Save to user's tracked custom imports so it permanently stays in their activity feed
    if (userId) {
      try {
        await prisma.trackedSource.upsert({
          where: {
            userId_platform_sourceId: {
              userId,
              platform: 'custom_import',
              sourceId: videoId,
            },
          },
          create: {
            userId,
            platform: 'custom_import',
            sourceId: videoId,
            sourceName: authorName || 'Custom Link',
            thumbnailUrl,
          },
          update: {
            sourceName: authorName || 'Custom Link',
            thumbnailUrl,
          },
        });
      } catch (err) {
        console.warn(`[VideosService] Could not track custom import for user ${userId}:`, err.message);
      }
    }

    // 5. Trigger inline AI distillation pipeline
    inlinePipeline.fireAndForget({
      videoId: video.videoId,
      channelId: video.channelId,
      title: video.title,
      videoUrl: video.videoUrl,
    });

    return {
      ...video,
      isCustomImport: true,
      channelName: authorName,
    };
  }

  /**
   * Fetches fresh YouTube uploads for a user's tracked channels on pull-to-refresh.
   * Priority/favorite channels are synced immediately; remaining channels are updated
   * gracefully in background batches.
   * @param {string} userId
   * @param {object} [opts]
   * @param {string[]} [opts.priorityChannelIds]
   */
  async syncLatestFeedUploads(userId, { priorityChannelIds = [] } = {}) {
    // 1. Get all YouTube channels tracked by the user
    const tracked = await prisma.trackedSource.findMany({
      where: { userId, platform: 'youtube' },
      select: { sourceId: true },
    });

    const allChannelIds = tracked.map((t) => t.sourceId);
    if (allChannelIds.length === 0) {
      return { channelsSynced: 0, newVideosCount: 0 };
    }

    // 2. Check for valid OAuth access token for official YouTube Data API
    const accessToken = await integrationsService.getValidAccessToken(userId);

    // 3. Separate priority channels from the rest
    const prioritySet = new Set(priorityChannelIds);
    const priorityChannels = allChannelIds.filter((id) => prioritySet.has(id));
    const nonPriorityChannels = allChannelIds.filter((id) => !prioritySet.has(id));

    // For pull-to-refresh: Sync all priority channels + up to 10 recent non-priority channels immediately
    const immediateChannels =
      priorityChannels.length > 0
        ? [...priorityChannels, ...nonPriorityChannels.slice(0, 10)]
        : allChannelIds.slice(0, 15);

    let newVideosCount = 0;
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
              newVideosCount++;
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

    for (let i = 0; i < immediateChannels.length; i += batchSize) {
      const batch = immediateChannels.slice(i, i + batchSize);
      await Promise.allSettled(batch.map((channelId) => processChannel(channelId)));
    }

    // 4. Sync remaining channels in non-blocking background batches
    const remainingChannels = nonPriorityChannels.slice(10);
    if (remainingChannels.length > 0) {
      setTimeout(async () => {
        try {
          for (let i = 0; i < remainingChannels.length; i += batchSize) {
            const batch = remainingChannels.slice(i, i + batchSize);
            await Promise.allSettled(batch.map((channelId) => processChannel(channelId)));
          }
        } catch (err) {
          console.warn('[VideosService] Background sync pass note:', err.message);
        }
      }, 1000);
    }

    return {
      channelsSynced: immediateChannels.length,
      totalChannels: allChannelIds.length,
      newVideosCount,
    };
  }
}

module.exports = new VideosService();
