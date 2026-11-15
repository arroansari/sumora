const axios = require('axios');
const config = require('../../../config');

class RedditClient {
  constructor() {
    this.clientId = config.reddit.clientId;
    this.clientSecret = config.reddit.clientSecret;
    this.userAgent = config.reddit.userAgent || 'Sumora/1.0.0 (by /u/sumora_app)';
    this.accessToken = null;
    this.tokenExpiresAt = 0;
  }

  /**
   * Acquire or return cached OAuth access token via Client Credentials Script App flow
   */
  async getAccessToken() {
    if (!this.clientId || !this.clientSecret) {
      return null;
    }

    const now = Date.now();
    // Return cached token if valid for at least another 60 seconds
    if (this.accessToken && this.tokenExpiresAt > now + 60000) {
      return this.accessToken;
    }

    try {
      const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const response = await axios.post(
        'https://www.reddit.com/api/v1/access_token',
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': this.userAgent,
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        const expiresInSec = response.data.expires_in || 3600;
        this.tokenExpiresAt = now + expiresInSec * 1000;
        return this.accessToken;
      }
    } catch (err) {
      console.warn('[RedditClient] OAuth token request failed, falling back to public JSON:', err.message);
    }
    return null;
  }

  /**
   * Fetch top posts from a given subreddit
   * @param {string} subreddit - Name of subreddit (e.g. 'technology' or 'r/technology')
   * @param {string} timeWindow - 'day', 'week', 'month', 'year', 'all'
   * @param {number} limit - Number of posts to fetch
   */
  async fetchTopPosts(subreddit, timeWindow = 'day', limit = 10) {
    const cleanSub = subreddit.replace(/^r\//i, '').trim();
    const token = await this.getAccessToken();

    let url = '';
    const headers = { 'User-Agent': this.userAgent };

    if (token) {
      url = `https://oauth.reddit.com/r/${cleanSub}/top?t=${timeWindow}&limit=${limit}`;
      headers.Authorization = `Bearer ${token}`;
    } else {
      url = `https://www.reddit.com/r/${cleanSub}/top.json?t=${timeWindow}&limit=${limit}`;
    }

    try {
      const res = await axios.get(url, { headers, timeout: 12000 });
      const children = res.data?.data?.children || [];

      return children.map((child) => {
        const d = child.data;
        return {
          externalId: d.name || `t3_${d.id}`,
          postId: d.id,
          title: d.title,
          author: d.author,
          subreddit: d.subreddit,
          permalink: d.permalink.startsWith('http') ? d.permalink : `https://www.reddit.com${d.permalink}`,
          url: d.url,
          score: d.score || 0,
          commentCount: d.num_comments || 0,
          selftext: d.selftext || '',
          publishedAt: new Date(d.created_utc * 1000),
        };
      });
    } catch (error) {
      console.error(`[RedditClient] Error fetching top posts from r/${cleanSub}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch top comments for a thread, filtering out deleted/AutoMod comments
   * @param {string} subreddit 
   * @param {string} postId 
   * @param {number} limit 
   */
  async fetchThreadComments(subreddit, postId, limit = 20) {
    const cleanSub = subreddit.replace(/^r\//i, '').trim();
    const cleanPostId = postId.replace(/^t3_/i, '').trim();
    const token = await this.getAccessToken();

    let url = '';
    const headers = { 'User-Agent': this.userAgent };

    if (token) {
      url = `https://oauth.reddit.com/r/${cleanSub}/comments/${cleanPostId}?limit=${limit}&depth=2&sort=top`;
      headers.Authorization = `Bearer ${token}`;
    } else {
      url = `https://www.reddit.com/r/${cleanSub}/comments/${cleanPostId}.json?limit=${limit}&depth=2&sort=top`;
    }

    try {
      const res = await axios.get(url, { headers, timeout: 12000 });
      // Reddit returns an array of two listings: [postListing, commentsListing]
      const commentsListing = res.data?.[1]?.data?.children || [];

      const filteredComments = [];
      for (const item of commentsListing) {
        if (item.kind !== 't1') continue;
        const c = item.data;
        if (!c.body || c.body === '[deleted]' || c.body === '[removed]') continue;
        if (c.author === 'AutoModerator') continue;

        filteredComments.push({
          id: c.id,
          author: c.author,
          body: c.body,
          score: c.score || 0,
          createdUtc: c.created_utc,
        });

        if (filteredComments.length >= limit) break;
      }

      return filteredComments;
    } catch (error) {
      console.error(`[RedditClient] Error fetching comments for ${cleanPostId}:`, error.message);
      return [];
    }
  }

  /**
   * Fetch subreddit metadata (subscriber count, description, icon)
   */
  async getSubredditInfo(subreddit) {
    const cleanSub = subreddit.replace(/^r\//i, '').trim();
    const token = await this.getAccessToken();

    let url = '';
    const headers = { 'User-Agent': this.userAgent };

    if (token) {
      url = `https://oauth.reddit.com/r/${cleanSub}/about`;
      headers.Authorization = `Bearer ${token}`;
    } else {
      url = `https://www.reddit.com/r/${cleanSub}/about.json`;
    }

    try {
      const res = await axios.get(url, { headers, timeout: 10000 });
      const d = res.data?.data || {};
      const icon = d.community_icon || d.icon_img || '';
      // Clean icon url if HTML encoded
      const cleanIcon = icon ? icon.split('?')[0].replace(/&amp;/g, '&') : null;

      return {
        subreddit: cleanSub,
        displayName: d.display_name_prefixed || `r/${cleanSub}`,
        title: d.title || cleanSub,
        subscribers: d.subscribers || 0,
        description: d.public_description || '',
        avatarUrl: cleanIcon,
      };
    } catch (error) {
      console.warn(`[RedditClient] Could not fetch about info for r/${cleanSub}:`, error.message);
      return {
        subreddit: cleanSub,
        displayName: `r/${cleanSub}`,
        title: cleanSub,
        subscribers: 0,
        description: '',
        avatarUrl: null,
      };
    }
  }

  /**
   * Generates the Reddit OAuth authorization URL
   * @param {string} userId - Current user ID to persist in state parameter
   * @param {string} [customRedirectUri] - Optional override redirect URI
   */
  getConnectUrl(userId, customRedirectUri = null) {
    const redirectUri = customRedirectUri || config.reddit.redirectUri || 'http://localhost:5000/api/auth/reddit/callback';
    const stateObj = { userId: userId || 'anonymous', timestamp: Date.now() };
    const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');
    const scope = 'identity,mysubreddits,read';
    const clientId = this.clientId || 'MOCK_CLIENT_ID';

    const url = `https://www.reddit.com/api/v1/authorize?client_id=${encodeURIComponent(
      clientId
    )}&response_type=code&state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&duration=permanent&scope=${encodeURIComponent(scope)}`;

    return { url, state };
  }

  /**
   * Exchanges authorization code for Reddit access and refresh tokens
   * @param {string} code - OAuth authorization code
   * @param {string} [customRedirectUri]
   */
  async exchangeAuthCode(code, customRedirectUri = null) {
    const redirectUri = customRedirectUri || config.reddit.redirectUri || 'http://localhost:5000/api/auth/reddit/callback';
    if (!this.clientId || !this.clientSecret) {
      console.warn('[RedditClient] REDDIT_CLIENT_ID or REDDIT_CLIENT_SECRET missing, simulating development token exchange');
      return {
        accessToken: `reddit_dev_token_${Date.now()}`,
        refreshToken: `reddit_dev_refresh_${Date.now()}`,
        expiresIn: 3600,
        scope: 'identity,mysubreddits,read',
        tokenType: 'bearer',
      };
    }

    const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const response = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      params.toString(),
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': this.userAgent,
        },
        timeout: 10000,
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in || 3600,
      scope: response.data.scope,
      tokenType: response.data.token_type,
    };
  }

  /**
   * Fetches authenticated user's Reddit profile details
   * @param {string} userAccessToken
   */
  async getUserProfile(userAccessToken) {
    if (!userAccessToken || userAccessToken.startsWith('reddit_dev_token')) {
      return {
        id: 'reddit_dev_user',
        name: 'sumora_user',
        iconImg: 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_2.png',
        totalKarma: 1337,
      };
    }

    const response = await axios.get('https://oauth.reddit.com/api/v1/me', {
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
        'User-Agent': this.userAgent,
      },
      timeout: 10000,
    });

    const data = response.data || {};
    return {
      id: data.id || 'reddit_user',
      name: data.name || 'Reddit User',
      iconImg: data.icon_img ? data.icon_img.split('?')[0] : null,
      totalKarma: data.total_karma || 0,
    };
  }

