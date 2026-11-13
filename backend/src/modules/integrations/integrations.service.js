const prisma = require('../../config/db');
const { encrypt, decrypt } = require('../../utils/encryption.util');
const youTubeService = require('./youtube/youtube.service');
const webSubService = require('./youtube/websub.service');

class IntegrationsService {
  /**
   * Retrieves all connected platform accounts for a given user.
   * @param {string} userId
   */
  async listConnectedAccounts(userId) {
    return prisma.connectedAccount.findMany({
      where: { userId },
      select: {
        id: true,
        platform: true,
        platformUserId: true,
        status: true,
        connectedAt: true,
      },
    });
  }

  /**
   * Generates YouTube OAuth connect URL with encoded state.
   * @param {string} userId
   * @returns {{authUrl: string}}
   */
  getYouTubeConnectUrl(userId) {
    const state = JSON.stringify({ userId, timestamp: Date.now() });
    const encodedState = Buffer.from(state).toString('base64');
    const authUrl = youTubeService.getAuthUrl(encodedState);
    return { authUrl };
  }

  /**
   * Completes YouTube OAuth callback:
   * 1. Exchanges auth code for tokens
   * 2. Encrypts tokens with AES-256-GCM
   * 3. Upserts ConnectedAccount and PlatformToken
   * 4. Fetches subscribed channels and syncs TrackedSources
   * 5. Registers WebSub notifications for each channel
   * @param {string} userId
   * @param {string} code
   */
  async handleYouTubeCallback(userId, code) {
    const tokenData = await youTubeService.exchangeCode(code);
    const profile = await youTubeService.getProfile(tokenData.accessToken);

    const encryptedAccessToken = encrypt(tokenData.accessToken);
    const encryptedRefreshToken = tokenData.refreshToken ? encrypt(tokenData.refreshToken) : null;
    const expiresAt = tokenData.expiresIn
      ? new Date(Date.now() + tokenData.expiresIn * 1000)
      : null;

    // Upsert ConnectedAccount
    const connectedAccount = await prisma.connectedAccount.upsert({
      where: {
        userId_platform: {
          userId,
          platform: 'youtube',
        },
      },
      create: {
        userId,
        platform: 'youtube',
        platformUserId: profile.platformUserId || profile.email,
        status: 'active',
        token: {
          create: {
            encryptedAccessToken,
            encryptedRefreshToken,
            expiresAt,
          },
        },
      },
      update: {
        platformUserId: profile.platformUserId || profile.email,
        status: 'active',
        token: {
          upsert: {
            create: {
              encryptedAccessToken,
              encryptedRefreshToken,
              expiresAt,
            },
            update: {
              encryptedAccessToken,
              ...(encryptedRefreshToken && { encryptedRefreshToken }),
              expiresAt,
            },
          },
        },
      },
      include: {
        token: false,
      },
    });

    // Fetch subscriptions
    let subscribedChannels = [];
    try {
      subscribedChannels = await youTubeService.getSubscribedChannels(tokenData.accessToken);
    } catch (err) {
      console.warn('[YouTube] Failed to fetch subscriptions during connect:', err.message);
    }

    // Upsert TrackedSources and register WebSub
    const syncedSources = [];
    for (const channel of subscribedChannels) {
      const source = await prisma.trackedSource.upsert({
        where: {
          userId_platform_sourceId: {
            userId,
            platform: 'youtube',
            sourceId: channel.sourceId,
          },
        },
        create: {
          userId,
          platform: 'youtube',
          sourceId: channel.sourceId,
          sourceName: channel.sourceName,
          thumbnailUrl: channel.thumbnailUrl || null,
        },
        update: {
          sourceName: channel.sourceName,
          ...(channel.thumbnailUrl ? { thumbnailUrl: channel.thumbnailUrl } : {}),
        },
      });

      syncedSources.push(source);

      // Register WebSub in background (don't wait/fail connect if hub fails)
      webSubService.subscribeToChannel(channel.sourceId).catch((err) => {
        console.warn(`[WebSub] Background subscribe failed for ${channel.sourceId}:`, err.message);
      });
    }

    return {
      connectedAccount,
      syncedChannelsCount: syncedSources.length,
      syncedSources,
    };
  }

