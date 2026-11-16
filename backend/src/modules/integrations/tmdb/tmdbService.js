const axios = require('axios');

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

// Fallback high-fidelity trending movies with critic takeaways
const FALLBACK_TRENDING_MOVIES = [
  {
    externalId: '693134',
    title: 'Dune: Part Two',
    description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    author: 'Denis Villeneuve',
    posterUrl: 'https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s5200SV.jpg',
    url: 'https://www.themoviedb.org/movie/693134',
    rating: 8.5,
    genres: ['Sci-Fi', 'Adventure', 'Action'],
    runtime: '2h 46m',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    streamingPlatforms: ['Max', 'Apple TV', 'Prime Video'],
    releaseYear: '2024',
    takeaways: [
      'Consensus: Universally hailed as a monumental sci-fi masterpiece with breathtaking scale and visceral audio-visual storytelling.',
      'Performances & Direction: Timothée Chalamet and Austin Butler deliver career-defining turns under Denis Villeneuve\'s visionary direction.',
      'Viewer Caveats: Requires watching Part One for narrative clarity; relentless bleak political tension and loud sound design.',
      'Streaming Availability: Streaming globally on Max, Prime Video, and Apple TV.'
    ],
  },
  {
    externalId: '872585',
    title: 'Oppenheimer',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    author: 'Christopher Nolan',
    posterUrl: 'https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg',
    url: 'https://www.themoviedb.org/movie/872585',
    rating: 8.4,
    genres: ['Drama', 'History', 'Biography'],
    runtime: '3h 00m',
    trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
    streamingPlatforms: ['Prime Video', 'Apple TV'],
    releaseYear: '2023',
    takeaways: [
      'Consensus: A riveting biographical thriller that turns boardroom hearings and quantum physics into pulse-pounding drama.',
      'Performances & Direction: Cillian Murphy and Robert Downey Jr. dominate with Oscar-winning intensity backed by Ludwig Göransson\'s propulsive score.',
      'Viewer Caveats: Dense non-linear timeline with dozens of historical figures; dialogues demand high attention.',
      'Streaming Availability: Streaming on Prime Video, Peacock, and Apple TV.'
    ],
  },
  {
    externalId: '569094',
    title: 'Spider-Man: Across the Spider-Verse',
    description: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
    author: 'Joaquim Dos Santos, Kemp Powers',
    posterUrl: 'https://image.tmdb.org/t/p/w780/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
    url: 'https://www.themoviedb.org/movie/569094',
    rating: 8.4,
    genres: ['Animation', 'Action', 'Sci-Fi'],
    runtime: '2h 20m',
    trailerUrl: 'https://www.youtube.com/watch?v=cqGjhVJWtEg',
    streamingPlatforms: ['Netflix', 'Prime Video'],
    releaseYear: '2023',
    takeaways: [
      'Consensus: Groundbreaking visual artistry that pushes the boundaries of cinematic animation to dizzying new heights.',
      'Performances & Direction: Emotional core between Miles and Gwen Stacy shines through inventive multiverse set-pieces.',
      'Viewer Caveats: Concludes on an abrupt cliffhanger; visual pacing is rapid and sensory-heavy.',
      'Streaming Availability: Available to stream on Netflix and rent on Prime Video.'
    ],
  },
  {
    externalId: '157336',
    title: 'Interstellar',
    description: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.',
    author: 'Christopher Nolan',
    posterUrl: 'https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    url: 'https://www.themoviedb.org/movie/157336',
    rating: 8.6,
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    runtime: '2h 49m',
    trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    streamingPlatforms: ['Prime Video', 'Paramount+'],
    releaseYear: '2014',
    takeaways: [
      'Consensus: An emotionally devastating and scientifically ambitious modern sci-fi epic anchored by love and time dilation.',
      'Performances & Direction: Matthew McConaughey\'s raw performance pairs with Hans Zimmer\'s iconic organ-driven score.',
      'Viewer Caveats: High theoretical physics concepts; third act requires suspension of disbelief.',
      'Streaming Availability: Streaming on Prime Video and Paramount+.'
    ],
  },
  {
    externalId: '545611',
    title: 'Everything Everywhere All at Once',
    description: 'An aging Chinese immigrant is swept up in an insane adventure, where she alone can save what’s important to her by connecting with other lives she could have led.',
    author: 'Daniel Kwan, Daniel Scheinert',
    posterUrl: 'https://image.tmdb.org/t/p/w780/w3LxiVYPqrlexP02LOVup9VVbUS.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/fOy2Jurz9AnwGICNxZYyc82whhG.jpg',
    url: 'https://www.themoviedb.org/movie/545611',
    rating: 8.2,
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    runtime: '2h 19m',
    trailerUrl: 'https://www.youtube.com/watch?v=wxN1T1uxQ2g',
    streamingPlatforms: ['Netflix', 'Max'],
    releaseYear: '2022',
    takeaways: [
      'Consensus: An audacious, genre-bending triumph that finds profound tenderness inside surreal multiverse absurdity.',
      'Performances & Direction: Michelle Yeoh and Ke Huy Quan deliver unforgettable, deeply resonant performances.',
      'Viewer Caveats: Very eccentric visual gags and rapid editing may disorient traditional drama viewers.',
      'Streaming Availability: Streaming now on Netflix and Max.'
    ],
  },
  {
    externalId: '1022789',
    title: 'Inside Out 2',
    description: 'Teenager Riley\'s mind undergoes a sudden demolition to make room for unexpected new Emotions: Anxiety, Envy, Ennui, and Embarrassment.',
    author: 'Kelsey Mann',
    posterUrl: 'https://image.tmdb.org/t/p/w780/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/stKGOmPAgC2s4Q8i57o007j3aF0.jpg',
    url: 'https://www.themoviedb.org/movie/1022789',
    rating: 8.1,
    genres: ['Animation', 'Family', 'Comedy'],
    runtime: '1h 36m',
    trailerUrl: 'https://www.youtube.com/watch?v=LEjhY15eCx0',
    streamingPlatforms: ['Disney+'],
    releaseYear: '2024',
    takeaways: [
      'Consensus: A brilliant psychological sequel that captures the chaos of teenage anxiety with empathy and comedic precision.',
      'Performances & Direction: Maya Hawke brings manic energy to Anxiety, perfectly balancing Amy Poehler\'s Joy.',
      'Viewer Caveats: Deeply relatable panic attack sequence may hit close to home for anxiety-prone viewers.',
      'Streaming Availability: Streaming exclusively on Disney+.'
    ],
  }
];

