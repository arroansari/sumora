const axios = require('axios');

const FALLBACK_BOOKS = [
  {
    externalId: 'OL17860744W',
    title: 'Atomic Habits',
    author: 'James Clear',
    description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones. Tiny changes produce remarkable results through compound growth.',
    posterUrl: 'https://covers.openlibrary.org/b/id/12843477-L.jpg',
    url: 'https://openlibrary.org/works/OL17860744W',
    pageCount: 320,
    readTime: '5-Min Read',
    categories: ['Productivity', 'Psychology', 'Self-Help'],
    releaseYear: '2018',
    takeaways: [
      'Core Thesis: You do not rise to the level of your goals; you fall to the level of your systems.',
      'Mental Model 1 (The 4 Laws of Behavior Change): Make habits Obvious, Attractive, Easy, and Satisfying to cement lasting routines.',
      'Mental Model 2 (Identity-Based Habits): True behavioral shift occurs when you decide the type of person you wish to be and prove it with small wins.',
      'Practical Application: Stack new habits onto existing ones (e.g., "After pouring morning coffee, I will write one priority task").'
    ],
  },
  {
    externalId: 'OL15358658W',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    description: 'Nobel laureate Daniel Kahneman explores the two systems that drive the way we think: System 1 (fast, emotional) and System 2 (slow, logical).',
    posterUrl: 'https://covers.openlibrary.org/b/id/8231856-L.jpg',
    url: 'https://openlibrary.org/works/OL15358658W',
    pageCount: 499,
    readTime: '5-Min Read',
    categories: ['Psychology', 'Decision-Making', 'Science'],
    releaseYear: '2011',
    takeaways: [
      'Core Thesis: Human decisions are dominated by automatic cognitive biases (System 1) rather than objective calculation (System 2).',
      'Mental Model 1 (WYSIATI - What You See Is All There Is): The mind constructs coherence from limited evidence, creating false confidence.',
      'Mental Model 2 (Loss Aversion): The psychological pain of losing is roughly twice as potent as the pleasure of gaining an equivalent amount.',
      'Practical Application: Force active System 2 deliberation on high-stakes choices through pre-mortems and structured checklists.'
    ],
  },
  {
    externalId: 'OL20872659W',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    description: 'Timeless lessons on wealth, greed, and happiness doing well with money has a little to do with how smart you are and a lot to do with how you behave.',
    posterUrl: 'https://covers.openlibrary.org/b/id/10523456-L.jpg',
    url: 'https://openlibrary.org/works/OL20872659W',
    pageCount: 256,
    readTime: '5-Min Read',
    categories: ['Wealth', 'Investing', 'Psychology'],
    releaseYear: '2020',
    takeaways: [
      'Core Thesis: Financial success is not hard science; it is a soft skill where behavior and temperament outweigh raw financial intelligence.',
      'Mental Model 1 (The Power of Compounding & Survival): Enduring through down cycles matters more than hunting peak returns; longevity is the secret.',
      'Mental Model 2 (Freedom as the Highest Dividend): The highest form of wealth is the ability to wake up every morning and say: "I can do whatever I want today."',
      'Practical Application: Define "Enough" to prevent lifestyle inflation from resetting your happiness baseline.'
    ],
  },
  {
    externalId: 'OL17352327W',
    title: 'Deep Work',
    author: 'Cal Newport',
    description: 'Rules for Focused Success in a Distracted World. The ability to perform deep work is becoming increasingly rare and valuable in our economy.',
    posterUrl: 'https://covers.openlibrary.org/b/id/8315104-L.jpg',
    url: 'https://openlibrary.org/works/OL17352327W',
    pageCount: 304,
    readTime: '5-Min Read',
    categories: ['Productivity', 'Career', 'Focus'],
    releaseYear: '2016',
    takeaways: [
      'Core Thesis: Uninterrupted cognitive focus is the super-power of the knowledge economy; shallow tasks provide an illusion of productivity.',
      'Mental Model 1 (Attention Residue): Switching tasks leaves cognitive residue, drastically reducing problem-solving depth for up to 20 minutes.',
      'Mental Model 2 (The 4 Disciplines of Execution): Focus on the wildly important, act on lead measures, keep a compelling scoreboard, and create rhythm.',
      'Practical Application: Schedule 90-minute blocks of zero-notification deep work every morning before checking inboxes.'
    ],
  },
  {
    externalId: 'OL17930368W',
    title: 'Principles: Life and Work',
    author: 'Ray Dalio',
    description: 'Ray Dalio shares the unconventional principles that he developed, refined, and used over the past forty years to create unique results in both life and business.',
    posterUrl: 'https://covers.openlibrary.org/b/id/8235116-L.jpg',
    url: 'https://openlibrary.org/works/OL17930368W',
    pageCount: 592,
    readTime: '5-Min Read',
    categories: ['Wealth', 'Philosophy', 'Leadership'],
    releaseYear: '2017',
    takeaways: [
      'Core Thesis: Treat reality as an intricate machine; embracing hard truths and radical transparency is the fastest path to progress.',
      'Mental Model 1 (Pain + Reflection = Progress): Do not avoid failures; dissect each painful mistake dispassionately to uncover root causes.',
      'Mental Model 2 (Idea Meritocracy): Base decisions on believable opinions through structured disagreement rather than hierarchy or consensus.',
      'Practical Application: Write down and codify operating principles whenever a critical mistake occurs so the mistake never repeats.'
    ],
  },
  {
    externalId: 'OL17079294W',
    title: 'Zero to One',
    author: 'Peter Thiel',
    description: 'Notes on Startups, or How to Build the Future. Doing what we already know how to do takes the world from 1 to n. But every new creation goes from 0 to 1.',
    posterUrl: 'https://covers.openlibrary.org/b/id/8431056-L.jpg',
    url: 'https://openlibrary.org/works/OL17079294W',
    pageCount: 224,
    readTime: '5-Min Read',
    categories: ['Productivity', 'Business', 'Innovation'],
    releaseYear: '2014',
    takeaways: [
      'Core Thesis: True progress comes from vertical (technological) leaps from 0 to 1, rather than horizontal copying (1 to n).',
      'Mental Model 1 (Monopoly vs Perfect Competition): Creative monopolists capture enduring value by offering 10x proprietary advantages in small niche markets.',
      'Mental Model 2 (Definite Optimism): The future can be known and shaped through clear vision and proactive design rather than passive chance.',
      'Practical Application: Dominate a tiny niche market first before expanding into adjacent domains.'
    ],
  }
];

