const prisma = require('../../../config/db');
const redditClient = require('./redditClient');
const summarizationService = require('../../ai/summarization.service');
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
    console.log(`[RedditService] Syncing top posts from r/${cleanSub}...`);

    let posts = [];
    try {
      posts = await redditClient.fetchTopPosts(cleanSub, 'day', limit);
    } catch (err) {
      console.warn(`[RedditService] Fetch posts failed for r/${cleanSub}:`, err.message);
      return [];
    }

    const savedPosts = [];
    for (const post of posts) {
      try {
        const saved = await prisma.redditPost.upsert({
          where: { externalId: post.externalId },
          create: {
            externalId: post.externalId,
            subreddit: post.subreddit,
            title: post.title,
            author: post.author,
            permalink: post.permalink,
            url: post.url,
            score: post.score,
            commentCount: post.commentCount,
            selftext: post.selftext,
            publishedAt: post.publishedAt,
          },
          update: {
            score: post.score,
            commentCount: post.commentCount,
            selftext: post.selftext,
          },
        });
        savedPosts.push(saved);

        // Check if summary already exists
        const existingSummary = await prisma.redditSummary.findUnique({
          where: { postId: post.externalId },
        });

        if (!existingSummary) {
          // Fetch top comments & generate summary
          const comments = await redditClient.fetchThreadComments(cleanSub, post.postId, 15);
          await summarizationService.generateRedditSummary({
            postId: post.externalId,
            title: post.title,
            author: post.author,
            subreddit: post.subreddit,
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

    // If no posts exist yet in DB for active subreddits, trigger background sync and return starter items
    if (posts.length === 0 && activeSubreddits.length > 0) {
      for (const sub of activeSubreddits.slice(0, 2)) {
        this.syncSubredditPosts(sub, 5).catch(() => {});
      }
    }

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
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
}

module.exports = new RedditService();

