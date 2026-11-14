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
   * @returns {Promise<{accessToken: string, expiresIn: number}>}
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
}

module.exports = new YouTubeService();