class BookService {
  /**
   * 1. Fetch popular books by subject from Open Library with automatic fallback
   */
  async getPopularBestsellers(subject = 'self-help') {
    const cleanSubject = subject.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const url = `https://openlibrary.org/subjects/${cleanSubject}.json?limit=10`;

    try {
      const res = await axios.get(url, {
        headers: { 'User-Agent': 'node:sumora-app:v1.0.0 (by /u/sumora_books)' },
        timeout: 8000,
      });

      const works = res.data?.works || [];
      if (!works.length) return FALLBACK_BOOKS;

      return works.slice(0, 10).map((work) => {
        const coverId = work.cover_id;
        const authorName = work.authors?.[0]?.name || 'Author';

        return {
          externalId: work.key?.replace('/works/', '') || String(work.cover_id),
          title: work.title,
          author: authorName,
          description: work.subject?.slice(0, 4).join(', ') || 'Non-fiction insights and mental models.',
          posterUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : 'https://covers.openlibrary.org/b/id/12843477-L.jpg',
          url: `https://openlibrary.org${work.key}`,
          pageCount: 280,
          readTime: '5-Min Read',
          categories: work.subject?.slice(0, 3) || ['Non-Fiction', 'Insights'],
          releaseYear: String(work.first_publish_year || 2020),
          publishedAt: new Date(work.first_publish_year ? `${work.first_publish_year}-01-01` : Date.now()),
        };
      });
    } catch (error) {
      console.warn(`[BookService] Open Library books fetch failed for subject ${subject}, using curated fallback:`, error.message);
      return FALLBACK_BOOKS;
    }
  }

  /**
   * 2. Fetch specific work details
   */
  async getBookDetails(workKey) {
    const cleanKey = workKey.replace(/^\/?works\//, '');
    const found = FALLBACK_BOOKS.find((b) => b.externalId === cleanKey);
    if (found) return found;

    try {
      const url = `https://openlibrary.org/works/${cleanKey}.json`;
      const res = await axios.get(url, {
        headers: { 'User-Agent': 'node:sumora-app:v1.0.0 (by /u/sumora_books)' },
        timeout: 8000,
      });
      const data = res.data;

      const desc = typeof data.description === 'string' ? data.description : data.description?.value || '';

      return {
        externalId: cleanKey,
        title: data.title,
        author: 'Non-Fiction Author',
        description: desc,
        posterUrl: data.covers?.[0] ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg` : null,
        url: `https://openlibrary.org/works/${cleanKey}`,
        pageCount: 300,
        readTime: '5-Min Read',
        categories: (data.subjects || []).slice(0, 3),
        releaseYear: data.first_publish_date?.slice(0, 4) || '2020',
      };
    } catch (error) {
      console.warn(`[BookService] Book details fetch failed for ${cleanKey}:`, error.message);
      return FALLBACK_BOOKS[0];
    }
  }

  getCuratedFallbackBooks() {
    return FALLBACK_BOOKS;
  }
}

module.exports = new BookService();

