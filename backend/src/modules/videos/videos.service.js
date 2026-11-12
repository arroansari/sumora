const prisma = require('../../config/db');
const { getQueue, QUEUE_NAMES } = require('../../jobs');

class VideosService {
  /**
   * Retrieves paginated video feed for channels tracked by the user.
   * @param {string} userId
   * @param {object} [pagination]
   */
  async getFeed(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;

    // Get list of channel IDs tracked by user
    const tracked = await prisma.trackedSource.findMany({
      where: { userId },
      select: { sourceId: true },
    });

    const channelIds = tracked.map((t) => t.sourceId);

    // If user has not tracked any channels yet, return empty feed
    if (channelIds.length === 0) {
      return {
        videos: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const whereClause = { channelId: { in: channelIds } };

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

    return {
      videos,
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
   * @param {string} videoId
   */
  async getVideoById(videoId) {
    const video = await prisma.video.findUnique({
      where: { videoId },
      include: {
        summary: true,
        transcript: {
          select: {
            language: true,
            source: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!video) {
      const error = new Error('Video not found');
      error.status = 404;
      throw error;
    }

    return video;
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
   * Status values: pending, fetching_transcript, processing, completed, transcript_unavailable, failed
   * @param {string} videoId
   */
  async getSummaryStatus(videoId) {
    const video = await prisma.video.findUnique({
      where: { videoId },
      select: {
        videoId: true,
        summaryStatus: true,
        transcriptStatus: true,
        updatedAt: true,
      },
    });

    if (!video) {
      const error = new Error('Video not found');
      error.status = 404;
      throw error;
    }

    let statusMessage = 'Your video summary is being prepared.';
    switch (video.summaryStatus) {
      case 'processing':
        statusMessage = 'Generating your video summary...';
        break;
      case 'completed':
        statusMessage = 'Summary generated successfully.';
        break;
      case 'fetching_transcript':
        statusMessage = 'Retrieving authorized transcript...';
        break;
      case 'transcript_unavailable':
        statusMessage = 'No transcript available for this video.';
        break;
      case 'failed':
        statusMessage = 'Failed to generate summary.';
        break;
    }

    return {
      videoId: video.videoId,
      status: video.summaryStatus,
      transcriptStatus: video.transcriptStatus,
      message: statusMessage,
      updatedAt: video.updatedAt,
    };
  }

  /**
   * Triggers or enqueues summarization job, preventing duplicate active jobs.
   * @param {string} videoId
   */
  async requestSummarization(videoId) {
    const video = await prisma.video.findUnique({
      where: { videoId },
    });

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

    const queue = getQueue(QUEUE_NAMES.AI_SUMMARIZATION);
    await queue.add('summarize-video', { videoId });

    await prisma.video.update({
      where: { videoId },
      data: { summaryStatus: 'processing' },
    });

    return {
      message: 'Summarization job queued successfully',
      status: 'processing',
    };
  }
}

module.exports = new VideosService();
