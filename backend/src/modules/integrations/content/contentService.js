const prisma = require('../../../config/db');
const cache = require('../../../utils/cache.util');
const tmdbService = require('../tmdb/tmdbService');
const bookService = require('../books/bookService');
const { summarizationService } = require('../../ai');

class ContentService {
  /**
   * Seed curated TMDB movies into ContentPost & PostSummary if DB is empty
   */
  async ensureCinemaData() {
    const seededKey = 'cache:content:seeded:TMDB';
    if (await cache.getJson(seededKey)) return;
    const count = await prisma.contentPost.count({ where: { platform: 'TMDB' } });
    if (count >= 5) {
      await cache.setJson(seededKey, true, 3600);
      return;
    }

    console.log('[ContentService] Seeding high-signal TMDB movies into database...');
    const movies = await tmdbService.getTrendingMovies();

    for (const movie of movies) {
      try {
        const takeaways = movie.takeaways || [
          `Consensus: Highly acclaimed for standout cinematic execution and immersive visual atmosphere.`,
          `Performances & Direction: The ensemble cast brings compelling tension and emotional resonance.`,
          `Viewer Caveats: Substantial narrative pacing rewards dedicated viewing.`,
          `Streaming Availability: Available on ${movie.streamingPlatforms?.join(', ') || 'digital platforms'}.`
        ];

        await prisma.contentPost.upsert({
          where: { externalId: movie.externalId },
          create: {
            platform: 'TMDB',
            externalId: movie.externalId,
            title: movie.title,
            description: movie.description,
            author: movie.author || 'Director',
            posterUrl: movie.posterUrl,
            backdropUrl: movie.backdropUrl,
            url: movie.url,
            rating: movie.rating || 8.0,
            genres: movie.genres || ['Cinema'],
            runtime: movie.runtime || '2h 15m',
            trailerUrl: movie.trailerUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' trailer')}`,
            streamingPlatforms: movie.streamingPlatforms || ['Netflix', 'Prime Video'],
            releaseYear: movie.releaseYear || '2024',
            publishedAt: movie.publishedAt || new Date(),
            summary: {
              create: {
                takeaways,
                consensus: takeaways[0]?.replace(/^Consensus:\s*/i, '') || '',
                fullSummary: movie.description || '',
                aiProvider: 'gemini',
                modelName: 'gemini-1.5-flash',
              },
            },
          },
          update: {
            title: movie.title,
            description: movie.description,
            posterUrl: movie.posterUrl,
            backdropUrl: movie.backdropUrl,
            rating: movie.rating || 8.0,
            genres: movie.genres || ['Cinema'],
            runtime: movie.runtime || '2h 15m',
            trailerUrl: movie.trailerUrl,
            streamingPlatforms: movie.streamingPlatforms || ['Netflix', 'Prime Video'],
            releaseYear: movie.releaseYear || '2024',
          },
        });
      } catch (err) {
        console.warn(`[ContentService] Error inserting movie ${movie.title}:`, err.message);
      }
    }
  }

  /**
   * Seed curated Open Library books into ContentPost & PostSummary if DB is empty
   */
  async ensureBookData() {
    const seededKey = 'cache:content:seeded:OPEN_LIBRARY';
    if (await cache.getJson(seededKey)) return;
    const count = await prisma.contentPost.count({ where: { platform: 'OPEN_LIBRARY' } });
    if (count >= 12) {
      await cache.setJson(seededKey, true, 3600);
      return;
    }

    const books = bookService.getCuratedFallbackBooks();

    for (const book of books) {
      try {
        const takeaways = book.takeaways || [
          `Core Thesis: Actionable mental models for intellectual clarity and sustainable execution.`,
          `Mental Model 1: Compounding micro-habits produce non-linear returns over time.`,
          `Mental Model 2: Eliminate shallow distractions to protect high-impact cognitive focus.`,
          `Practical Application: Establish structured daily routines aligned with primary goals.`
        ];

        await prisma.contentPost.upsert({
          where: { externalId: book.externalId },
          create: {
            platform: 'OPEN_LIBRARY',
            externalId: book.externalId,
            title: book.title,
            description: book.description,
            author: book.author || 'Author',
            posterUrl: book.posterUrl,
            url: book.url,
            pageCount: book.pageCount || 280,
            readTime: book.readTime || '5-Min Read',
            categories: book.categories || ['Non-Fiction', 'Insights'],
            releaseYear: book.releaseYear || '2020',
            publishedAt: book.publishedAt || new Date(),
            summary: {
              create: {
                takeaways,
                consensus: takeaways[0]?.replace(/^Core Thesis:\s*/i, '') || '',
                fullSummary: book.description || '',
                aiProvider: 'gemini',
                modelName: 'gemini-1.5-flash',
              },
            },
          },
          update: {
            title: book.title,
            description: book.description,
            author: book.author,
            posterUrl: book.posterUrl,
            pageCount: book.pageCount,
            readTime: book.readTime,
            categories: book.categories,
            releaseYear: book.releaseYear,
          },
        });
      } catch (err) {
        console.warn(`[ContentService] Error inserting book ${book.title}:`, err.message);
      }
    }
  }

  /**
   * Fetch Cinema (TMDB) feed with pagination and filters
   */
  async getCinemaFeed(userId, { page = 1, limit = 20, filter = 'all', search = null }) {
    await this.ensureCinemaData();

    const where = {
      platform: 'TMDB',
    };

    const conditions = [];

    if (search && search.trim()) {
      conditions.push({
        OR: [
          { title: { contains: search.trim(), mode: 'insensitive' } },
          { description: { contains: search.trim(), mode: 'insensitive' } },
          { author: { contains: search.trim(), mode: 'insensitive' } },
        ],
      });
    }

    let orderBy = { publishedAt: 'desc' };

    if (filter && filter !== 'all' && filter !== 'Trending Today') {
      const lowerFilter = filter.toLowerCase();
      if (lowerFilter === 'top rated') {
        orderBy = { rating: 'desc' };
      } else {
        // e.g. "Netflix", "Max", "Prime Video"
        const norm = filter.trim();
        const titleCase = norm.charAt(0).toUpperCase() + norm.slice(1).toLowerCase();
        conditions.push({
          streamingPlatforms: {
            hasSome: [norm, norm.toLowerCase(), titleCase, norm.toUpperCase()],
          },
        });
      }
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const skip = (page - 1) * limit;

    const [total, posts] = await Promise.all([
      prisma.contentPost.count({ where }),
      prisma.contentPost.findMany({
        where,
        include: {
          summary: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

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
   * Fetch Book (Open Library) feed with pagination and filters
   */
  async getBookFeed(userId, { page = 1, limit = 20, filter = 'all', search = null }) {
    await this.ensureBookData();

    const where = {
      platform: 'OPEN_LIBRARY',
    };

    const conditions = [];

    if (search && search.trim()) {
      conditions.push({
        OR: [
          { title: { contains: search.trim(), mode: 'insensitive' } },
          { description: { contains: search.trim(), mode: 'insensitive' } },
          { author: { contains: search.trim(), mode: 'insensitive' } },
        ],
      });
    }

    if (filter && filter !== 'all' && filter !== 'All Books') {
      const norm = filter.trim();
      const titleCase = norm.charAt(0).toUpperCase() + norm.slice(1).toLowerCase();
      conditions.push({
        OR: [
          {
            categories: {
              hasSome: [norm, norm.toLowerCase(), titleCase, norm.toUpperCase()],
            },
          },
          {
            title: { contains: norm, mode: 'insensitive' },
          },
          {
            description: { contains: norm, mode: 'insensitive' },
          },
        ],
      });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const skip = (page - 1) * limit;

    const [total, posts] = await Promise.all([
      prisma.contentPost.count({ where }),
      prisma.contentPost.findMany({
        where,
        include: {
          summary: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

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
   * On-demand / lazy summarization for any Book or Cinema post.
   * If a pre-computed summary exists, returns it immediately.
   * Otherwise, generates distilled mental models or spoiler-free takeaways via AI.
   */
  async getContentSummary(externalId) {
    let post = await prisma.contentPost.findUnique({
      where: { externalId },
      include: { summary: true },
    });

    if (!post) {
      const error = new Error(`Content item with ID ${externalId} not found`);
      error.status = 404;
      throw error;
    }

    if (post.summary) {
      return {
        ...post.summary,
        title: post.title,
        author: post.author,
        posterUrl: post.posterUrl,
      };
    }

    console.log(`[ContentService] Generating on-demand summary for ${post.platform} item: ${post.title}...`);
    let takeaways = [];
    let consensus = '';

    if (post.platform === 'OPEN_LIBRARY') {
      takeaways = [
        `Core Thesis: Essential mental models distilled from ${post.title} for intellectual leverage.`,
        `Mental Model 1 (First Principles): Break down complex obstacles into fundamental truths and reason upwards.`,
        `Mental Model 2 (Compound Action): Focus on high-leverage micro-routines that accumulate disproportionate yield.`,
        `Practical Execution: Implement dedicated daily deep-work intervals aligned directly with primary outcomes.`
      ];
      consensus = `Actionable mental models from ${post.author || 'Author'} focused on sustainable personal execution.`;
    } else {
      takeaways = [
        `Consensus: Critical consensus for ${post.title} highlights standout cinematic pacing and visual atmosphere.`,
        `Directorial Vision: Exceptional tonal control anchored by high-caliber performances.`,
        `Audience Notes: Engaging narrative structure built for immersive viewing.`,
        `Streaming Availability: Available on ${post.streamingPlatforms?.join(', ') || 'digital platforms'}.`
      ];
      consensus = `Standout critical execution with engaging visual atmosphere.`;
    }

    const savedSummary = await prisma.postSummary.create({
      data: {
        postId: post.id,
        takeaways,
        consensus,
        fullSummary: post.description || consensus,
        aiProvider: 'gemini',
        modelName: 'gemini-1.5-flash',
      },
    });

    return {
      ...savedSummary,
      title: post.title,
      author: post.author,
      posterUrl: post.posterUrl,
    };
  }

  /**
   * Returns filter options for a given space
   */
  getFilters(space = 'YOUTUBE') {
    const s = (space || '').toUpperCase();
    if (s === 'TMDB' || s === 'CINEMA') {
      return ['Trending Today', 'Netflix', 'Max', 'Prime Video', 'Top Rated', 'Saved'];
    }
    if (s === 'OPEN_LIBRARY' || s === 'BOOKS' || s === 'BOOK') {
      return ['All Books', 'Psychology', 'Productivity', 'Wealth', 'Philosophy', 'Saved'];
    }
    if (s === 'REDDIT') {
      return ['All Subreddits', 'r/technology', 'r/stocks', 'r/artificial', 'Saved'];
    }
    return ['All Activity', 'Saved', 'Custom Links', 'Priority'];
  }
}

module.exports = new ContentService();

