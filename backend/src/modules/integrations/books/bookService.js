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
  },
  {
    externalId: 'OL17855018W',
    title: 'The Daily Stoic',
    author: 'Ryan Holiday',
    description: '366 Meditations on Wisdom, Perseverance, and the Art of Living. Timeless insights from Seneca, Epictetus, and Marcus Aurelius.',
    posterUrl: 'https://covers.openlibrary.org/b/id/8333552-L.jpg',
    url: 'https://openlibrary.org/works/OL17855018W',
    pageCount: 416,
    readTime: '5-Min Read',
    categories: ['Philosophy', 'Psychology', 'Mindset'],
    releaseYear: '2016',
    takeaways: [
      'Core Thesis: You cannot control external events, but you maintain sovereign control over your reaction and moral character.',
      'Mental Model 1 (Dichotomy of Control): Divide every circumstance into what is up to you (beliefs, impulses, desires) and what is not (reputation, outcomes).',
      'Mental Model 2 (Amor Fati): Do not merely tolerate adversity; actively love your fate and transform every obstacle into fuel for growth.',
      'Practical Application: Begin and end each day reviewing what was in your power versus what was outside of it.'
    ],
  },
  {
    externalId: 'OL484351W',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    description: 'Private reflections and spiritual exercises of Roman Emperor Marcus Aurelius on duty, self-discipline, and serenity amidst chaos.',
    posterUrl: 'https://covers.openlibrary.org/b/id/12522776-L.jpg',
    url: 'https://openlibrary.org/works/OL484351W',
    pageCount: 256,
    readTime: '5-Min Read',
    categories: ['Philosophy', 'Stoicism', 'Mindset'],
    releaseYear: '180',
    takeaways: [
      'Core Thesis: The soul becomes dyed with the color of its thoughts; external things touch not the soul, but stand quietly without.',
      'Mental Model 1 (The Inner Citadel): Build a fortress of inner equanimity that no external chaos, insult, or misfortune can breach.',
      'Mental Model 2 (Memento Mori): Remember the transience of life to eradicate petty anxieties and act with urgent virtue.',
      'Practical Application: View challenging people each morning as opportunities to practice patience, justice, and kindness.'
    ],
  },
  {
    externalId: 'OL21639145W',
    title: 'The Almanack of Naval Ravikant',
    author: 'Eric Jorgenson',
    description: 'A Guide to Wealth and Happiness. Principles on building leverage, judgment, and peace of mind without relying on luck.',
    posterUrl: 'https://covers.openlibrary.org/b/id/10684120-L.jpg',
    url: 'https://openlibrary.org/works/OL21639145W',
    pageCount: 242,
    readTime: '5-Min Read',
    categories: ['Wealth', 'Philosophy', 'Productivity'],
    releaseYear: '2020',
    takeaways: [
      'Core Thesis: Wealth creation is a skill earned by pairing specific knowledge with high-permissionless leverage (code and media).',
      'Mental Model 1 (Permissionless Leverage): Code and media work for you while you sleep, requiring zero permission from gatekeepers.',
      'Mental Model 2 (Judgment as Key Currency): In an age of leverage, one correct decision is worth a thousand hours of blind effort.',
      'Practical Application: Arm yourself with specific knowledge that cannot be trained out of you, then apply code or content leverage.'
    ],
  },
  {
    externalId: 'OL17140730W',
    title: 'Essentialism',
    author: 'Greg McKeown',
    description: 'The Disciplined Pursuit of Less. How to eliminate non-essentials and focus single-mindedly on what truly matters.',
    posterUrl: 'https://covers.openlibrary.org/b/id/7388725-L.jpg',
    url: 'https://openlibrary.org/works/OL17140730W',
    pageCount: 272,
    readTime: '5-Min Read',
    categories: ['Productivity', 'Focus', 'Leadership'],
    releaseYear: '2014',
    takeaways: [
      'Core Thesis: If you do not prioritize your life, someone else will. The disciplined pursuit of less leads to greater contribution.',
      'Mental Model 1 (Trade-Off Thinking): You cannot do it all; deliberate trade-offs are the fundamental reality of high achievement.',
      'Mental Model 2 (The 90% Rule): If a project or commitment is not a definitive "90% Yes", it is an automatic "No".',
      'Practical Application: Audit weekly obligations and ruthlessly eliminate 3 trivial tasks that deliver zero leveraged value.'
    ],
  },
  {
    externalId: 'OL242207W',
    title: "Man's Search for Meaning",
    author: 'Viktor E. Frankl',
    description: 'Psychiatrist Viktor Frankl recounts his experiences in Auschwitz and introduces logotherapy: human motivation is the search for purpose.',
    posterUrl: 'https://covers.openlibrary.org/b/id/8231990-L.jpg',
    url: 'https://openlibrary.org/works/OL242207W',
    pageCount: 184,
    readTime: '5-Min Read',
    categories: ['Psychology', 'Philosophy', 'Mindset'],
    releaseYear: '1946',
    takeaways: [
      'Core Thesis: Those who have a "why" to live can bear almost any "how"; spiritual freedom cannot be taken away.',
      'Mental Model 1 (The Space Between Stimulus and Response): Between stimulus and response lies human freedom to choose our attitude.',
      'Mental Model 2 (Will to Meaning): Humans are driven not by pleasure or power, but by the pursuit of creative work, love, and courage in suffering.',
      'Practical Application: Find meaning in every challenge by shifting perspective from "Why is this happening to me?" to "What does life ask of me right now?".'
    ],
  },
  {
    externalId: 'OL14959146W',
    title: 'Rich Dad Poor Dad',
    author: 'Robert T. Kiyosaki',
    description: 'What the Rich Teach Their Kids About Money That the Poor and Middle Class Do Not. Mastering cash flow, assets, and financial literacy.',
    posterUrl: 'https://covers.openlibrary.org/b/id/8225266-L.jpg',
    url: 'https://openlibrary.org/works/OL14959146W',
    pageCount: 336,
    readTime: '5-Min Read',
    categories: ['Wealth', 'Finance', 'Investing'],
    releaseYear: '1997',
    takeaways: [
      'Core Thesis: The rich acquire income-generating assets, while the poor and middle class acquire liabilities they think are assets.',
      'Mental Model 1 (Cash Flow Quadrant): Transition from trading time for wages (Employee) to owning scalable assets and systems (Investor).',
      'Mental Model 2 (Work to Learn, Not to Earn): Build multidisciplinary skills in sales, finance, and marketing rather than over-specializing.',
      'Practical Application: Reinvest active income into cash-flow producing vehicles before funding discretionary lifestyle expenditures.'
    ],
  }
];

class BookService {
  /**
   * 1. Fetch popular books with curated bestsellers guaranteed
   */
  async getPopularBestsellers() {
    return FALLBACK_BOOKS;
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


