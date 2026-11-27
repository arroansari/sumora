import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Alert, Linking, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { videosApi, redditApi, contentApi, sourcesApi } from '../../../services/api';
import { VideoItem, RedditPostItem, ContentPostItem, TrackedSource } from '../../../types/models.types';
import { FeedTab } from '../components/HomeFilterBar';

export interface FeedChannelOption {
  channelId: string;
  channelName: string;
  thumbnailUrl?: string | null;
  videoCount: number;
}

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
export const CHANNEL_AVATARS_STORAGE_KEY = 'sumora:channel_avatars';

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
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [trackedYouTubeChannels, setTrackedYouTubeChannels] = useState<TrackedSource[]>([]);
  const [favoriteChannelIds, setFavoriteChannelIds] = useState<Set<string>>(new Set());
  const [readVideoIds, setReadVideoIds] = useState<Set<string>>(new Set());
  const [bookmarkedVideoIds, setBookmarkedVideoIds] = useState<Set<string>>(new Set());
  const [channelAvatarMap, setChannelAvatarMap] = useState<Record<string, string>>({});

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

  // Perf refs: avoid duplicate boot requests, tab-switch refetch storms, and redundant Set allocations
  const rawStorageRef = useRef<Record<string, string | null>>({});
  const lastFetchedRef = useRef<Record<string, number>>({});
  const loadedSpacesRef = useRef<Set<string>>(new Set());

  // Load user storage across all 4 domains cleanly (only updates state when raw value changes)
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
        avatarStored,
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
        AsyncStorage.getItem(CHANNEL_AVATARS_STORAGE_KEY),
      ]);

      const cache = rawStorageRef.current;
      if (favStored && favStored !== cache[FAVORITES_STORAGE_KEY]) {
        cache[FAVORITES_STORAGE_KEY] = favStored;
        setFavoriteChannelIds(new Set(JSON.parse(favStored)));
      }
      if (readStored && readStored !== cache[READ_VIDEOS_KEY]) {
        cache[READ_VIDEOS_KEY] = readStored;
        setReadVideoIds(new Set(JSON.parse(readStored)));
      }
      if (bookmarkStored && bookmarkStored !== cache[BOOKMARKS_STORAGE_KEY]) {
        cache[BOOKMARKS_STORAGE_KEY] = bookmarkStored;
        setBookmarkedVideoIds(new Set(JSON.parse(bookmarkStored)));
      }
      if (avatarStored && avatarStored !== cache[CHANNEL_AVATARS_STORAGE_KEY]) {
        cache[CHANNEL_AVATARS_STORAGE_KEY] = avatarStored;
        try {
          setChannelAvatarMap(JSON.parse(avatarStored));
        } catch {}
      }

      if (readRedditStored && readRedditStored !== cache[READ_REDDIT_KEY]) {
        cache[READ_REDDIT_KEY] = readRedditStored;
        setReadRedditIds(new Set(JSON.parse(readRedditStored)));
      }
      if (bookmarkRedditStored && bookmarkRedditStored !== cache[BOOKMARKS_REDDIT_KEY]) {
        cache[BOOKMARKS_REDDIT_KEY] = bookmarkRedditStored;
        setBookmarkedRedditIds(new Set(JSON.parse(bookmarkRedditStored)));
      }

      if (readCinemaStored && readCinemaStored !== cache[READ_CINEMA_KEY]) {
        cache[READ_CINEMA_KEY] = readCinemaStored;
        setReadCinemaIds(new Set(JSON.parse(readCinemaStored)));
      }
      if (bookmarkCinemaStored && bookmarkCinemaStored !== cache[BOOKMARKS_CINEMA_KEY]) {
        cache[BOOKMARKS_CINEMA_KEY] = bookmarkCinemaStored;
        setBookmarkedCinemaIds(new Set(JSON.parse(bookmarkCinemaStored)));
      }

      if (readBookStored && readBookStored !== cache[READ_BOOK_KEY]) {
        cache[READ_BOOK_KEY] = readBookStored;
        setReadBookIds(new Set(JSON.parse(readBookStored)));
      }
      if (bookmarkBookStored && bookmarkBookStored !== cache[BOOKMARKS_BOOK_KEY]) {
        cache[BOOKMARKS_BOOK_KEY] = bookmarkBookStored;
        setBookmarkedBookIds(new Set(JSON.parse(bookmarkBookStored)));
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch YouTube feed
  const loadYouTubeFeed = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const [res, sources] = await Promise.all([
        videosApi.getFeed(1, 40),
        sourcesApi.list({ platform: 'youtube' }).catch(() => null),
      ]);
      if (res?.videos) {
        setVideos(res.videos);
      }
      if (Array.isArray(sources)) {
        setTrackedYouTubeChannels(sources);
        const map: Record<string, string> = {};
        for (const s of sources) {
          if (s.sourceId && s.thumbnailUrl) {
            map[s.sourceId] = s.thumbnailUrl;
          }
        }
        setChannelAvatarMap((prev) => {
          const next = { ...prev, ...map };
          AsyncStorage.setItem(CHANNEL_AVATARS_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });
      }
      loadedSpacesRef.current.add('YOUTUBE');
      lastFetchedRef.current.YOUTUBE = Date.now();
    } catch (err) {
      console.warn('[HomeScreen] Could not fetch YouTube feed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Reddit feed
  const loadRedditFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRedditRefreshing(true);
    else if (!loadedSpacesRef.current.has('REDDIT')) setRedditLoading(true);

    try {
      const subOpt = activeSubreddit !== 'all' ? activeSubreddit : undefined;
      const res = await redditApi.getFeed(1, 40, { subreddit: subOpt });
      setRedditPosts(res?.posts || []);

      const tracked = await redditApi.listSources().catch(() => []);
      if (tracked.length > 0) {
        setSubreddits(tracked.map((t) => t.sourceId));
      }
      loadedSpacesRef.current.add('REDDIT');
      lastFetchedRef.current.REDDIT = Date.now();
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
    else if (!loadedSpacesRef.current.has('TMDB')) setCinemaLoading(true);

    try {
      const filterOpt = activeCinemaFilter !== 'Saved' ? activeCinemaFilter : undefined;
      const res = await contentApi.getFeed('TMDB', 1, 40, { filter: filterOpt });
      setCinemaPosts(res?.posts || []);
      loadedSpacesRef.current.add('TMDB');
      lastFetchedRef.current.TMDB = Date.now();
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
    else if (!loadedSpacesRef.current.has('OPEN_LIBRARY')) setBookLoading(true);

    try {
      const filterOpt = activeBookFilter !== 'Saved' && activeBookFilter !== 'All Books' ? activeBookFilter : undefined;
      const res = await contentApi.getFeed('OPEN_LIBRARY', 1, 40, { filter: filterOpt });
      setBookPosts(res?.posts || []);
      loadedSpacesRef.current.add('OPEN_LIBRARY');
      lastFetchedRef.current.OPEN_LIBRARY = Date.now();
    } catch (err) {
      console.warn('[HomeScreen] Could not fetch Book feed:', err);
    } finally {
      setBookLoading(false);
      setBookRefreshing(false);
    }
  }, [activeBookFilter]);

  const prevCinemaFilterRef = useRef(activeCinemaFilter);
  const prevBookFilterRef = useRef(activeBookFilter);
  const prevRedditSubRef = useRef(activeSubreddit);

  // Lazy load active space on mount/space change; reuse cached results within 15s focus cooldown
  useFocusEffect(
    useCallback(() => {
      loadStoredData();
      const now = Date.now();
      const last = lastFetchedRef.current[activeSpace] || 0;
      const isInitialForSpace = !loadedSpacesRef.current.has(activeSpace);
      if (isInitialForSpace || now - last > 15000) {
        if (activeSpace === 'YOUTUBE') loadYouTubeFeed(isInitialForSpace);
        else if (activeSpace === 'REDDIT') loadRedditFeed(false);
        else if (activeSpace === 'TMDB') loadCinemaFeed(false);
        else if (activeSpace === 'OPEN_LIBRARY') loadBookFeed(false);
      }
    }, [activeSpace, loadStoredData, loadYouTubeFeed, loadRedditFeed, loadCinemaFeed, loadBookFeed])
  );

  // Refetch only when active space's sub-filter changes (not on initial mount)
  useEffect(() => {
    if (prevCinemaFilterRef.current === activeCinemaFilter) return;
    prevCinemaFilterRef.current = activeCinemaFilter;
    if (activeSpace === 'TMDB') loadCinemaFeed(false);
  }, [activeSpace, activeCinemaFilter, loadCinemaFeed]);

  useEffect(() => {
    if (prevBookFilterRef.current === activeBookFilter) return;
    prevBookFilterRef.current = activeBookFilter;
    if (activeSpace === 'OPEN_LIBRARY') loadBookFeed(false);
  }, [activeSpace, activeBookFilter, loadBookFeed]);

  useEffect(() => {
    if (prevRedditSubRef.current === activeSubreddit) return;
    prevRedditSubRef.current = activeSubreddit;
    if (activeSpace === 'REDDIT') loadRedditFeed(false);
  }, [activeSpace, activeSubreddit, loadRedditFeed]);

  // YouTube Refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const favList = Array.from(favoriteChannelIds);
      await videosApi.syncFeed(favList).catch(() => {});
      const [res, sources] = await Promise.all([
        videosApi.getFeed(1, 40),
        sourcesApi.list({ platform: 'youtube' }).catch(() => null),
      ]);
      if (res?.videos) setVideos(res.videos);
      if (Array.isArray(sources)) setTrackedYouTubeChannels(sources);
      lastFetchedRef.current.YOUTUBE = Date.now();
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
        space: 'YOUTUBE',
        channelName: item?.channelName,
        thumbnailUrl: item?.thumbnailUrl,
        publishedAt: item?.publishedAt,
        url: item?.videoUrl,
        readTime: '1-2 Min Read',
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
        space: 'REDDIT',
        channelName: `r/${item.subreddit}`,
        thumbnailUrl: item.url || undefined,
        publishedAt: item.publishedAt,
        url: item.permalink?.startsWith('http')
          ? item.permalink
          : `https://www.reddit.com${item.permalink || ''}`,
        readTime: '3-Min Read',
        isReddit: true,
        redditItem: item,
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
        space: 'TMDB',
        channelName: item.author || 'TMDB Cinema',
        thumbnailUrl: item.posterUrl || item.backdropUrl,
        publishedAt: item.publishedAt,
        url: item.url,
        readTime: item.runtime || '2-Min Read',
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
        space: 'OPEN_LIBRARY',
        channelName: item.author || 'Author',
        thumbnailUrl: item.posterUrl,
        publishedAt: item.publishedAt,
        url: item.url,
        readTime: item.readTime || '5-Min Read',
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

  // Tracked YouTube channels actually appearing in the current feed list
  const availableFeedChannels = useMemo<FeedChannelOption[]>(() => {
    const activeTrackedMap = new Map<string, TrackedSource>();
    for (const src of trackedYouTubeChannels) {
      if (src.platform === 'youtube' && src.isActive !== false && src.sourceId) {
        activeTrackedMap.set(src.sourceId, src);
      }
    }

    const requireTrackedMatch = activeTrackedMap.size > 0;
    const feedBase =
      activeTab === 'completed'
        ? videos.filter((v) => readVideoIds.has(v.videoId))
        : videos.filter((v) => !readVideoIds.has(v.videoId));

    const counts = new Map<string, FeedChannelOption>();
    for (const v of feedBase) {
      if (!v.channelId || v.channelId === 'imported' || v.isCustomImport) continue;
      if (requireTrackedMatch && !activeTrackedMap.has(v.channelId)) continue;

      const tracked = activeTrackedMap.get(v.channelId);
      const existing = counts.get(v.channelId);
      if (existing) {
        existing.videoCount += 1;
      } else {
        counts.set(v.channelId, {
          channelId: v.channelId,
          channelName: tracked?.sourceName || v.channelName || 'YouTube Channel',
          thumbnailUrl: tracked?.thumbnailUrl || channelAvatarMap[v.channelId] || null,
          videoCount: 1,
        });
      }
    }

    return Array.from(counts.values()).sort(
      (a, b) => b.videoCount - a.videoCount || a.channelName.localeCompare(b.channelName)
    );
  }, [trackedYouTubeChannels, videos, readVideoIds, activeTab, channelAvatarMap]);

  const selectedChannelOption = useMemo<FeedChannelOption | null>(() => {
    if (!selectedChannelId) return null;
    const inFeed = availableFeedChannels.find((c) => c.channelId === selectedChannelId);
    if (inFeed) return inFeed;
    const tracked = trackedYouTubeChannels.find((s) => s.sourceId === selectedChannelId);
    if (tracked) {
      return {
        channelId: selectedChannelId,
        channelName: tracked.sourceName,
        thumbnailUrl: tracked.thumbnailUrl || channelAvatarMap[selectedChannelId] || null,
        videoCount: 0,
      };
    }
    return null;
  }, [selectedChannelId, availableFeedChannels, trackedYouTubeChannels, channelAvatarMap]);

  // Filtered Feeds
  const displayedVideos = useMemo(() => {
    const active = videos.filter((v) => !readVideoIds.has(v.videoId));
    const completed = videos.filter((v) => readVideoIds.has(v.videoId));
    let base: VideoItem[];
    if (activeTab === 'completed') base = completed;
    else if (activeTab === 'saved') base = active.filter((v) => bookmarkedVideoIds.has(v.videoId));
    else if (activeTab === 'custom') base = active.filter((v) => v.isCustomImport || v.channelId === 'imported');
    else if (activeTab === 'favorites') base = active.filter((v) => favoriteChannelIds.has(v.channelId));
    else base = active;

    if (selectedChannelId && activeTab !== 'custom') {
      return base.filter((v) => v.channelId === selectedChannelId);
    }
    return base;
  }, [videos, readVideoIds, activeTab, bookmarkedVideoIds, favoriteChannelIds, selectedChannelId]);

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
    selectedChannelId,
    setSelectedChannelId,
    availableFeedChannels,
    selectedChannelOption,
    favoriteChannelIds,
    readVideoIds,
    bookmarkedVideoIds,
    channelAvatarMap,
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

