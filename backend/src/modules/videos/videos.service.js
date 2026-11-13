const prisma = require('../../config/db');
const { getQueue, QUEUE_NAMES } = require('../../jobs');
const inlinePipeline = require('../pipeline/inline-pipeline.service');

class VideosService {
  /**
   * Retrieves paginated video feed for channels tracked by the user.
   * Joins TrackedSource to surface channelName alongside each video.
   * @param {string} userId
   * @param {object} [pagination]
   */
  async getFeed(userId, { page = 1, limit = 20, channelId = null, from = null, to = null } = {}) {
    const skip = (page - 1) * limit;

    // Get list of channel IDs tracked by user (with their display names)
    const tracked = await prisma.trackedSource.findMany({
      where: { userId, platform: 'youtube' },
      select: { sourceId: true, sourceName: true },
    });

    const channelIds = tracked.map((t) => t.sourceId);

    // Build a quick lookup map: channelId → channelName
    const channelNameMap = new Map(tracked.map((t) => [t.sourceId, t.sourceName]));

    // If user has not tracked any channels yet, return empty feed
    if (channelIds.length === 0) {
      return {
        videos: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    // Build where clause — optionally filter to a single channel and/or date range
    const whereClause = {
      channelId: channelId
        ? channelId  // single-channel view
        : { in: channelIds },
    };

    // Guard: if filtering to a specific channel, ensure user actually tracks it
    if (channelId && !channelIds.includes(channelId)) {
      return {
        videos: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
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

    // Enrich each video with its channelName from the tracked sources map
    const enrichedVideos = videos.map((v) => ({
      ...v,
      channelName: channelNameMap.get(v.channelId) || null,
    }));

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
}

module.exports = new VideosService();
