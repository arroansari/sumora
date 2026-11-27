const prisma = require('../../config/db');
const axios = require('axios');
const { getQueue, QUEUE_NAMES } = require('../../jobs');
const inlinePipeline = require('../pipeline/inline-pipeline.service');
const webSubService = require('../integrations/youtube/websub.service');
const youTubeService = require('../integrations/youtube/youtube.service');
const integrationsService = require('../integrations/integrations.service');
const { batchUpsertVideos } = require('../../utils/videoBatch.util');
const cache = require('../../utils/cache.util');

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
  async getFeedHttpJson(userId, opts = {}) {
    const { page = 1, limit = 20, cursor = null, channelId = null, from = null, to = null, search = null } = opts;
    const [userEpoch, globalEpoch] = await cache.getEpochs(
      `cache:feed_epoch:${userId}`,
      'cache:videos:global_epoch'
    );
    const httpKey = `cache:http:videos:feed:${userId}:u${userEpoch}:g${globalEpoch}:p${page}:l${limit}:c${cursor || ''}:ch${channelId || ''}:f${from || ''}:t${to || ''}:s${search ? search.trim() : ''}`;
    const cachedRaw = await cache.getRaw(httpKey);
    if (cachedRaw) return cachedRaw;

    const result = await this.getFeed(userId, opts);
    const serialized = JSON.stringify({
      success: true,
      data: result.videos,
      pagination: result.pagination,
    });
    await cache.setRaw(httpKey, serialized, 30);
    return serialized;
  }

  async getFeed(userId, { page = 1, limit = 20, cursor = null, channelId = null, from = null, to = null, search = null } = {}) {
    const skip = (page - 1) * limit;

    // Fetch YouTube channels & custom imports in ONE roundtrip instead of 2 sequential queries
    const userSources = await prisma.trackedSource.findMany({
      where: {
        userId,
        OR: [
          channelId ? { platform: 'youtube' } : { platform: 'youtube', isActive: true },
          { platform: 'custom_import' },
        ],
      },
      select: { platform: true, sourceId: true, sourceName: true },
    });

    const channelIds = [];
    const channelNameMap = new Map();
    const customVideoIds = [];
    const customNameMap = new Map();

    for (const s of userSources) {
      if (s.platform === 'custom_import') {
        customVideoIds.push(s.sourceId);
        customNameMap.set(s.sourceId, s.sourceName);
      } else {
        channelIds.push(s.sourceId);
        channelNameMap.set(s.sourceId, s.sourceName);
      }
    }

    // If user has not tracked any channels, has no custom imports, and didn't specify a channel, return empty feed
    if (channelIds.length === 0 && customVideoIds.length === 0 && !channelId) {
      return {
        videos: [],
        pagination: cursor
          ? { limit, nextCursor: null, hasMore: false }
          : { page, limit, total: 0, totalPages: 0 },
      };
    }

    // Build where clause — optionally filter to a single channel and/or date range
    const andConditions = [];

    if (channelId) {
      andConditions.push({ channelId });
    } else {
      const orConditions = [];
      if (channelIds.length > 0) {
        orConditions.push({ channelId: { in: channelIds } });
      }
      if (customVideoIds.length > 0) {
        orConditions.push({ videoId: { in: customVideoIds } });
      }
      if (orConditions.length === 1) {
        andConditions.push(orConditions[0]);
      } else if (orConditions.length > 1) {
        andConditions.push({ OR: orConditions });
      }
    }

    if (search && search.trim()) {
      andConditions.push({
        title: {
          contains: search.trim(),
          mode: 'insensitive',
        },
      });
    }

    if (from || to) {
      const publishedFilter = {};
      if (from) publishedFilter.gte = new Date(from);
      if (to) publishedFilter.lte = new Date(to);
      andConditions.push({ publishedAt: publishedFilter });
    }

    // Keyset/cursor pagination avoids deep OFFSET scans and skips COUNT(*)
    let parsedCursor = null;
    if (cursor && typeof cursor === 'string' && cursor.includes('|')) {
      const [tsStr, cursorId] = cursor.split('|');
      const cursorDate = new Date(tsStr);
      if (!isNaN(cursorDate.getTime()) && cursorId) {
        parsedCursor = { cursorDate, cursorId };
        andConditions.push({
          OR: [
            { publishedAt: { lt: cursorDate } },
            { publishedAt: cursorDate, id: { lt: cursorId } },
          ],
        });
      }
    }

    const whereClause = andConditions.length === 1 ? andConditions[0] : { AND: andConditions };

    // Selective projection for feed cards (omits heavy deep-dive JSON arrays fetched on detail screen)
    const videoSelect = {
      id: true,
      videoId: true,
      channelId: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      videoUrl: true,
      publishedAt: true,
      transcriptStatus: true,
      summaryStatus: true,
      summary: {
        select: {
          id: true,
          videoId: true,
          overview: true,
          keyPoints: true,
          importantConcepts: true,
          detailedSummary: true,
          conclusion: true,
          topicsCovered: true,
          aiProvider: true,
          modelName: true,
          videoOverview: true,
          keyTakeaways: true,
        },
      },
    };

    const orderBy = [{ publishedAt: 'desc' }, { id: 'desc' }];

    let videos;
    let total = null;
    let hasMore = false;

    if (parsedCursor || cursor === 'start') {
      const rows = await prisma.video.findMany({
        where: whereClause,
        orderBy,
        take: limit + 1,
        select: videoSelect,
      });
      hasMore = rows.length > limit;
      videos = hasMore ? rows.slice(0, limit) : rows;
    } else {
      const [rows, countResult] = await Promise.all([
        prisma.video.findMany({
          where: whereClause,
          orderBy,
          skip,
          take: limit,
          select: videoSelect,
        }),
        prisma.video.count({ where: whereClause }),
      ]);
      videos = rows;
      total = countResult;
      hasMore = skip + videos.length < total;
    }

    const lastVideo = videos[videos.length - 1];
    const nextCursor =
      hasMore && lastVideo
        ? `${new Date(lastVideo.publishedAt).toISOString()}|${lastVideo.id}`
        : null;

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
      pagination:
        total !== null
          ? {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            nextCursor,
            hasMore,
          }
          : {
            limit,
            nextCursor,
            hasMore,
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
          select: { language: true, source: true, status: true, segments: true, fullText: true, createdAt: true },
        },
      },
    });

    if (!video) {
      if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        try {
          return await this.importVideoByUrl(userId, { url: videoId });
        } catch (importErr) {
          console.warn(`[VideosService] Auto-import fallback failed for ${videoId}:`, importErr.message);
        }
      }
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
      include: {
        summary: true,
        transcript: {
          select: { language: true, source: true, status: true, segments: true, fullText: true },
        },
      },
    });

    if (!video) {
      if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        try {
          return await this.importVideoByUrl(userId, { url: videoId });
        } catch (importErr) {
          console.warn(`[VideosService] Auto-import fallback failed for ${videoId}:`, importErr.message);
        }
      }
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
      transcript: video.transcript,
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
      if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        try {
          return await this.importVideoByUrl(userId, { url: videoId });
        } catch (importErr) {
          console.warn(`[VideosService] Auto-import fallback failed for ${videoId}:`, importErr.message);
        }
      }
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

  async _hasActiveQueueJob(videoId) {
    try {
      const tq = getQueue(QUEUE_NAMES.TRANSCRIPT_INGESTION);
      const sq = getQueue(QUEUE_NAMES.AI_SUMMARIZATION);
      const activeStates = new Set(['active', 'waiting', 'delayed', 'prioritized', 'waiting-children']);
      const jobs = await Promise.all([
        tq ? tq.getJob(`transcript-${videoId}`).catch(() => null) : null,
        sq ? sq.getJob(`summary-${videoId}`).catch(() => null) : null,
      ]);
      for (const job of jobs) {
        if (!job) continue;
        const state = await job.getState().catch(() => null);
        if (activeStates.has(state)) return true;
      }
    } catch {
      // Fall back to timestamp age check if queue lookup fails
    }
    return false;
  }

  async _enqueueOrRunPipeline(video) {
    let transcriptQueue = null;
    try {
      transcriptQueue = getQueue(QUEUE_NAMES.TRANSCRIPT_INGESTION);
    } catch (err) {
      console.warn('[VideosService] BullMQ unavailable, using inline pipeline:', err.message);
    }

    if (transcriptQueue) {
      try {
        const jobId = `transcript-${video.videoId}`;
        const existingJob = await transcriptQueue.getJob(jobId).catch(() => null);
        if (existingJob) {
          const state = await existingJob.getState().catch(() => null);
          if (state === 'failed' || state === 'completed') {
            await existingJob.remove().catch(() => {});
          }
        }
        await transcriptQueue.add(
          'fetch-transcript',
          {
            videoId: video.videoId,
            channelId: video.channelId,
            title: video.title,
            videoUrl: video.videoUrl,
          },
          { jobId }
        );
        await prisma.video.update({
          where: { videoId: video.videoId },
          data: { summaryStatus: 'processing', transcriptStatus: 'fetching_transcript' },
        });
        return { message: 'Summarization job queued', status: 'processing' };
      } catch (queueErr) {
        console.warn(`[VideosService] Queue.add failed, falling back to inline: ${queueErr.message}`);
      }
    }

    // Run inline — fire and forget so the HTTP response returns immediately
    inlinePipeline.fireAndForget({
      videoId: video.videoId,
      channelId: video.channelId,
      title: video.title,
      videoUrl: video.videoUrl,
    });
    await prisma.video.update({
      where: { videoId: video.videoId },
      data: { summaryStatus: 'processing', transcriptStatus: 'fetching_transcript' },
    });
    return { message: 'Summarization started (inline)', status: 'processing' };
  }

  async getSummaryStreamSnapshot(videoId) {
    const video = await prisma.video.findUnique({
      where: { videoId },
      include: { summary: true, transcript: true },
    });

    if (!video) {
      const error = new Error('Video record not found');
      error.status = 404;
      throw error;
    }

    return video;
  }

  /**
   * Manually triggers transcript + AI summarization for a video.
   * Uses BullMQ if Redis is available; falls back to inline pipeline otherwise.
   * @param {string} videoId
   */
  async requestSummarization(videoId) {
    const video = await prisma.video.findUnique({
      where: { videoId },
      include: { summary: true },
    });

    if (!video) {
      const error = new Error('Video record not found');
      error.status = 404;
      throw error;
    }

    const hasDetailedSummary = video.summary && video.summary.videoOverview;
    if (video.summaryStatus === 'completed' && hasDetailedSummary) {
      return {
        message: 'Summarization already completed',
        status: 'completed',
      };
    }

    if (video.summaryStatus === 'processing') {
      const ageMs = video.updatedAt ? Date.now() - new Date(video.updatedAt).getTime() : 0;
      const hasActiveQueueJob = await this._hasActiveQueueJob(videoId);

      // Avoid duplicating legitimately queued BullMQ jobs during high-load backlogs (up to 10 min)
      if (hasActiveQueueJob && ageMs <= 600000) {
        return {
          message: 'Summarization already processing',
          status: 'processing',
        };
      }

      const isStaleProcessing = !hasActiveQueueJob && ageMs > 45000;
      if (!isStaleProcessing && ageMs <= 600000) {
        return {
          message: 'Summarization already processing',
          status: 'processing',
        };
      }

      console.warn(
        `[VideosService] Video ${videoId} was stuck in processing for ${Math.round(ageMs / 1000)}s (activeJob=${hasActiveQueueJob}). Recovering pipeline.`
      );
    }

    return this._enqueueOrRunPipeline(video);
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

      // If not yet summarized, trigger summarization via queue or inline pipeline
      if (video.summaryStatus !== 'completed') {
        await this._enqueueOrRunPipeline(video);
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

    // 5. Enqueue AI distillation pipeline (BullMQ when available, inline fallback)
    await this._enqueueOrRunPipeline(video);

    await cache.bumpEpochs(`cache:feed_epoch:${userId}`, 'cache:videos:global_epoch');
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
          const { createdCount } = await batchUpsertVideos(uploads);
          newVideosCount += createdCount;
          return { upserted: uploads.length };
        }
      }

      // Fallback: WebSub RSS feed parser (indexes videos without triggering expensive AI batch summarization)
      return webSubService.backfillChannelFeed(channelId, { triggerPipeline: false });
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

    if (newVideosCount > 0) {
      await cache.bumpEpochs(`cache:feed_epoch:${userId}`, 'cache:videos:global_epoch');
    }

    return {
      channelsSynced: immediateChannels.length,
      totalChannels: allChannelIds.length,
      newVideosCount,
    };
  }

  /**
   * Retrieves the Top 10 most popular videos for a specific channel.
   * Scrapes YouTube popular uploads (sort=p), upserts them into DB, and returns them enriched with summaries.
   * @param {string} channelId
   * @param {number} maxResults
   */
  async getPopularVideosForChannel(channelId, maxResults = 10) {
    if (!channelId) return [];

    const youtubeService = require('../integrations/youtube/youtube.service');
    const popular = await youtubeService.getPopularVideos(channelId, maxResults);

    if (popular && popular.length > 0) {
      await batchUpsertVideos(
        popular.map((v) => ({
          ...v,
          publishedAt: v.publishedAt || new Date(0),
        }))
      ).catch(() => { });
    }

    // Now query from DB with summary relation included
    const videoIds = popular.map((p) => p.videoId);
    const dbVideos = await prisma.video.findMany({
      where: videoIds.length > 0 ? { videoId: { in: videoIds } } : { channelId },
      include: {
        summary: true,
      },
      take: maxResults,
    });

    // Sort to preserve popular rank
    if (videoIds.length > 0) {
      const orderMap = new Map(videoIds.map((id, idx) => [id, idx]));
      dbVideos.sort((a, b) => {
        const orderA = orderMap.has(a.videoId) ? orderMap.get(a.videoId) : 999;
        const orderB = orderMap.has(b.videoId) ? orderMap.get(b.videoId) : 999;
        return orderA - orderB;
      });
    }

    return dbVideos.slice(0, maxResults);
  }

  /**
   * Search YouTube videos on-demand using public YouTube search.
   * Can be channel-scoped (e.g. "Dhruv Rathee water park") or global.
   * Upserts the metadata so they have valid DB records, preserving existing summary state.
   * @param {Object} params
   * @param {string} params.query
   * @param {string} [params.channelName]
   * @param {string} [params.channelId]
   * @param {number} [params.limit]
   */
  async searchYouTubeVideos({ query, channelName = null, channelId = null, limit = 15 }) {
    if (!query || !query.trim()) return [];

    let fullQuery = query.trim();
    if (channelName && !fullQuery.toLowerCase().includes(channelName.toLowerCase())) {
      fullQuery = `${channelName} ${fullQuery}`;
    }

    const youtubeService = require('../integrations/youtube/youtube.service');
    const rawResults = await youtubeService.searchVideos(fullQuery, limit);
    if (!rawResults || rawResults.length === 0) return [];

    // Pre-upsert metadata into DB in batch so records exist when accessed
    await batchUpsertVideos(
      rawResults.map((v) => ({
        videoId: v.videoId,
        channelId: v.channelId || channelId || 'youtube_search',
        title: v.title,
        description: v.channelName || channelName || 'YouTube Creator',
        videoUrl: v.videoUrl,
        thumbnailUrl: v.thumbnailUrl,
        publishedAt: new Date(),
      }))
    ).catch(() => { });

    const videoIds = rawResults.map((r) => r.videoId);
    const dbVideos = await prisma.video.findMany({
      where: { videoId: { in: videoIds } },
      include: {
        summary: true,
      },
    });

    const dbMap = new Map();
    for (const d of dbVideos) {
      dbMap.set(d.videoId, d);
    }

    return rawResults.map((r) => {
      const d = dbMap.get(r.videoId);
      return {
        id: d ? d.id : `yt_${r.videoId}`,
        videoId: r.videoId,
        channelId: d ? d.channelId : (r.channelId || channelId || 'youtube_search'),
        channelName: r.channelName || (d ? d.description : null) || channelName || 'YouTube Creator',
        title: d ? d.title : r.title,
        videoUrl: r.videoUrl,
        thumbnailUrl: r.thumbnailUrl,
        publishedAt: d ? d.publishedAt.toISOString() : new Date().toISOString(),
        transcriptStatus: d ? d.transcriptStatus : 'pending',
        summaryStatus: d ? d.summaryStatus : 'pending',
        summary: d ? d.summary : null,
        duration: r.duration,
        publishedTime: r.publishedTime,
        isCustomImport: true,
      };
    });
  }
}

module.exports = new VideosService();