class TMDBService {
  constructor() {
    this.apiKey = process.env.TMDB_API_KEY || null;
  }

  /**
   * 1. Fetch trending movies from TMDB (with automatic fallback to curated popular movies)
   */
  async getTrendingMovies(timeWindow = 'day') {
    if (!this.apiKey) {
      console.log('[TMDBService] No TMDB_API_KEY configured — returning curated high-signal movies.');
      return FALLBACK_TRENDING_MOVIES;
    }

    try {
      const url = `https://api.themoviedb.org/3/trending/movie/${timeWindow}?api_key=${this.apiKey}`;
      const res = await axios.get(url, { timeout: 8000 });
      const movies = res.data?.results || [];

      if (!movies.length) return FALLBACK_TRENDING_MOVIES;

      return movies.slice(0, 10).map((movie) => {
        const genres = (movie.genre_ids || [])
          .map((id) => GENRE_MAP[id])
          .filter(Boolean)
          .slice(0, 3);

        return {
          externalId: String(movie.id),
          title: movie.title || movie.original_title,
          description: movie.overview || '',
          author: 'TMDB Cinema',
          posterUrl: movie.poster_path ? `${TMDB_IMAGE_BASE}/w780${movie.poster_path}` : null,
          backdropUrl: movie.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${movie.backdrop_path}` : null,
          url: `https://www.themoviedb.org/movie/${movie.id}`,
          rating: Number(movie.vote_average?.toFixed(1) || 8.0),
          genres: genres.length ? genres : ['Cinema', 'Drama'],
          runtime: '2h 15m',
          trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent((movie.title || '') + ' official trailer')}`,
          streamingPlatforms: ['Netflix', 'Prime Video', 'Apple TV'],
          releaseYear: movie.release_date ? movie.release_date.slice(0, 4) : '2024',
          publishedAt: movie.release_date ? new Date(movie.release_date) : new Date(),
        };
      });
    } catch (error) {
      console.warn('[TMDBService] Trending movies fetch failed, falling back to curated movies:', error.message);
      return FALLBACK_TRENDING_MOVIES;
    }
  }

  /**
   * 2. Fetch movie details, reviews, trailers, and streaming providers
   */
  async getMovieDetailsAndReviews(movieId) {
    if (!this.apiKey) {
      const found = FALLBACK_TRENDING_MOVIES.find((m) => m.externalId === String(movieId));
      return found || FALLBACK_TRENDING_MOVIES[0];
    }

    try {
      const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${this.apiKey}&append_to_response=videos,reviews,watch/providers`;
      const res = await axios.get(url, { timeout: 8000 });
      const data = res.data;

      const trailer = (data.videos?.results || []).find(
        (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
      );
      const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;

      const usProviders = data['watch/providers']?.results?.US?.flatrate || [];
      const streamingPlatforms = usProviders.map((p) => p.provider_name).slice(0, 3);

      const reviews = (data.reviews?.results || []).slice(0, 5).map((r) => ({
        author: r.author,
        content: (r.content || '').slice(0, 600),
      }));

      const hours = Math.floor((data.runtime || 120) / 60);
      const mins = (data.runtime || 120) % 60;
      const runtime = `${hours}h ${mins}m`;

      return {
        externalId: String(data.id),
        title: data.title,
        description: data.overview,
        author: data.production_companies?.[0]?.name || 'Director',
        posterUrl: data.poster_path ? `${TMDB_IMAGE_BASE}/w780${data.poster_path}` : null,
        backdropUrl: data.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${data.backdrop_path}` : null,
        rating: Number(data.vote_average?.toFixed(1) || 8.0),
        genres: (data.genres || []).map((g) => g.name).slice(0, 3),
        runtime,
        trailerUrl: trailerUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(data.title + ' trailer')}`,
        streamingPlatforms: streamingPlatforms.length ? streamingPlatforms : ['Prime Video', 'Apple TV'],
        releaseYear: data.release_date ? data.release_date.slice(0, 4) : '2024',
        reviews,
      };
    } catch (error) {
      console.warn(`[TMDBService] Movie details fetch failed for ${movieId}:`, error.message);
      const found = FALLBACK_TRENDING_MOVIES.find((m) => m.externalId === String(movieId));
      return found || FALLBACK_TRENDING_MOVIES[0];
    }
  }

  getCuratedFallbackMovies() {
    return FALLBACK_TRENDING_MOVIES;
  }
}

module.exports = new TMDBService();

