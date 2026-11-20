const axios = require('axios');
const config = require('../../../config');
const { encrypt, decrypt } = require('../../../utils/encryption.util');

const GOOGLE_AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'openid',
  'email',
  'profile',
].join(' ');

class YouTubeService {
  /**
   * Generates the Google OAuth 2.0 authorization URL.
   * @param {string} state - CSRF state or encrypted session token
   * @returns {string} Google authorization URL
   */
  getAuthUrl(state) {
    if (!config.google.clientId) {
      throw new Error('GOOGLE_CLIENT_ID is not configured in backend environment');
    }

    const params = new URLSearchParams({
      client_id: config.google.clientId,
      redirect_uri: config.google.redirectUri,
      response_type: 'code',
      scope: YOUTUBE_SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state: state || '',
    });

    return `${GOOGLE_AUTH_BASE}?${params.toString()}`;
  }

  /**
   * Exchanges an authorization code for access and refresh tokens.
   * @param {string} code - OAuth authorization code
   * @returns {Promise<{accessToken: string, refreshToken: string, expiresIn: number}>}
   */
  async exchangeCode(code) {
    const response = await axios.post(
      GOOGLE_TOKEN_URL,
      new URLSearchParams({
        code,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: config.google.redirectUri,
        grant_type: 'authorization_code',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    return {
      accessToken: access_token,
      refreshToken: refresh_token || null,
      expiresIn: expires_in,
    };
  }

  /**
   * Refreshes an expired access token using the stored encrypted refresh token.
   * @param {string} encryptedRefreshToken
   * @returns {Promise<{accessToken: string, expiresIn: number, refreshToken: string|null}>}
   */
  async refreshAccessToken(encryptedRefreshToken) {
    const refreshToken = decrypt(encryptedRefreshToken);
    if (!refreshToken) {
      throw new Error('Cannot refresh token: refresh token is missing or empty');
    }

    const response = await axios.post(
      GOOGLE_TOKEN_URL,
      new URLSearchParams({
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in,
      refreshToken: response.data.refresh_token || null,
    };
  }

  /**
   * Fetches Google / YouTube profile info for the authenticated user.
   * @param {string} accessToken
   * @returns {Promise<{platformUserId: string, email: string, name: string}>}
   */
  async getProfile(accessToken) {
    const response = await axios.get(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      platformUserId: response.data.id,
      email: response.data.email,
      name: response.data.name,
    };
  }

  /**
   * Retrieves all subscribed YouTube channels for the authenticated user with pagination.
   * @param {string} accessToken
   * @returns {Promise<Array<{sourceId: string, sourceName: string, description: string, thumbnailUrl: string}>>}
   */
  async getSubscribedChannels(accessToken) {
    const channels = [];
    let pageToken = null;

    do {
      const url = new URL(`${YOUTUBE_API_BASE}/subscriptions`);
      url.searchParams.set('part', 'snippet,contentDetails');
      url.searchParams.set('mine', 'true');
      url.searchParams.set('maxResults', '50');
      if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
      }

      const response = await axios.get(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const items = response.data.items || [];
      for (const item of items) {
        const snippet = item.snippet;
        if (snippet && snippet.resourceId && snippet.resourceId.channelId) {
          channels.push({
            sourceId: snippet.resourceId.channelId,
            sourceName: snippet.title || 'Unknown Channel',
            description: snippet.description || '',
            thumbnailUrl: snippet.thumbnails?.default?.url || snippet.thumbnails?.medium?.url || null,
          });
        }
      }

      pageToken = response.data.nextPageToken || null;
    } while (pageToken);

    return channels;
  }

  /**
   * Fetches latest uploads for a channel using YouTube Data API v3 playlistItems.
   * Every channel's upload playlist ID is 'UU' + channelId.slice(2).
   * @param {string} channelId
   * @param {string} accessToken
   * @param {number} maxResults
   */
  async getChannelUploads(channelId, accessToken, maxResults = 5) {
    if (!channelId || !channelId.startsWith('UC')) return [];
    const uploadPlaylistId = 'UU' + channelId.slice(2);

    try {
      const response = await axios.get(`${YOUTUBE_API_BASE}/playlistItems`, {
        params: {
          part: 'snippet',
          playlistId: uploadPlaylistId,
          maxResults,
        },
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 8000,
      });

      const items = response.data.items || [];
      return items.map((item) => ({
        videoId: item.snippet.resourceId.videoId,
        channelId,
        title: item.snippet.title,
        videoUrl: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        thumbnailUrl:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.medium?.url ||
          `https://i.ytimg.com/vi/${item.snippet.resourceId.videoId}/hqdefault.jpg`,
        publishedAt: item.snippet.publishedAt,
      }));
    } catch (err) {
      console.warn(`[YouTubeService] playlistItems lookup note for ${channelId}:`, err.message);
      return [];
    }
  }

  /**
   * Scrapes and extracts the Top N most popular videos for any YouTube channel.
   * Uses YouTube's public sort=p feed without requiring OAuth quotas.
   * @param {string} channelId - Channel ID (UC...) or handle (@...)
   * @param {number} maxResults - Number of popular videos (default 10)
   * @returns {Promise<Array<{videoId: string, channelId: string, title: string, videoUrl: string, thumbnailUrl: string}>>}
   */
  async getPopularVideos(channelId, maxResults = 10) {
    if (!channelId) return [];

    const url = channelId.startsWith('@')
      ? `https://www.youtube.com/${channelId}/videos?view=0&sort=p`
      : `https://www.youtube.com/channel/${channelId}/videos?view=0&sort=p`;

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 10000,
      });

      const match =
        response.data.match(/ytInitialData\s*=\s*({.+?});<\/script>/s) ||
        response.data.match(/var ytInitialData = ({.+?});/s);

      if (!match) {
        console.warn(`[YouTubeService] ytInitialData not found for ${channelId}`);
        return [];
      }

      const json = JSON.parse(match[1]);
      const popularVideos = [];

      function extract(obj) {
        if (!obj || typeof obj !== 'object') return;

        // Modern 2025/2026 YouTube lockupViewModel
        if (obj.lockupViewModel && obj.lockupViewModel.contentId) {
          const lm = obj.lockupViewModel;
          const videoId = lm.contentId;
          const title =
            lm.metadata?.lockupMetadataViewModel?.title?.content ||
            lm.rendererContext?.accessibilityContext?.label ||
            'Untitled Video';
          const thumb =
            lm.contentImage?.thumbnailViewModel?.image?.sources?.slice(-1)[0]?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          if (videoId.length === 11 && !popularVideos.some((v) => v.videoId === videoId)) {
            popularVideos.push({
              videoId,
              channelId,
              title,
              videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
              thumbnailUrl: thumb,
              publishedAt: new Date(0),
            });
          }
          return;
        }

        // Classic videoRenderer fallback
        if (obj.videoRenderer && obj.videoRenderer.videoId) {
          const vr = obj.videoRenderer;
          const videoId = vr.videoId;
          const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText || 'Untitled Video';
          const thumb =
            vr.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          if (videoId.length === 11 && !popularVideos.some((v) => v.videoId === videoId)) {
            popularVideos.push({
              videoId,
              channelId,
              title,
              videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
              thumbnailUrl: thumb,
              publishedAt: new Date(0),
            });
          }
          return;
        }

        for (const k of Object.keys(obj)) {
          extract(obj[k]);
        }
      }

      extract(json);
      return popularVideos.slice(0, maxResults);
    } catch (err) {
      console.warn(`[YouTubeService] Failed to fetch popular videos for ${channelId}:`, err.message);
      return [];
    }
  }

  /**
   * Searches YouTube videos globally or by channel using public YouTube search.
   * Consumes ZERO Google OAuth quota.
   * @param {string} query - Keyword search query
   * @param {number} maxResults - Max number of results (default 15)
   * @returns {Promise<Array<{videoId: string, channelId: string, channelName: string, title: string, videoUrl: string, thumbnailUrl: string, duration: string, publishedTime: string}>>}
   */
  async searchVideos(query, maxResults = 15) {
    if (!query || !query.trim()) return [];

    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`;

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 10000,
      });

      const match =
        response.data.match(/ytInitialData\s*=\s*({.+?});<\/script>/s) ||
        response.data.match(/var ytInitialData = ({.+?});/s);

      if (!match) {
        console.warn(`[YouTubeService] ytInitialData not found for search: "${query}"`);
        return [];
      }

      const json = JSON.parse(match[1]);
      const results = [];

      function extract(obj) {
        if (!obj || typeof obj !== 'object') return;

        // Classic videoRenderer
        if (obj.videoRenderer && obj.videoRenderer.videoId) {
          const vr = obj.videoRenderer;
          const videoId = vr.videoId;
          const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText || 'Untitled Video';
          const channelName =
            vr.ownerText?.runs?.[0]?.text ||
            vr.shortBylineText?.runs?.[0]?.text ||
            'YouTube Creator';
          const channelId =
            vr.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
            vr.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
            '';
          const publishedTime = vr.publishedTimeText?.simpleText || '';
          const duration = vr.lengthText?.simpleText || '';
          const thumb =
            vr.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          if (videoId.length === 11 && !results.some((r) => r.videoId === videoId)) {
            results.push({
              videoId,
              channelId,
              channelName,
              title,
              videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
              thumbnailUrl: thumb,
              duration,
              publishedTime,
            });
          }
          return;
        }

        // Modern lockupViewModel
        if (obj.lockupViewModel && obj.lockupViewModel.contentId) {
          const lm = obj.lockupViewModel;
          const videoId = lm.contentId;
          const title =
            lm.metadata?.lockupMetadataViewModel?.title?.content ||
            lm.rendererContext?.accessibilityContext?.label ||
            'Untitled Video';
          const thumb =
            lm.contentImage?.thumbnailViewModel?.image?.sources?.slice(-1)[0]?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          if (videoId.length === 11 && !results.some((r) => r.videoId === videoId)) {
            results.push({
              videoId,
              channelId: '',
              channelName: 'YouTube Creator',
              title,
              videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
              thumbnailUrl: thumb,
              duration: '',
              publishedTime: '',
            });
          }
          return;
        }

        for (const k of Object.keys(obj)) {
          extract(obj[k]);
        }
      }

      extract(json);
      return results.slice(0, maxResults);
    } catch (err) {
      console.warn(`[YouTubeService] Failed to search YouTube for "${query}":`, err.message);
      return [];
    }
  }
}

module.exports = new YouTubeService();