  /**
   * Fetches the subreddits the authenticated user is subscribed to
   * @param {string} userAccessToken
   */
  async getUserSubscribedSubreddits(userAccessToken) {
    if (!userAccessToken || userAccessToken.startsWith('reddit_dev_token')) {
      return [
        { name: 'technology', title: 'Technology', subscribers: 16000000 },
        { name: 'stocks', title: 'Stocks News & Debate', subscribers: 7000000 },
        { name: 'artificial', title: 'Artificial Intelligence', subscribers: 850000 },
      ];
    }

    try {
      const response = await axios.get(
        'https://oauth.reddit.com/subreddits/mine/subscriber?limit=100',
        {
          headers: {
            Authorization: `Bearer ${userAccessToken}`,
            'User-Agent': this.userAgent,
          },
          timeout: 10000,
        }
      );

      const items = response.data?.data?.children || [];
      return items.map((c) => ({
        name: c.data.display_name,
        title: c.data.title || c.data.display_name,
        subscribers: c.data.subscribers || 0,
        iconImg: c.data.community_icon ? c.data.community_icon.split('?')[0] : c.data.icon_img,
      }));
    } catch (err) {
      console.warn('[RedditClient] Could not fetch subscribed subreddits:', err.message);
      return [];
    }
  }
}

module.exports = new RedditClient();

