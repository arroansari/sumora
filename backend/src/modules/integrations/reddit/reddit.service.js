const prisma = require('../../../config/db');
const redditClient = require('./redditClient');
const publicRedditService = require('./redditService');
const summarizationService = require('../../ai/summarization.service');
const { encrypt } = require('../../../utils/encryption.util');
const { QUEUE_NAMES, getQueue } = require('../../../jobs');

class RedditService {
  /**
   * Track a new subreddit for a user
   */
  async addTrackedSubreddit(userId, subredditName) {
    const cleanSub = subredditName.replace(/^r\//i, '').trim();
    if (!cleanSub) {
      throw new Error('A valid subreddit name is required');
    }

    // Fetch subreddit metadata from Reddit
    const info = await redditClient.getSubredditInfo(cleanSub);

    const source = await prisma.trackedSource.upsert({
      where: {
        userId_platform_sourceId: {
          userId,
          platform: 'reddit',
          sourceId: cleanSub.toLowerCase(),
        },
      },
      create: {
        userId,
        platform: 'reddit',
        sourceId: cleanSub.toLowerCase(),
        sourceName: `r/${cleanSub}`,
        thumbnailUrl: info.avatarUrl || 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png',
        memberCount: info.subscribers || 0,
        isActive: true,
        isPriority: false,
      },
      update: {
        isActive: true,
        memberCount: info.subscribers || undefined,
        thumbnailUrl: info.avatarUrl || undefined,
      },
    });

    // Kick off immediate sync of top posts in background
    this.syncSubredditPosts(cleanSub, 5).catch((err) => {
      console.warn(`[RedditService] Background sync error for r/${cleanSub}:`, err.message);
    });

    return source;
  }

  /**
   * List all tracked subreddits for a user
   */
  async listTrackedSubreddits(userId) {
    let sources = await prisma.trackedSource.findMany({
      where: {
        userId,
        platform: 'reddit',
      },
      orderBy: { createdAt: 'desc' },
    });

    // If user has no subreddits tracked yet, seed default high-value subreddits
    if (sources.length === 0) {
      const defaults = ['technology', 'stocks', 'artificial'];
      for (const def of defaults) {
        try {
          await this.addTrackedSubreddit(userId, def);
        } catch {}
      }
      sources = await prisma.trackedSource.findMany({
        where: {
          userId,
          platform: 'reddit',
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return sources;
  }

  /**
   * Toggle mute / active status of a tracked subreddit
   */
  async toggleSubreddit(userId, sourceId) {
    const cleanSub = sourceId.replace(/^r\//i, '').toLowerCase().trim();
    const existing = await prisma.trackedSource.findFirst({
      where: {
        userId,
        platform: 'reddit',
        sourceId: cleanSub,
      },
    });

    if (!existing) {
      throw new Error(`Subreddit r/${cleanSub} not found for this user`);
    }

    const updated = await prisma.trackedSource.update({
      where: { id: existing.id },
      data: { isActive: !existing.isActive },
    });

    return updated;
  }

  /**
   * Remove a tracked subreddit
   */
  async removeTrackedSubreddit(userId, sourceId) {
    const cleanSub = sourceId.replace(/^r\//i, '').toLowerCase().trim();
    await prisma.trackedSource.deleteMany({
      where: {
        userId,
        platform: 'reddit',
        sourceId: cleanSub,
      },
    });
    return { success: true, message: `Removed r/${cleanSub}` };
  }

  /**
   * Sync top posts for a subreddit and generate debate summaries
   */
  async syncSubredditPosts(subreddit, limit = 10) {
    const cleanSub = subreddit.replace(/^r\//i, '').trim();
    console.log(`[RedditService] Syncing top posts from r/${cleanSub} using public Reddit .json service...`);

    let posts = [];
    try {
      posts = await publicRedditService.getTopDailyPosts(cleanSub, limit);
    } catch (err) {
      console.warn(`[RedditService] Fetch posts notice for r/${cleanSub}:`, err.message);
      posts = await redditClient.fetchTopPosts(cleanSub, 'day', limit).catch(() => []);
    }

    const savedPosts = [];
    for (const post of posts) {
      try {
        const saved = await prisma.redditPost.upsert({
          where: { externalId: post.externalId },
          create: {
            externalId: post.externalId,
            subreddit: cleanSub.toLowerCase(),
            title: post.title,
            author: post.author,
            permalink: post.permalink,
            url: post.url || post.permalink,
            score: post.upvotes ?? post.score ?? 0,
            commentCount: post.commentCount ?? 0,
            selftext: post.selftext || '',
            publishedAt: post.publishedAt || new Date(),
          },
          update: {
            score: post.upvotes ?? post.score ?? 0,
            commentCount: post.commentCount ?? 0,
            selftext: post.selftext || '',
          },
        });
        savedPosts.push(saved);

        // Check if summary already exists
        const existingSummary = await prisma.redditSummary.findUnique({
          where: { postId: post.externalId },
        });

        if (!existingSummary) {
          // Fetch top comments & generate AI summary
          let comments = await publicRedditService.getThreadComments(cleanSub, post.externalId, 20);
          if (!comments || comments.length === 0) {
            comments = await redditClient.fetchThreadComments(cleanSub, post.externalId, 15).catch(() => []);
          }

          await summarizationService.generateRedditSummary({
            postId: post.externalId,
            title: post.title,
            author: post.author,
            subreddit: cleanSub,
            selftext: post.selftext,
            comments,
          });
        }
      } catch (postErr) {
        console.warn(`[RedditService] Error processing post ${post.externalId}:`, postErr.message);
      }
    }

    return savedPosts;
  }

  /**
   * Get Reddit Feed (paginated, filtered)
   */
  async getRedditFeed(userId, { page = 1, limit = 20, subreddit = null, filter = 'all', search = null }) {
    const skip = (page - 1) * limit;

    // Check tracked subreddits
    const tracked = await this.listTrackedSubreddits(userId);
    const activeSubreddits = tracked.filter((s) => s.isActive).map((s) => s.sourceId.toLowerCase());

    const where = {};

    if (subreddit && subreddit !== 'all') {
      where.subreddit = { equals: subreddit.replace(/^r\//i, '').toLowerCase(), mode: 'insensitive' };
    } else if (activeSubreddits.length > 0) {
      where.subreddit = { in: activeSubreddits, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { selftext: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, posts] = await Promise.all([
      prisma.redditPost.count({ where }),
      prisma.redditPost.findMany({
        where,
        include: {
          summary: true,
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    let returnedPosts = posts;
    // If no posts exist yet in DB for active subreddits, ingest immediately so user gets live feed
    if (returnedPosts.length === 0 && activeSubreddits.length > 0) {
      await this.syncSubredditPosts(activeSubreddits[0], 5).catch(() => {});
      returnedPosts = await prisma.redditPost.findMany({
        where,
        include: { summary: true },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      });
      // also kick off background sync for the rest
      for (const sub of activeSubreddits.slice(1)) {
        this.syncSubredditPosts(sub, 5).catch(() => {});
      }
    }

    const formattedPosts = returnedPosts.map((p) => {
      const summary = p.summary
        ? {
            ...p.summary,
            takeaways: p.summary.keyTakeaways || [],
          }
        : null;
      return {
        ...p,
        summary,
      };
    });

    return {
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total: Math.max(total, formattedPosts.length),
        totalPages: Math.ceil(Math.max(total, formattedPosts.length) / limit) || 1,
      },
    };
  }

  /**
   * Get or generate summary for a Reddit post
   */
  async getPostSummary(postId) {
    let summary = await prisma.redditSummary.findUnique({
      where: { postId },
      include: { post: true },
    });

    if (!summary) {
      const post = await prisma.redditPost.findUnique({
        where: { externalId: postId },
      });
      if (!post) {
        throw new Error('Reddit post not found');
      }

      const comments = await redditClient.fetchThreadComments(post.subreddit, post.externalId, 15);
      summary = await summarizationService.generateRedditSummary({
        postId: post.externalId,
        title: post.title,
        author: post.author,
        subreddit: post.subreddit,
        selftext: post.selftext,
        comments,
      });
    }

    return summary;
  }

  /**
   * Generates Reddit connect authorization URL
   */
  getConnectUrl(userId) {
    return redditClient.getConnectUrl(userId);
  }

  /**
   * Handles Reddit OAuth Authorization Code callback:
   * 1. Exchanges auth code for access & refresh tokens
   * 2. Encrypts tokens with AES-256-GCM
   * 3. Upserts ConnectedAccount and PlatformToken
   * 4. Fetches subscribed subreddits and syncs TrackedSources
   * @param {string} userId
   * @param {string} code
   * @param {string} [redirectUri]
   */
  async handleRedditCallback(userId, code, redirectUri = null) {
    const tokenData = await redditClient.exchangeAuthCode(code, redirectUri);
    const profile = await redditClient.getUserProfile(tokenData.accessToken);

    const encryptedAccessToken = encrypt(tokenData.accessToken);
    const encryptedRefreshToken = tokenData.refreshToken ? encrypt(tokenData.refreshToken) : null;
    const expiresAt = tokenData.expiresIn
      ? new Date(Date.now() + tokenData.expiresIn * 1000)
      : null;

    // Upsert ConnectedAccount for Reddit
    const connectedAccount = await prisma.connectedAccount.upsert({
      where: {
        userId_platform: {
          userId,
          platform: 'reddit',
        },
      },
      create: {
        userId,
        platform: 'reddit',
        platformUserId: profile.name,
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
        platformUserId: profile.name,
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

    // Automatically sync subscribed subreddits
    let subreddits = [];
    try {
      subreddits = await redditClient.getUserSubscribedSubreddits(tokenData.accessToken);
      for (const sub of subreddits) {
        const cleanSub = sub.name.toLowerCase();
        await prisma.trackedSource.upsert({
          where: {
            userId_platform_sourceId: {
              userId,
              platform: 'reddit',
              sourceId: cleanSub,
            },
          },
          create: {
            userId,
            platform: 'reddit',
            sourceId: cleanSub,
            sourceName: `r/${sub.name}`,
            thumbnailUrl: sub.iconImg || 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png',
            memberCount: sub.subscribers || 0,
            isActive: true,
            isPriority: false,
          },
          update: {
            isActive: true,
            memberCount: sub.subscribers || undefined,
            thumbnailUrl: sub.iconImg || undefined,
          },
        });

        // Trigger background sync for top posts in that subreddit
        this.syncSubredditPosts(cleanSub, 5).catch(() => {});
      }
    } catch (subErr) {
      console.warn('[RedditService] Subscribed subreddits auto-import warning:', subErr.message);
    }

    return {
      connectedAccount,
      profile,
      importedSubredditsCount: subreddits.length,
    };
  }
}

module.exports = new RedditService();

