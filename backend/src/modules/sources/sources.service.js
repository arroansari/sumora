const prisma = require('../../config/db');
const webSubService = require('../integrations/youtube/websub.service');

class SourcesService {
  /**
   * Retrieves all tracked sources/channels for a user.
   * Defaults to 'youtube' to ensure separation between channels and subreddits.
   * @param {string} userId
   * @param {object} [options]
   * @param {string} [options.platform]
   */
  async listTrackedSources(userId, { platform = 'youtube' } = {}) {
    const normPlatform = (platform || 'youtube').toLowerCase();
    const where = { userId };
    if (platform && platform !== 'all') {
      where.platform = { in: [normPlatform, platform.toUpperCase()] };
    }
    let sources = await prisma.trackedSource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Auto-seed high-signal Books authors & topics if user has none tracked in PostgreSQL
    if (sources.length === 0 && (normPlatform === 'books' || normPlatform === 'open_library')) {
      const defaultBooks = [
        { sourceId: 'james-clear', sourceName: 'James Clear', memberCount: 4 },
        { sourceId: 'morgan-housel', sourceName: 'Morgan Housel', memberCount: 3 },
        { sourceId: 'jenny-odell', sourceName: 'Jenny Odell', memberCount: 2 },
        { sourceId: 'daniel-kahneman', sourceName: 'Daniel Kahneman', memberCount: 3 },
        { sourceId: 'ryan-holiday', sourceName: 'Ryan Holiday', memberCount: 5 },
        { sourceId: 'psychology', sourceName: 'Psychology Mental Models', memberCount: 14 },
        { sourceId: 'productivity', sourceName: 'Productivity & Habits', memberCount: 18 },
        { sourceId: 'wealth', sourceName: 'Wealth & Decision Making', memberCount: 11 },
      ];
      for (const b of defaultBooks) {
        try {
          await prisma.trackedSource.create({
            data: {
              userId,
              platform: 'books',
              sourceId: b.sourceId,
              sourceName: b.sourceName,
              memberCount: b.memberCount,
              isActive: true,
            },
          });
        } catch {}
      }
      sources = await prisma.trackedSource.findMany({ where, orderBy: { createdAt: 'desc' } });
    }

    // Auto-seed high-signal Cinema & OTT streaming radars if user has none tracked in PostgreSQL
    if (sources.length === 0 && (normPlatform === 'cinema' || normPlatform === 'tmdb')) {
      const defaultCinema = [
        { sourceId: 'netflix', sourceName: 'Netflix Originals & Premieres', memberCount: 18 },
        { sourceId: 'max', sourceName: 'Max & HBO Cinema Radar', memberCount: 12 },
        { sourceId: 'appletv', sourceName: 'Apple TV+ Quality Films', memberCount: 8 },
        { sourceId: 'tmdb-trending', sourceName: 'TMDB Trending & Box Office', memberCount: 24 },
        { sourceId: 'scifi', sourceName: 'Sci-Fi & Cyberpunk Radar', memberCount: 15 },
        { sourceId: 'a24', sourceName: 'A24 & Independent Cinema', memberCount: 9 },
      ];
      for (const c of defaultCinema) {
        try {
          await prisma.trackedSource.create({
            data: {
              userId,
              platform: 'cinema',
              sourceId: c.sourceId,
              sourceName: c.sourceName,
              memberCount: c.memberCount,
              isActive: true,
            },
          });
        } catch {}
      }
      sources = await prisma.trackedSource.findMany({ where, orderBy: { createdAt: 'desc' } });
    }

    // Auto-cap active channels to at most 50 if legacy database had all active
    const activeYoutube = sources.filter(
      (s) => s.platform.toLowerCase() === 'youtube' && s.isActive
    );
    if (activeYoutube.length > 50) {
      // Keep only top 50 active to prevent API cost overruns and match priority slots
      const keepIds = new Set(activeYoutube.slice(0, 50).map((s) => s.id));
      const deactivateIds = activeYoutube
        .filter((s) => !keepIds.has(s.id))
        .map((s) => s.id);

      if (deactivateIds.length > 0) {
        prisma.trackedSource
          .updateMany({
            where: { id: { in: deactivateIds } },
            data: { isActive: false },
          })
          .catch((err) =>
            console.warn('[SourcesService] Failed to auto-cap legacy active sources:', err.message)
          );

        for (const s of sources) {
          if (deactivateIds.includes(s.id)) {
            s.isActive = false;
          }
        }
      }
    }

    return sources;
  }

  /**
   * Adds a channel/source to the user's tracked list.
   * @param {string} userId
   * @param {object} sourceData
   * @param {string} sourceData.platform
   * @param {string} sourceData.sourceId
   * @param {string} sourceData.sourceName
   */
  async addTrackedSource(userId, { platform = 'youtube', sourceId, sourceName }) {
    if (!sourceId || !sourceName) {
      const error = new Error('sourceId and sourceName are required');
      error.status = 400;
      throw error;
    }

    const normPlatform = (platform || 'youtube').toLowerCase();

    const tracked = await prisma.trackedSource.upsert({
      where: {
        userId_platform_sourceId: {
          userId,
          platform: normPlatform,
          sourceId,
        },
      },
      create: {
        userId,
        platform: normPlatform,
        sourceId,
        sourceName,
        isActive: true,
      },
      update: {
        sourceName,
        isActive: true,
      },
    });

    // If platform is youtube, ensure WebSub subscription is active
    if (platform === 'youtube') {
      webSubService.subscribeToChannel(sourceId).catch((err) => {
        console.warn(`[WebSub] Subscribe failed for ${sourceId}:`, err.message);
      });
    }

    return tracked;
  }

  /**
   * Removes a source from user's tracked list.
   * @param {string} userId
   * @param {string} sourceRecordId
   */
  async removeTrackedSource(userId, sourceRecordId) {
    const source = await prisma.trackedSource.findFirst({
      where: { id: sourceRecordId, userId },
    });

    if (!source) {
      const error = new Error('Tracked source not found');
      error.status = 404;
      throw error;
    }

    await prisma.trackedSource.delete({
      where: { id: sourceRecordId },
    });

    return {
      success: true,
      message: `Stopped tracking ${source.sourceName}`,
    };
  }

  /**
   * Toggles active tracking status (isActive) for a source.
   * Enables selective AI summarization to prevent excessive API costs.
   * @param {string} userId
   * @param {string} sourceIdOrRecordId
   */
  async toggleTrackedSource(userId, sourceIdOrRecordId) {
    const source = await prisma.trackedSource.findFirst({
      where: {
        userId,
        OR: [{ id: sourceIdOrRecordId }, { sourceId: sourceIdOrRecordId }],
      },
    });

    if (!source) {
      const error = new Error('Tracked source not found');
      error.status = 404;
      throw error;
    }

    const nextActive = !source.isActive;

    const updated = await prisma.trackedSource.update({
      where: { id: source.id },
      data: { isActive: nextActive },
    });

    // If enabling YouTube channel, ensure WebSub subscription is active
    if (updated.platform.toLowerCase() === 'youtube' && nextActive) {
      webSubService.subscribeToChannel(updated.sourceId).catch((err) => {
        console.warn(`[WebSub] Re-subscribe failed for ${updated.sourceId}:`, err.message);
      });
    }

    return updated;
  }
}

module.exports = new SourcesService();

