import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ListRenderItemInfo,
  Alert,
  Linking,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { usePlatform } from '../../context/PlatformContext';
import { videosApi, redditApi, contentApi } from '../../services/api';
import { VideoItem, RedditPostItem, ContentPostItem } from '../../types/models.types';
import { createHomeStyles } from './HomeScreen.styles';
import {
  FeedTab,
  FeedItemCard,
  RedditDiscussionCard,
  MovieCard,
  BookCard,
  Space3DDeckModal,
  HomeHeader,
  HomeFilterBar,
  FeedEmptyState,
  ImportVideoModal,
  SavedCelebrationModal,
} from './components';

const FAVORITES_STORAGE_KEY = 'sumora:favorite_channel_ids';
const READ_VIDEOS_KEY = 'sumora:read_video_ids';
const BOOKMARKS_STORAGE_KEY = 'sumora:bookmarked_video_ids';
const SAVED_CELEBRATION_KEY = 'sumora:has_seen_saved_celebration';

const READ_REDDIT_KEY = 'sumora:read_reddit_ids';
const BOOKMARKS_REDDIT_KEY = 'sumora:bookmarked_reddit_ids';

const READ_CINEMA_KEY = 'sumora:read_cinema_ids';
const BOOKMARKS_CINEMA_KEY = 'sumora:bookmarked_cinema_ids';

const READ_BOOK_KEY = 'sumora:read_book_ids';
const BOOKMARKS_BOOK_KEY = 'sumora:bookmarked_book_ids';