  /**
   * Re-syncs the user's YouTube subscriptions (names + profile thumbnails)
   * using their stored encrypted OAuth tokens, refreshing if expired.
   * @param {string} userId
   */
  async syncYouTubeSubscriptions(userId) {
    const account = await prisma.connectedAccount.findUnique({
      where: { userId_platform: { userId, platform: 'youtube' } },
      include: { token: true },
    });

    if (!account || !account.token) {
      const error = new Error('YouTube account is not connected');
      error.status = 404;
      throw error;
    }

    let accessToken = decrypt(account.token.encryptedAccessToken);
    const isExpired =
      account.token.expiresAt && new Date(account.token.expiresAt).getTime() <= Date.now() + 60000;

    if (isExpired && account.token.encryptedRefreshToken) {
      const refreshed = await youTubeService.refreshAccessToken(account.token.encryptedRefreshToken);
      accessToken = refreshed.accessToken;
      await prisma.platformToken.update({
        where: { id: account.token.id },
        data: {
          encryptedAccessToken: encrypt(refreshed.accessToken),
          expiresAt: refreshed.expiresIn
            ? new Date(Date.now() + refreshed.expiresIn * 1000)
            : null,
        },
      });
    }

    const subscribedChannels = await youTubeService.getSubscribedChannels(accessToken);

    for (const channel of subscribedChannels) {
      await prisma.trackedSource.upsert({
        where: {
          userId_platform_sourceId: {
            userId,
            platform: 'youtube',
            sourceId: channel.sourceId,
          },
        },
        create: {
          userId,
          platform: 'youtube',
          sourceId: channel.sourceId,
          sourceName: channel.sourceName,
          thumbnailUrl: channel.thumbnailUrl || null,
        },
        update: {
          sourceName: channel.sourceName,
          ...(channel.thumbnailUrl ? { thumbnailUrl: channel.thumbnailUrl } : {}),
        },
      });
    }

    const sources = await prisma.trackedSource.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      syncedChannelsCount: subscribedChannels.length,
      sources,
    };
  }

  /**
   * Disconnects a platform integration for a user.
   * @param {string} userId
   * @param {string} integrationId
   */
  async disconnectAccount(userId, integrationId) {
    const account = await prisma.connectedAccount.findFirst({
      where: { id: integrationId, userId },
    });

    if (!account) {
      const error = new Error('Connected account not found');
      error.status = 404;
      throw error;
    }

    await prisma.connectedAccount.delete({
      where: { id: integrationId },
    });

    return { success: true, message: `Successfully disconnected ${account.platform}` };
  }

  /**
   * Backfills recent videos for a specific tracked channel (or all tracked channels)
   * by fetching YouTube's public RSS feed. No API key required.
   * @param {string} userId
   * @param {string|null} channelId - if provided, only backfill this channel
   */
  async backfillChannelVideos(userId, channelId = null) {
    // Get channels to backfill — single or all tracked
    let channelIds;
    if (channelId) {
      // Verify user tracks this channel
      const source = await prisma.trackedSource.findFirst({
        where: { userId, sourceId: channelId, platform: 'youtube' },
        select: { sourceId: true },
      });
      if (!source) {
        const error = new Error('Channel not tracked by user');
        error.status = 403;
        throw error;
      }
      channelIds = [channelId];
    } else {
      const sources = await prisma.trackedSource.findMany({
        where: { userId, platform: 'youtube' },
        select: { sourceId: true },
      });
      channelIds = sources.map((s) => s.sourceId);
    }

    let totalUpserted = 0;
    for (const id of channelIds) {
      const result = await webSubService.backfillChannelFeed(id, { triggerPipeline: false });
      totalUpserted += result.upserted;
    }

    return { success: true, channelsProcessed: channelIds.length, videosUpserted: totalUpserted };
  }
}

module.exports = new IntegrationsService();

