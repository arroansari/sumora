const prisma = require('../../config/db');
const { encrypt, decrypt } = require('../../utils/encryption.util');
const { signOAuthState, verifyOAuthState } = require('../../utils/oauth.util');
const youTubeService = require('./youtube/youtube.service');
const webSubService = require('./youtube/websub.service');

class IntegrationsService {
  constructor() {
    // In-memory mutex map to deduplicate concurrent refresh calls per user
    this._refreshPromises = new Map();
  }

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
   * Generates YouTube OAuth connect URL with HMAC-signed state.
   * @param {string} userId
   * @returns {{authUrl: string}}
   */
  getYouTubeConnectUrl(userId) {
    const encodedState = signOAuthState({ userId, platform: 'youtube' });
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
   * Retrieves a decrypted, valid OAuth access token for a user, automatically refreshing
   * 5 minutes before expiration with concurrency locking, token rotation, and revocation handling.
   * Returns null if YouTube is not connected, revoked, or cannot be refreshed.
   * @param {string} userId
   * @returns {Promise<string|null>}
   */
  async getValidAccessToken(userId) {
    if (this._refreshPromises.has(userId)) {
      return this._refreshPromises.get(userId);
    }

    const refreshTask = (async () => {
      try {
        const account = await prisma.connectedAccount.findUnique({
          where: { userId_platform: { userId, platform: 'youtube' } },
          include: { token: true },
        });

        if (!account || !account.token || account.status === 'revoked') return null;

        let accessToken = decrypt(account.token.encryptedAccessToken);
        const FIVE_MINUTES_MS = 5 * 60 * 1000;
        const isExpiringSoon =
          account.token.expiresAt &&
          new Date(account.token.expiresAt).getTime() <= Date.now() + FIVE_MINUTES_MS;

        if (isExpiringSoon && account.token.encryptedRefreshToken) {
          try {
            const refreshed = await youTubeService.refreshAccessToken(account.token.encryptedRefreshToken);
            accessToken = refreshed.accessToken;

            const updateData = {
              encryptedAccessToken: encrypt(refreshed.accessToken),
              expiresAt: refreshed.expiresIn
                ? new Date(Date.now() + refreshed.expiresIn * 1000)
                : null,
            };

            if (refreshed.refreshToken) {
              updateData.encryptedRefreshToken = encrypt(refreshed.refreshToken);
            }

            await prisma.platformToken.update({
              where: { id: account.token.id },
              data: updateData,
            });
          } catch (refreshErr) {
            const isInvalidGrant =
              refreshErr.response?.data?.error === 'invalid_grant' ||
              refreshErr.message?.toLowerCase().includes('invalid_grant');

            if (isInvalidGrant) {
              console.warn(`[IntegrationsService] YouTube OAuth token revoked for user ${userId}. Marking status as revoked.`);
              await prisma.connectedAccount.update({
                where: { id: account.id },
                data: { status: 'revoked' },
              });
              return null;
            }

            console.error(`[IntegrationsService] Failed to refresh YouTube token for user ${userId}:`, refreshErr.message);
            if (account.token.expiresAt && new Date(account.token.expiresAt).getTime() > Date.now()) {
              return accessToken;
            }
            return null;
          }
        }

        return accessToken;
      } catch (err) {
        console.warn(`[IntegrationsService] Could not retrieve access token for ${userId}:`, err.message);
        return null;
      }
    })();

    this._refreshPromises.set(userId, refreshTask);
    try {
      return await refreshTask;
    } finally {
      this._refreshPromises.delete(userId);
    }
  }

  /**
   * Re-syncs the user's YouTube subscriptions (names + profile thumbnails)
   * using their stored encrypted OAuth tokens, refreshing if expired.
   * @param {string} userId
   */
  async syncYouTubeSubscriptions(userId) {
    const accessToken = await this.getValidAccessToken(userId);
    if (!accessToken) {
      const error = new Error('YouTube account is not connected or authorization has expired. Please reconnect YouTube in the app.');
      error.status = 401;
      throw error;
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
      // 1. Pre-distill the newest uploads in the background via RSS
      const result = await webSubService.backfillChannelFeed(id, { triggerPipeline: true });
      totalUpserted += result.upserted;

      // 2. Priority Summaries: Also trigger any existing uploads for this channel that are pending or failed
      const pendingVideos = await prisma.video.findMany({
        where: {
          channelId: id,
          summaryStatus: { in: ['pending', 'failed'] },
        },
        orderBy: { publishedAt: 'desc' },
        take: 3,
      });

      const inlinePipeline = require('../pipeline/inline-pipeline.service');
      for (const vid of pendingVideos) {
        inlinePipeline.fireAndForget({
          videoId: vid.videoId,
          channelId: vid.channelId,
          title: vid.title,
          videoUrl: vid.videoUrl,
        });
      }
    }

    return { success: true, channelsProcessed: channelIds.length, videosUpserted: totalUpserted };
  }
}

module.exports = new IntegrationsService();

