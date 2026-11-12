const prisma = require('../../config/db');
const webSubService = require('../integrations/youtube/websub.service');

class SourcesService {
  /**
   * Retrieves all tracked sources/channels for a user.
   * @param {string} userId
   */
  async listTrackedSources(userId) {
    return prisma.trackedSource.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
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

    const tracked = await prisma.trackedSource.upsert({
      where: {
        userId_platform_sourceId: {
          userId,
          platform,
          sourceId,
        },
      },
      create: {
        userId,
        platform,
        sourceId,
        sourceName,
      },
      update: {
        sourceName,
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
}

module.exports = new SourcesService();