export const HomeScreen: React.FC<any> = ({ navigation }) => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);

  // Universal Space Horizon State
  const { activeSpace, setActiveSpace } = usePlatform();
  const [showSpaceSwitcherModal, setShowSpaceSwitcherModal] = useState<boolean>(false);

  // Common UI State
  const [cardContainerHeight, setCardContainerHeight] = useState<number>(0);
  const [urlInput, setUrlInput] = useState<string>('');
  const [importing, setImporting] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
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

  // Render items
  const renderVideoItem = useCallback(
    ({ item }: ListRenderItemInfo<VideoItem>) => (
      <FeedItemCard
        item={item}
        styles={styles}
        isFavoriteChannel={favoriteChannelIds.has(item.channelId)}
        isBookmarked={bookmarkedVideoIds.has(item.videoId)}
        isCompletedView={activeTab === 'completed'}
        cardHeight={cardContainerHeight}
        onReadSummary={handleReadSummary}
        onWatchVideo={handleWatchVideo}
        onCopyTakeaways={handleCopyTakeaways}
        onToggleBookmark={handleToggleBookmark}
        onShareVideo={handleShareVideo}
        onMarkDone={handleMarkDone}
        onRestoreVideo={handleRestoreVideo}
      />
    ),
    [
      styles,
      favoriteChannelIds,
      bookmarkedVideoIds,
      activeTab,
      cardContainerHeight,
      handleReadSummary,
      handleWatchVideo,
      handleCopyTakeaways,
      handleToggleBookmark,
      handleShareVideo,
      handleMarkDone,
      handleRestoreVideo,
    ]
  );

  const renderRedditItem = useCallback(
    ({ item }: ListRenderItemInfo<RedditPostItem>) => (
      <RedditDiscussionCard
        item={item}
        styles={styles}
        isBookmarked={bookmarkedRedditIds.has(item.externalId)}
        cardHeight={cardContainerHeight}
        onReadSummary={handleReadRedditSummary}
        onCopyTakeaways={handleCopyRedditTakeaways}
        onToggleBookmark={handleToggleRedditBookmark}
        onShareThread={handleShareRedditThread}
        onMarkDone={handleMarkRedditDone}
        onRestoreThread={handleRestoreRedditThread}
      />
    ),
    [
      styles,
      bookmarkedRedditIds,
      cardContainerHeight,
      handleReadRedditSummary,
      handleCopyRedditTakeaways,
      handleToggleRedditBookmark,
      handleShareRedditThread,
      handleMarkRedditDone,
      handleRestoreRedditThread,
    ]
  );

  const renderCinemaItem = useCallback(
    ({ item }: ListRenderItemInfo<ContentPostItem>) => (
      <MovieCard
        item={item}
        styles={styles}
        isBookmarked={bookmarkedCinemaIds.has(item.externalId)}
        cardHeight={cardContainerHeight}
        onReadReview={handleReadReview}
        onCopyTakeaways={(m) => Alert.alert('Consensus Copied', m.summary?.takeaways?.join('\n\n') || m.title)}
        onToggleBookmark={handleToggleCinemaBookmark}
        onShareMovie={(m) => Share.share({ message: `Check out "${m.title}" (${m.releaseYear}): ${m.url || ''}` })}
        onMarkDone={handleMarkCinemaWatched}
        onRestoreMovie={handleRestoreCinema}
      />
    ),
    [
      styles,
      bookmarkedCinemaIds,
      cardContainerHeight,
      handleReadReview,
      handleToggleCinemaBookmark,
      handleMarkCinemaWatched,
      handleRestoreCinema,
    ]
  );

  const renderBookItem = useCallback(
    ({ item }: ListRenderItemInfo<ContentPostItem>) => (
      <BookCard
        item={item}
        styles={styles}
        isBookmarked={bookmarkedBookIds.has(item.externalId)}
        cardHeight={cardContainerHeight}
        onReadSummary={handleReadBookSummary}
        onCopyTakeaways={(b) => Alert.alert('Mental Models Copied', b.summary?.takeaways?.join('\n\n') || b.title)}
        onToggleBookmark={handleToggleBookBookmark}
        onShareBook={(b) => Share.share({ message: `Distilled Book Takeaways from "${b.title}" by ${b.author}: ${b.url || ''}` })}
        onMarkDone={handleMarkBookFinished}
        onRestoreBook={handleRestoreBook}
      />
    ),
    [
      styles,
      bookmarkedBookIds,
      cardContainerHeight,
      handleReadBookSummary,
      handleToggleBookBookmark,
      handleMarkBookFinished,
      handleRestoreBook,
    ]
  );

  // Global Import Handler
  const handleGlobalImport = useCallback(async () => {
    if (!urlInput.trim()) return;
    setImporting(true);
    try {
      if (urlInput.includes('reddit.com')) {
        setActiveSpace('REDDIT');
        setShowImportModal(false);
        setUrlInput('');
        Alert.alert('Reddit Discussion', 'Importing Reddit discussions via public debate analysis.');
        return;
      }
      const imported = await videosApi.importByUrl(urlInput.trim());
      setShowImportModal(false);
      setUrlInput('');
      setActiveSpace('YOUTUBE');
      navigation.navigate('SummaryDetail', {
        videoId: imported.videoId,
        videoTitle: imported.title,
        channelName: imported.channelName,
        thumbnailUrl: imported.thumbnailUrl,
        publishedAt: imported.publishedAt,
        summary: imported.summary,
      });
    } catch {
      Alert.alert('Import Failed', 'Please verify the URL is valid.');
    } finally {
      setImporting(false);
    }
  }, [urlInput, navigation, setActiveSpace]);

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

  return (
    <View style={styles.container}>
      {/* ── Dynamic Top Header with Universal Space Switcher Dropdown ── */}
      <HomeHeader
        insets={insets}
        styles={styles}
        title={headerMeta.title}
        subtitle={headerMeta.subtitle}
        activeSpace={activeSpace}
        onSpacePillPress={() => setShowSpaceSwitcherModal(true)}
        onSummarizePress={() => setShowImportModal(true)}
      />

      {/* ── Filter Pills Adapt to Active Space ── */}
      <HomeFilterBar
        space={activeSpace}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        savedCount={activeSavedCount}
        customCount={customCount}
        completedCount={completedCount}
        styles={styles}
        subreddits={subreddits}
        activeSubreddit={activeSubreddit}
        onSelectSubreddit={setActiveSubreddit}
        activeFilter={activeSpace === 'TMDB' ? activeCinemaFilter : activeBookFilter}
        onSelectFilter={(f) => {
          if (activeSpace === 'TMDB') setActiveCinemaFilter(f);
          if (activeSpace === 'OPEN_LIBRARY') setActiveBookFilter(f);
        }}
      />

      {/* ── Vertical Snap Deck Viewport ── */}
      <View
        style={styles.deckViewport}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - cardContainerHeight) > 4) {
            setCardContainerHeight(h);
          }
        }}>
        {/* 1. YouTube Space */}
        {activeSpace === 'YOUTUBE' && (
          <View style={styles.deckViewport}>
            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading your video feed...</Text>
              </View>
            ) : displayedVideos.length === 0 ? (
              <FeedEmptyState
                activeTab={activeTab}
                styles={styles}
                onBrowseAll={() =>
                  setActiveTab(activeTab === 'all' && completedCount > 0 ? 'completed' : 'all')
                }
                onPasteLink={() => setShowImportModal(true)}
                onExploreChannels={() => navigation.navigate('Following')}
                completedCount={completedCount}
              />
            ) : (
              <FlatList
                data={displayedVideos}
                keyExtractor={(item) => item.videoId}
                renderItem={renderVideoItem}
                contentContainerStyle={styles.listContentNoPadding}
                pagingEnabled={true}
                snapToInterval={cardContainerHeight > 0 ? cardContainerHeight : undefined}
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum={true}
                showsVerticalScrollIndicator={false}
                initialNumToRender={2}
                maxToRenderPerBatch={4}
                windowSize={5}
                removeClippedSubviews={true}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={colors.primary}
                  />
                }
              />
            )}
          </View>
        )}

        {/* 2. Reddit Space */}
        {activeSpace === 'REDDIT' && (
          <View style={styles.deckViewport}>
            {redditLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#FF4500" />
                <Text style={styles.loadingText}>Loading community debates...</Text>
              </View>
            ) : displayedRedditPosts.length === 0 ? (
              <View style={[styles.centerContainer, styles.redditEmptyContainer]}>
                <Text style={styles.redditEmptyIcon}>💬</Text>
                <Text style={styles.redditEmptyTitle}>No Reddit Debates Yet</Text>
                <Text style={styles.redditEmptySubtitle}>
                  Follow your favorite subreddits in the Following tab to distill high-upvote community discussions.
                </Text>
                <TouchableOpacity
                  style={styles.manageSubredditsBtn}
                  onPress={() => navigation.navigate('Following')}>
                  <Text style={styles.manageSubredditsBtnText}>Manage Subreddits</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={displayedRedditPosts}
                keyExtractor={(item) => item.externalId}
                renderItem={renderRedditItem}
                contentContainerStyle={styles.listContentNoPadding}
                pagingEnabled={true}
                snapToInterval={cardContainerHeight > 0 ? cardContainerHeight : undefined}
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum={true}
                showsVerticalScrollIndicator={false}
                initialNumToRender={2}
                maxToRenderPerBatch={4}
                windowSize={5}
                removeClippedSubviews={true}
                refreshControl={
                  <RefreshControl
                    refreshing={redditRefreshing}
                    onRefresh={() => {
                      loadRedditFeed(true);
                      loadStoredData();
                    }}
                    tintColor="#FF4500"
                  />
                }
              />
            )}
          </View>
        )}

        {/* 3. Cinema (TMDB) Space */}
        {activeSpace === 'TMDB' && (
          <View style={styles.deckViewport}>
            {cinemaLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={styles.loadingText}>Loading cinema radar...</Text>
              </View>
            ) : displayedCinemaPosts.length === 0 ? (
              <View style={[styles.centerContainer, styles.redditEmptyContainer]}>
                <Text style={styles.redditEmptyIcon}>🎬</Text>
                <Text style={styles.redditEmptyTitle}>No Cinema Cards Found</Text>
                <Text style={styles.redditEmptySubtitle}>
                  Explore trending movies or filter by Netflix, Max, or Top Rated.
                </Text>
                <TouchableOpacity
                  style={[styles.manageSubredditsBtn, { backgroundColor: '#F59E0B' }]}
                  onPress={() => setActiveCinemaFilter('Trending Today')}>
                  <Text style={styles.manageSubredditsBtnText}>View Trending</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={displayedCinemaPosts}
                keyExtractor={(item) => item.externalId}
                renderItem={renderCinemaItem}
                contentContainerStyle={styles.listContentNoPadding}
                pagingEnabled={true}
                snapToInterval={cardContainerHeight > 0 ? cardContainerHeight : undefined}
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum={true}
                showsVerticalScrollIndicator={false}
                initialNumToRender={2}
                maxToRenderPerBatch={4}
                windowSize={5}
                removeClippedSubviews={true}
                refreshControl={
                  <RefreshControl
                    refreshing={cinemaRefreshing}
                    onRefresh={() => {
                      loadCinemaFeed(true);
                      loadStoredData();
                    }}
                    tintColor="#F59E0B"
                  />
                }
              />
            )}
          </View>
        )}

        {/* 4. Book (Open Library) Space */}
        {activeSpace === 'OPEN_LIBRARY' && (
          <View style={styles.deckViewport}>
            {bookLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Loading book mental models...</Text>
              </View>
            ) : displayedBookPosts.length === 0 ? (
              <View style={[styles.centerContainer, styles.redditEmptyContainer]}>
                <Text style={styles.redditEmptyIcon}>📚</Text>
                <Text style={styles.redditEmptyTitle}>No Book Insights Found</Text>
                <Text style={styles.redditEmptySubtitle}>
                  Explore popular non-fiction mental models across Psychology, Productivity, and Wealth.
                </Text>
                <TouchableOpacity
                  style={[styles.manageSubredditsBtn, { backgroundColor: '#10B981' }]}
                  onPress={() => setActiveBookFilter('All Books')}>
                  <Text style={styles.manageSubredditsBtnText}>Browse All Books</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={displayedBookPosts}
                keyExtractor={(item) => item.externalId}
                renderItem={renderBookItem}
                contentContainerStyle={styles.listContentNoPadding}
                pagingEnabled={true}
                snapToInterval={cardContainerHeight > 0 ? cardContainerHeight : undefined}
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum={true}
                showsVerticalScrollIndicator={false}
                initialNumToRender={2}
                maxToRenderPerBatch={4}
                windowSize={5}
                removeClippedSubviews={true}
                refreshControl={
                  <RefreshControl
                    refreshing={bookRefreshing}
                    onRefresh={() => {
                      loadBookFeed(true);
                      loadStoredData();
                    }}
                    tintColor="#10B981"
                  />
                }
              />
            )}
          </View>
        )}
      </View>

      {/* ── 3D Perspective Space Deck Modal (Cover Flow) ── */}
      <Space3DDeckModal
        visible={showSpaceSwitcherModal}
        activeSpace={activeSpace}
        onSelectSpace={(space) => {
          setActiveSpace(space);
          if (space === 'TMDB') setActiveCinemaFilter('Trending Today');
          if (space === 'OPEN_LIBRARY') setActiveBookFilter('All Books');
          if (space === 'REDDIT') setActiveSubreddit('all');
        }}
        onClose={() => setShowSpaceSwitcherModal(false)}
      />

      {/* ── Modal: Paste Link to Summarize ── */}
      <ImportVideoModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        urlInput={urlInput}
        onChangeUrlInput={setUrlInput}
        onImport={handleGlobalImport}
        importing={importing}
        styles={styles}
        colors={colors}
      />

      {/* ── Celebration Modal: First Bookmark Discovery ── */}
      <SavedCelebrationModal
        visible={showSavedCelebrationModal}
        videoTitle={celebrationVideoTitle}
        styles={styles}
        onViewSaved={() => {
          setShowSavedCelebrationModal(false);
          setActiveTab('saved');
        }}
        onDismiss={() => setShowSavedCelebrationModal(false)}
      />
    </View>
  );
};
