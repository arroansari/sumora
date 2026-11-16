import { useState, useCallback, useEffect, useMemo } from 'react';
import { Alert, Linking, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { videosApi, redditApi, contentApi } from '../../../services/api';
import { VideoItem, RedditPostItem, ContentPostItem } from '../../../types/models.types';
import { FeedTab } from '../components/HomeFilterBar';

export const FAVORITES_STORAGE_KEY = 'sumora:favorite_channel_ids';
export const READ_VIDEOS_KEY = 'sumora:read_video_ids';
export const BOOKMARKS_STORAGE_KEY = 'sumora:bookmarked_video_ids';
export const SAVED_CELEBRATION_KEY = 'sumora:has_seen_saved_celebration';

export const READ_REDDIT_KEY = 'sumora:read_reddit_ids';
export const BOOKMARKS_REDDIT_KEY = 'sumora:bookmarked_reddit_ids';

export const READ_CINEMA_KEY = 'sumora:read_cinema_ids';
export const BOOKMARKS_CINEMA_KEY = 'sumora:bookmarked_cinema_ids';

export const READ_BOOK_KEY = 'sumora:read_book_ids';
export const BOOKMARKS_BOOK_KEY = 'sumora:bookmarked_book_ids';

interface UseHomeDomainDataProps {
  navigation: any;
  activeSpace: 'YOUTUBE' | 'REDDIT' | 'TMDB' | 'OPEN_LIBRARY';
}

export function useHomeDomainData({ navigation, activeSpace }: UseHomeDomainDataProps) {
  // Common UI State
  const [showSavedCelebrationModal, setShowSavedCelebrationModal] = useState<boolean>(false);
  const [celebrationVideoTitle, setCelebrationVideoTitle] = useState<string>('');

  // 1. YouTube Feed State
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<FeedTab>('all');
  const [favoriteChannelIds, setFavoriteChannelIds] = useState<Set<string>>(new Set());
  const [readVideoIds, setReadVideoIds] = useState<Set<string>>(new Set());
  const [bookmarkedVideoIds, setBookmarkedVideoIds] = useState<Set<string>>(new Set());

  // 2. Reddit Feed State
  const [redditPosts, setRedditPosts] = useState<RedditPostItem[]>([]);
  const [redditLoading, setRedditLoading] = useState<boolean>(false);
  const [redditRefreshing, setRedditRefreshing] = useState<boolean>(false);
  const [subreddits, setSubreddits] = useState<string[]>(['technology', 'stocks', 'artificial']);
  const [activeSubreddit, setActiveSubreddit] = useState<string>('all');
  const [readRedditIds, setReadRedditIds] = useState<Set<string>>(new Set());
  const [bookmarkedRedditIds, setBookmarkedRedditIds] = useState<Set<string>>(new Set());

  // 3. Cinema (TMDB) Feed State
  const [cinemaPosts, setCinemaPosts] = useState<ContentPostItem[]>([]);
  const [cinemaLoading, setCinemaLoading] = useState<boolean>(false);
  const [cinemaRefreshing, setCinemaRefreshing] = useState<boolean>(false);
  const [activeCinemaFilter, setActiveCinemaFilter] = useState<string>('Trending Today');
  const [readCinemaIds, setReadCinemaIds] = useState<Set<string>>(new Set());
  const [bookmarkedCinemaIds, setBookmarkedCinemaIds] = useState<Set<string>>(new Set());

  // 4. Book (Open Library) Feed State
  const [bookPosts, setBookPosts] = useState<ContentPostItem[]>([]);
  const [bookLoading, setBookLoading] = useState<boolean>(false);
  const [bookRefreshing, setBookRefreshing] = useState<boolean>(false);
  const [activeBookFilter, setActiveBookFilter] = useState<string>('All Books');
  const [readBookIds, setReadBookIds] = useState<Set<string>>(new Set());
  const [bookmarkedBookIds, setBookmarkedBookIds] = useState<Set<string>>(new Set());

  // Load user storage across all 4 domains
  const loadStoredData = useCallback(async () => {
    try {
      const [
        favStored,
        readStored,
        bookmarkStored,
        readRedditStored,
        bookmarkRedditStored,
        readCinemaStored,
        bookmarkCinemaStored,
        readBookStored,
        bookmarkBookStored,
      ] = await Promise.all([
        AsyncStorage.getItem(FAVORITES_STORAGE_KEY),
        AsyncStorage.getItem(READ_VIDEOS_KEY),
        AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY),
        AsyncStorage.getItem(READ_REDDIT_KEY),
        AsyncStorage.getItem(BOOKMARKS_REDDIT_KEY),
        AsyncStorage.getItem(READ_CINEMA_KEY),
        AsyncStorage.getItem(BOOKMARKS_CINEMA_KEY),
        AsyncStorage.getItem(READ_BOOK_KEY),
        AsyncStorage.getItem(BOOKMARKS_BOOK_KEY),
      ]);

      if (favStored) setFavoriteChannelIds(new Set(JSON.parse(favStored)));
      if (readStored) setReadVideoIds(new Set(JSON.parse(readStored)));
      if (bookmarkStored) setBookmarkedVideoIds(new Set(JSON.parse(bookmarkStored)));

      if (readRedditStored) setReadRedditIds(new Set(JSON.parse(readRedditStored)));
      if (bookmarkRedditStored) setBookmarkedRedditIds(new Set(JSON.parse(bookmarkRedditStored)));

      if (readCinemaStored) setReadCinemaIds(new Set(JSON.parse(readCinemaStored)));
      if (bookmarkCinemaStored) setBookmarkedCinemaIds(new Set(JSON.parse(bookmarkCinemaStored)));

      if (readBookStored) setReadBookIds(new Set(JSON.parse(readBookStored)));
      if (bookmarkBookStored) setBookmarkedBookIds(new Set(JSON.parse(bookmarkBookStored)));
    } catch {
      // ignore
    }
  }, []);

  // Fetch YouTube feed
  const loadYouTubeFeed = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await videosApi.getFeed(1, 40);
      if (res?.videos) {
        setVideos(res.videos);
      }
    } catch (err) {
      console.warn('[HomeScreen] Could not fetch YouTube feed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Reddit feed
  const loadRedditFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRedditRefreshing(true);
    else setRedditLoading(true);

    try {
      const subOpt = activeSubreddit !== 'all' ? activeSubreddit : undefined;
      const res = await redditApi.getFeed(1, 40, { subreddit: subOpt });
      setRedditPosts(res?.posts || []);

      const tracked = await redditApi.listSources().catch(() => []);
      if (tracked.length > 0) {
        setSubreddits(tracked.map((t) => t.sourceId));
      }
    } catch (err) {
      console.warn('[HomeScreen] Could not fetch Reddit feed:', err);
    } finally {
      setRedditLoading(false);
      setRedditRefreshing(false);
    }
  }, [activeSubreddit]);

  // Fetch Cinema (TMDB) feed
  const loadCinemaFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setCinemaRefreshing(true);
    else setCinemaLoading(true);

    try {
      const filterOpt = activeCinemaFilter !== 'Saved' ? activeCinemaFilter : undefined;
      const res = await contentApi.getFeed('TMDB', 1, 40, { filter: filterOpt });
      setCinemaPosts(res?.posts || []);
    } catch (err) {
      console.warn('[HomeScreen] Could not fetch Cinema feed:', err);
    } finally {
      setCinemaLoading(false);
      setCinemaRefreshing(false);
    }
  }, [activeCinemaFilter]);

  // Fetch Book (Open Library) feed
  const loadBookFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setBookRefreshing(true);
    else setBookLoading(true);

    try {
      const filterOpt = activeBookFilter !== 'Saved' && activeBookFilter !== 'All Books' ? activeBookFilter : undefined;
      const res = await contentApi.getFeed('OPEN_LIBRARY', 1, 40, { filter: filterOpt });
      setBookPosts(res?.posts || []);
    } catch (err) {
      console.warn('[HomeScreen] Could not fetch Book feed:', err);
    } finally {
      setBookLoading(false);
      setBookRefreshing(false);
    }
  }, [activeBookFilter]);

  // Refresh active space on focus
  useFocusEffect(
    useCallback(() => {
      loadStoredData();
      if (activeSpace === 'YOUTUBE') loadYouTubeFeed();
      if (activeSpace === 'REDDIT') loadRedditFeed();
      if (activeSpace === 'TMDB') loadCinemaFeed();
      if (activeSpace === 'OPEN_LIBRARY') loadBookFeed();
    }, [activeSpace, loadStoredData, loadYouTubeFeed, loadRedditFeed, loadCinemaFeed, loadBookFeed])
  );

  // Load feeds when active filters change
  useEffect(() => {
    if (activeSpace === 'TMDB') loadCinemaFeed();
  }, [activeSpace, activeCinemaFilter, loadCinemaFeed]);

  useEffect(() => {
    if (activeSpace === 'OPEN_LIBRARY') loadBookFeed();
  }, [activeSpace, activeBookFilter, loadBookFeed]);

  useEffect(() => {
    if (activeSpace === 'REDDIT') loadRedditFeed();
  }, [activeSpace, activeSubreddit, loadRedditFeed]);

  // Initial load
  useEffect(() => {
    loadYouTubeFeed(true);
    loadRedditFeed();
    loadCinemaFeed();
    loadBookFeed();
  }, [loadYouTubeFeed, loadRedditFeed, loadCinemaFeed, loadBookFeed]);

  // YouTube Refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const favList = Array.from(favoriteChannelIds);
      await videosApi.syncFeed(favList).catch(() => {});
      const res = await videosApi.getFeed(1, 40);
      setVideos(res.videos);
      await loadStoredData();
    } catch (err) {
      console.warn('[HomeScreen] Feed refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [favoriteChannelIds, loadStoredData]);

  // YouTube Actions
  const handleReadSummary = useCallback(
    (videoId: string, title: string) => {
      const item = videos.find((v) => v.videoId === videoId);
      navigation.navigate('SummaryDetail', {
        videoId,
        videoTitle: title,
        channelName: item?.channelName,
        thumbnailUrl: item?.thumbnailUrl,
        publishedAt: item?.publishedAt,
        summary: item?.summary,
      });
    },
    [navigation, videos]
  );

  const handleWatchVideo = useCallback((videoUrl: string) => {
    Linking.openURL(videoUrl).catch(() => {
      Alert.alert('Cannot Open Video', 'Unable to open video URL in YouTube or browser.');
    });
  }, []);

  const handleMarkDone = useCallback((videoId: string, title: string) => {
    Alert.alert('Mark as Done?', `Archive "${title}" from your active feed?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          try {
            const raw = await AsyncStorage.getItem(READ_VIDEOS_KEY);
            const ids: string[] = raw ? JSON.parse(raw) : [];
            if (!ids.includes(videoId)) {
              ids.push(videoId);
              await AsyncStorage.setItem(READ_VIDEOS_KEY, JSON.stringify(ids));
              setReadVideoIds(new Set(ids));
            }
          } catch {}
        },
      },
    ]);
  }, []);

  const handleRestoreVideo = useCallback(async (videoId: string) => {
    try {
      const raw = await AsyncStorage.getItem(READ_VIDEOS_KEY);
      if (raw) {
        const ids: string[] = JSON.parse(raw);
        const updated = ids.filter((id) => id !== videoId);
        await AsyncStorage.setItem(READ_VIDEOS_KEY, JSON.stringify(updated));
        setReadVideoIds(new Set(updated));
      }
      Alert.alert('Restored', 'This video has been restored to your active Activity Feed.');
    } catch {}
  }, []);

  const handleCopyTakeaways = useCallback((item: VideoItem) => {
    const rawTakeaways = item.summary?.keyPoints || [];
    const text = rawTakeaways.map((p, i) => `${i + 1}. ${p}`).join('\n');
    Alert.alert('Takeaways Copied', text || 'No takeaways available to copy.');
  }, []);

  const handleShareVideo = useCallback((item: VideoItem) => {
    Share.share({
      message: `Check out this summary of "${item.title}": ${item.videoUrl}`,
    }).catch(() => {});
  }, []);

  const handleToggleBookmark = useCallback(
    async (videoId: string, title: string) => {
      try {
        const raw = await AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY);
        const ids: string[] = raw ? JSON.parse(raw) : [];
        const isBookmarked = ids.includes(videoId);

        let updated: string[];
        if (isBookmarked) {
          updated = ids.filter((id) => id !== videoId);
        } else {
          updated = [...ids, videoId];
          const hasSeen = await AsyncStorage.getItem(SAVED_CELEBRATION_KEY);
          if (!hasSeen) {
            setCelebrationVideoTitle(title);
            setShowSavedCelebrationModal(true);
            await AsyncStorage.setItem(SAVED_CELEBRATION_KEY, 'true');
          }
        }
        await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));
        setBookmarkedVideoIds(new Set(updated));
      } catch {}
    },
    []
  );

  // Reddit Actions
  const handleReadRedditSummary = useCallback(
    (postId: string, title: string, item: RedditPostItem) => {
      navigation.navigate('SummaryDetail', {
        videoId: postId,
        videoTitle: title,
        channelName: `r/${item.subreddit}`,
        thumbnailUrl: item.url || undefined,
        publishedAt: item.publishedAt,
        summary: item.summary
          ? {
              overview: item.summary.consensus || item.summary.fullSummary,
              keyPoints: item.summary.keyTakeaways || (item.summary as any).takeaways || [],
              detailedSummary: item.summary.fullSummary,
              conclusion: item.summary.consensus,
            }
          : undefined,
      });
    },
    [navigation]
  );

  const handleCopyRedditTakeaways = useCallback((item: RedditPostItem) => {
    const bullets = (item.summary as any)?.takeaways || item.summary?.keyTakeaways || [];
    Alert.alert('Debate Takeaways Copied', bullets.join('\n\n') || item.title);
  }, []);

  const handleToggleRedditBookmark = useCallback(async (postId: string) => {
    try {
      const raw = await AsyncStorage.getItem(BOOKMARKS_REDDIT_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      const isBookmarked = ids.includes(postId);
      const updated = isBookmarked ? ids.filter((id) => id !== postId) : [...ids, postId];
      await AsyncStorage.setItem(BOOKMARKS_REDDIT_KEY, JSON.stringify(updated));
      setBookmarkedRedditIds(new Set(updated));
    } catch {}
  }, []);

  const handleShareRedditThread = useCallback((item: RedditPostItem) => {
    const url = item.permalink.startsWith('http')
      ? item.permalink
      : `https://www.reddit.com${item.permalink}`;
    Share.share({
      message: `Distilled Reddit Debate on "${item.title}": ${url}`,
    }).catch(() => {});
  }, []);

  const handleMarkRedditDone = useCallback((postId: string, title: string) => {
    Alert.alert('Archive Discussion?', `Mark "${title}" as done?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          try {
            const raw = await AsyncStorage.getItem(READ_REDDIT_KEY);
            const ids: string[] = raw ? JSON.parse(raw) : [];
            if (!ids.includes(postId)) {
              ids.push(postId);
              await AsyncStorage.setItem(READ_REDDIT_KEY, JSON.stringify(ids));
              setReadRedditIds(new Set(ids));
            }
          } catch {}
        },
      },
    ]);
  }, []);

  const handleRestoreRedditThread = useCallback(async (postId: string) => {
    try {
      const raw = await AsyncStorage.getItem(READ_REDDIT_KEY);
      if (raw) {
        const ids: string[] = JSON.parse(raw);
        const updated = ids.filter((id) => id !== postId);
        await AsyncStorage.setItem(READ_REDDIT_KEY, JSON.stringify(updated));
        setReadRedditIds(new Set(updated));
      }
      Alert.alert('Restored', 'This discussion has been restored to your Reddit feed.');
    } catch {}
  }, []);

  // Cinema (TMDB) Actions
  const handleReadReview = useCallback(
    (item: ContentPostItem) => {
      navigation.navigate('SummaryDetail', {
        videoId: item.externalId,
        videoTitle: item.title,
        channelName: item.author || 'TMDB Cinema',
        thumbnailUrl: item.posterUrl,
        publishedAt: item.publishedAt,
        summary: item.summary
          ? {
              overview: item.summary.consensus || item.description || '',
              keyPoints: item.summary.takeaways || [],
              detailedSummary: item.summary.fullSummary || item.description || '',
              conclusion: item.summary.consensus || '',
            }
          : undefined,
      });
    },
    [navigation]
  );

  const handleToggleCinemaBookmark = useCallback(async (postId: string) => {
    try {
      const raw = await AsyncStorage.getItem(BOOKMARKS_CINEMA_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      const isBookmarked = ids.includes(postId);
      const updated = isBookmarked ? ids.filter((id) => id !== postId) : [...ids, postId];
      await AsyncStorage.setItem(BOOKMARKS_CINEMA_KEY, JSON.stringify(updated));
      setBookmarkedCinemaIds(new Set(updated));
    } catch {}
  }, []);

  const handleMarkCinemaWatched = useCallback((postId: string, title: string) => {
    Alert.alert('Mark as Watched?', `Archive "${title}" from your active cinema radar?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          try {
            const raw = await AsyncStorage.getItem(READ_CINEMA_KEY);
            const ids: string[] = raw ? JSON.parse(raw) : [];
            if (!ids.includes(postId)) {
              ids.push(postId);
              await AsyncStorage.setItem(READ_CINEMA_KEY, JSON.stringify(ids));
              setReadCinemaIds(new Set(ids));
            }
          } catch {}
        },
      },
    ]);
  }, []);

  const handleRestoreCinema = useCallback(async (postId: string) => {
    try {
      const raw = await AsyncStorage.getItem(READ_CINEMA_KEY);
      if (raw) {
        const ids: string[] = JSON.parse(raw);
        const updated = ids.filter((id) => id !== postId);
        await AsyncStorage.setItem(READ_CINEMA_KEY, JSON.stringify(updated));
        setReadCinemaIds(new Set(updated));
      }
      Alert.alert('Restored', 'Movie restored to your active Cinema Radar.');
    } catch {}
  }, []);

  // Book (Open Library) Actions
  const handleReadBookSummary = useCallback(
    (item: ContentPostItem) => {
      navigation.navigate('SummaryDetail', {
        videoId: item.externalId,
        videoTitle: item.title,
        channelName: item.author || 'Author',
        thumbnailUrl: item.posterUrl,
        publishedAt: item.publishedAt,
        summary: item.summary
          ? {
              overview: item.summary.consensus || item.description || '',
              keyPoints: item.summary.takeaways || [],
              detailedSummary: item.summary.fullSummary || item.description || '',
              conclusion: item.summary.consensus || '',
            }
          : undefined,
      });
    },
    [navigation]
  );

  const handleToggleBookBookmark = useCallback(async (postId: string) => {
    try {
      const raw = await AsyncStorage.getItem(BOOKMARKS_BOOK_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      const isBookmarked = ids.includes(postId);
      const updated = isBookmarked ? ids.filter((id) => id !== postId) : [...ids, postId];
      await AsyncStorage.setItem(BOOKMARKS_BOOK_KEY, JSON.stringify(updated));
      setBookmarkedBookIds(new Set(updated));
    } catch {}
  }, []);

  const handleMarkBookFinished = useCallback((postId: string, title: string) => {
    Alert.alert('Mark as Finished?', `Mark "${title}" as completed?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        style: 'destructive',
        onPress: async () => {
          try {
            const raw = await AsyncStorage.getItem(READ_BOOK_KEY);
            const ids: string[] = raw ? JSON.parse(raw) : [];
            if (!ids.includes(postId)) {
              ids.push(postId);
              await AsyncStorage.setItem(READ_BOOK_KEY, JSON.stringify(ids));
              setReadBookIds(new Set(ids));
            }
          } catch {}
        },
      },
    ]);
  }, []);

  const handleRestoreBook = useCallback(async (postId: string) => {
    try {
      const raw = await AsyncStorage.getItem(READ_BOOK_KEY);
      if (raw) {
        const ids: string[] = JSON.parse(raw);
        const updated = ids.filter((id) => id !== postId);
        await AsyncStorage.setItem(READ_BOOK_KEY, JSON.stringify(updated));
        setReadBookIds(new Set(updated));
      }
      Alert.alert('Restored', 'Book restored to your active reading list.');
    } catch {}
  }, []);

  // Filtered Feeds
  const displayedVideos = useMemo(() => {
    const active = videos.filter((v) => !readVideoIds.has(v.videoId));
    const completed = videos.filter((v) => readVideoIds.has(v.videoId));
    if (activeTab === 'completed') return completed;
    if (activeTab === 'saved') return active.filter((v) => bookmarkedVideoIds.has(v.videoId));
    if (activeTab === 'custom') return active.filter((v) => v.isCustomImport || v.channelId === 'imported');
    if (activeTab === 'favorites') return active.filter((v) => favoriteChannelIds.has(v.channelId));
    return active;
  }, [videos, readVideoIds, activeTab, bookmarkedVideoIds, favoriteChannelIds]);

  const displayedRedditPosts = useMemo(() => {
    const active = redditPosts.filter((p) => !readRedditIds.has(p.externalId));
    if (activeTab === 'saved') {
      return active.filter((p) => bookmarkedRedditIds.has(p.externalId));
    }
    if (activeSubreddit !== 'all') {
      return active.filter((p) => p.subreddit.toLowerCase() === activeSubreddit.toLowerCase());
    }
    return active;
  }, [redditPosts, readRedditIds, activeTab, activeSubreddit, bookmarkedRedditIds]);

  const displayedCinemaPosts = useMemo(() => {
    const active = cinemaPosts.filter((p) => !readCinemaIds.has(p.externalId));
    if (activeCinemaFilter === 'Saved') {
      return active.filter((p) => bookmarkedCinemaIds.has(p.externalId));
    }
    return active;
  }, [cinemaPosts, readCinemaIds, activeCinemaFilter, bookmarkedCinemaIds]);

  const displayedBookPosts = useMemo(() => {
    const active = bookPosts.filter((p) => !readBookIds.has(p.externalId));
    if (activeBookFilter === 'Saved') {
      return active.filter((p) => bookmarkedBookIds.has(p.externalId));
    }
    return active;
  }, [bookPosts, readBookIds, activeBookFilter, bookmarkedBookIds]);

  // Counts for filter pills
  const savedVideoCount = useMemo(
    () => videos.filter((v) => !readVideoIds.has(v.videoId) && bookmarkedVideoIds.has(v.videoId)).length,
    [videos, readVideoIds, bookmarkedVideoIds]
  );
  const customCount = useMemo(
    () => videos.filter((v) => !readVideoIds.has(v.videoId) && (v.isCustomImport || v.channelId === 'imported')).length,
    [videos, readVideoIds]
  );
  const completedCount = useMemo(
    () => videos.filter((v) => readVideoIds.has(v.videoId)).length,
    [videos, readVideoIds]
  );
  const savedRedditCount = useMemo(
    () => redditPosts.filter((p) => !readRedditIds.has(p.externalId) && bookmarkedRedditIds.has(p.externalId)).length,
    [redditPosts, readRedditIds, bookmarkedRedditIds]
  );
  const savedCinemaCount = useMemo(
    () => cinemaPosts.filter((p) => !readCinemaIds.has(p.externalId) && bookmarkedCinemaIds.has(p.externalId)).length,
    [cinemaPosts, readCinemaIds, bookmarkedCinemaIds]
  );
  const savedBookCount = useMemo(
    () => bookPosts.filter((p) => !readBookIds.has(p.externalId) && bookmarkedBookIds.has(p.externalId)).length,
    [bookPosts, readBookIds, bookmarkedBookIds]
  );

  // Dynamic header titles based on active space
  const headerMeta = useMemo(() => {
    switch (activeSpace) {
      case 'REDDIT':
        return {
          title: 'Reddit Discussion Feed',
          subtitle: 'Distilled debates from followed subreddits & links',
        };
      case 'TMDB':
        return {
          title: 'Cinema Intelligence Feed',
          subtitle: 'Spoiler-free critic consensus & streaming availability',
        };
      case 'OPEN_LIBRARY':
        return {
          title: 'Daily Book Insights',
          subtitle: 'Non-fiction mental models & 5-minute actionable takeaways',
        };
      case 'YOUTUBE':
      default:
        return {
          title: 'Video Activity Feed',
          subtitle: 'Distilled summaries from followed channels & links',
        };
    }
  }, [activeSpace]);

  const activeSavedCount = useMemo(() => {
    if (activeSpace === 'REDDIT') return savedRedditCount;
    if (activeSpace === 'TMDB') return savedCinemaCount;
    if (activeSpace === 'OPEN_LIBRARY') return savedBookCount;
    return savedVideoCount;
  }, [activeSpace, savedRedditCount, savedCinemaCount, savedBookCount, savedVideoCount]);

  return {
    // YouTube
    videos,
    loading,
    refreshing,
    activeTab,
    setActiveTab,
    favoriteChannelIds,
    readVideoIds,
    bookmarkedVideoIds,
    displayedVideos,
    handleRefresh,
    handleReadSummary,
    handleWatchVideo,
    handleMarkDone,
    handleRestoreVideo,
    handleCopyTakeaways,
    handleShareVideo,
    handleToggleBookmark,

    // Reddit
    redditPosts,
    redditLoading,
    redditRefreshing,
    subreddits,
    activeSubreddit,
    setActiveSubreddit,
    readRedditIds,
    bookmarkedRedditIds,
    displayedRedditPosts,
    loadRedditFeed,
    handleReadRedditSummary,
    handleCopyRedditTakeaways,
    handleToggleRedditBookmark,
    handleShareRedditThread,
    handleMarkRedditDone,
    handleRestoreRedditThread,

    // Cinema
    cinemaPosts,
    cinemaLoading,
    cinemaRefreshing,
    activeCinemaFilter,
    setActiveCinemaFilter,
    readCinemaIds,
    bookmarkedCinemaIds,
    displayedCinemaPosts,
    loadCinemaFeed,
    handleReadReview,
    handleToggleCinemaBookmark,
    handleMarkCinemaWatched,
    handleRestoreCinema,

    // Book
    bookPosts,
    bookLoading,
    bookRefreshing,
    activeBookFilter,
    setActiveBookFilter,
    readBookIds,
    bookmarkedBookIds,
    displayedBookPosts,
    loadBookFeed,
    handleReadBookSummary,
    handleToggleBookBookmark,
    handleMarkBookFinished,
    handleRestoreBook,

    // Storage
    loadStoredData,

    // Counts & Headers
    savedVideoCount,
    customCount,
    completedCount,
    savedRedditCount,
    savedCinemaCount,
    savedBookCount,
    activeSavedCount,
    headerMeta,

    // Celebration Modal
    showSavedCelebrationModal,
    setShowSavedCelebrationModal,
    celebrationVideoTitle,
  };
}

