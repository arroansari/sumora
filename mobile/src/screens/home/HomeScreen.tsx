import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
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
import { videosApi } from '../../services/api';
import { VideoItem } from '../../types/models.types';
import { createHomeStyles } from './HomeScreen.styles';
import {
  FeedTab,
  FeedItemCard,
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

export const HomeScreen: React.FC<any> = ({ navigation }) => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>('');
  const [importing, setImporting] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<FeedTab>('all');
  const [cardContainerHeight, setCardContainerHeight] = useState<number>(0);
  const [favoriteChannelIds, setFavoriteChannelIds] = useState<Set<string>>(new Set());
  const [readVideoIds, setReadVideoIds] = useState<Set<string>>(new Set());
  const [bookmarkedVideoIds, setBookmarkedVideoIds] = useState<Set<string>>(new Set());
  const [showSavedCelebrationModal, setShowSavedCelebrationModal] = useState<boolean>(false);
  const [celebrationVideoTitle, setCelebrationVideoTitle] = useState<string>('');

  // Load user's starred favorite channels, read/completed video IDs, and bookmarks
  const loadStoredData = useCallback(async () => {
    try {
      const [favStored, readStored, bookmarkStored] = await Promise.all([
        AsyncStorage.getItem(FAVORITES_STORAGE_KEY),
        AsyncStorage.getItem(READ_VIDEOS_KEY),
        AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY),
      ]);
      if (favStored) {
        setFavoriteChannelIds(new Set(JSON.parse(favStored)));
      }
      if (readStored) {
        setReadVideoIds(new Set(JSON.parse(readStored)));
      }
      if (bookmarkStored) {
        setBookmarkedVideoIds(new Set(JSON.parse(bookmarkStored)));
      }
    } catch {
      // ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStoredData();
    }, [loadStoredData])
  );

  const handleGlobalImport = useCallback(async () => {
    if (!urlInput.trim()) {
      Alert.alert('Link Required', 'Please paste a valid YouTube video or Shorts link.');
      return;
    }

    setImporting(true);
    try {
      const imported = await videosApi.importByUrl(urlInput.trim());
      setShowImportModal(false);
      setUrlInput('');

      // Prepend to feed immediately so it appears at top of Activity Feed
      setVideos((prev) => {
        const filtered = prev.filter((v) => v.videoId !== imported.videoId);
        return [{ ...imported, isCustomImport: true }, ...filtered];
      });

      // Switch to custom links or all feed so user sees it right away
      if (activeTab === 'favorites' || activeTab === 'completed') {
        setActiveTab('custom');
      }

      // Navigate straight to the summary
      navigation.navigate('SummaryDetail', {
        videoId: imported.videoId,
        videoTitle: imported.title,
      });
    } catch (err: any) {
      Alert.alert(
        'Summarization Failed',
        err.message || 'Could not fetch this YouTube video. Please check the URL and try again.'
      );
    } finally {
      setImporting(false);
    }
  }, [urlInput, navigation, activeTab]);

  // Performance-optimized mount effect: fetching logic declared inside useEffect with cleanup
  useEffect(() => {
    let isMounted = true;

    async function loadInitialFeed() {
      try {
        const res = await videosApi.getFeed(1, 40);
        if (isMounted) {
          setVideos(res?.videos || []);
        }
      } catch (err) {
        console.warn('[HomeScreen] Could not fetch remote feed:', err);
        if (isMounted) {
          setVideos([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInitialFeed();

    return () => {
      isMounted = false;
    };
  }, []);

  // Dedicated refresh handler: queries YouTube for fresh uploads, then reloads the feed
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // 1. Auto-fetch fresh YouTube uploads for favorite & followed channels
      const favList = Array.from(favoriteChannelIds);
      await videosApi.syncFeed(favList).catch((err) => {
        console.warn('[HomeScreen] Auto-fetch YouTube note:', err.message);
      });

      // 2. Fetch updated feed from database
      const res = await videosApi.getFeed(1, 40);
      setVideos(res.videos);
      await loadStoredData();
    } catch (err) {
      console.warn('[HomeScreen] Feed refresh failed:', (err as Error)?.message);
    } finally {
      setRefreshing(false);
    }
  }, [favoriteChannelIds, loadStoredData]);

  const handleReadSummary = useCallback(
    (videoId: string, title: string) => {
      navigation.navigate('SummaryDetail', {
        videoId,
        videoTitle: title,
      });
    },
    [navigation]
  );

  const handleWatchVideo = useCallback((videoUrl: string) => {
    if (videoUrl) {
      Linking.openURL(videoUrl);
    }
  }, []);

  const handleMarkDone = useCallback((videoId: string, title: string) => {
    Alert.alert(
      'Mark as Completed?',
      `Did you finish reading or watching "${title}"? This will automatically remove it from your active feed.`,
      [
        { text: 'Keep in Feed', style: 'cancel' },
        {
          text: 'Remove from Feed',
          style: 'destructive',
          onPress: async () => {
            try {
              const stored = await AsyncStorage.getItem(READ_VIDEOS_KEY);
              const ids: string[] = stored ? JSON.parse(stored) : [];
              if (!ids.includes(videoId)) {
                ids.push(videoId);
                await AsyncStorage.setItem(READ_VIDEOS_KEY, JSON.stringify(ids));
                setReadVideoIds(new Set(ids));
              }
            } catch { }
          },
        },
      ]
    );
  }, []);

  const handleRestoreVideo = useCallback(async (videoId: string) => {
    try {
      const stored = await AsyncStorage.getItem(READ_VIDEOS_KEY);
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        const updated = ids.filter((id) => id !== videoId);
        await AsyncStorage.setItem(READ_VIDEOS_KEY, JSON.stringify(updated));
        setReadVideoIds(new Set(updated));
      }
    } catch { }
  }, []);

  const handleToggleBookmark = useCallback(async (videoId: string, title: string) => {
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY);
      const ids: string[] = stored ? JSON.parse(stored) : [];
      let updated: string[];
      const isAlready = ids.includes(videoId);
      if (isAlready) {
        updated = ids.filter((id) => id !== videoId);
      } else {
        updated = [...ids, videoId];
      }
      await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));
      setBookmarkedVideoIds(new Set(updated));

      // Celebration onboarding triggers ONLY ONCE per installation when saved count goes from 0 to 1
      if (!isAlready && ids.length === 0) {
        const hasSeenCelebration = await AsyncStorage.getItem(SAVED_CELEBRATION_KEY);
        if (!hasSeenCelebration) {
          await AsyncStorage.setItem(SAVED_CELEBRATION_KEY, 'true');
          setCelebrationVideoTitle(title);
          setShowSavedCelebrationModal(true);
        }
      }
    } catch (err: any) {
      console.warn('[HomeScreen] Bookmark toggle note:', err.message);
    }
  }, []);

  const handleCopyTakeaways = useCallback((item: VideoItem) => {
    const bullets = item.summary?.keyPoints && item.summary.keyPoints.length > 0
      ? item.summary.keyPoints.slice(0, 4).map((p) => `• ${p.replace(/^[-•*]\s*/, '').trim()}`).join('\n')
      : item.summary?.overview || item.description || 'Summary ready.';

    const text = [
      `📌 ${item.title}`,
      `Channel: ${item.channelName || 'YouTube'}`,
      `\n💡 60-Second Takeaways:\n${bullets}`,
      item.videoUrl ? `\n🔗 Watch: ${item.videoUrl}` : '',
      `\nDistilled by Sumora`,
    ]
      .filter(Boolean)
      .join('\n');

    Share.share({ message: text, title: item.title });
  }, []);

  const handleShareVideo = useCallback((item: VideoItem) => {
    const overview = item.summary?.overview || item.description || '';
    const text = [
      `✨ Summary of "${item.title}":`,
      overview ? `\n${overview}` : '',
      item.videoUrl ? `\n🔗 Watch Video: ${item.videoUrl}` : '',
      `\nDistilled by Sumora`,
    ]
      .filter(Boolean)
      .join('\n');

    Share.share({
      message: text,
      url: item.videoUrl,
      title: item.title,
    });
  }, []);

  const keyExtractor = useCallback((item: VideoItem) => item.id || item.videoId, []);

  // Split videos into unread active feed vs completed archive
  const activeVideos = useMemo(() => {
    return videos.filter((v) => !readVideoIds.has(v.videoId));
  }, [videos, readVideoIds]);

  const completedVideos = useMemo(() => {
    return videos.filter((v) => readVideoIds.has(v.videoId));
  }, [videos, readVideoIds]);

  const customCount = useMemo(() => {
    return activeVideos.filter((v) => v.isCustomImport || v.channelId === 'imported').length;
  }, [activeVideos]);

  const savedCount = useMemo(() => {
    return activeVideos.filter((v) => bookmarkedVideoIds.has(v.videoId)).length;
  }, [activeVideos, bookmarkedVideoIds]);

  const displayedVideos = useMemo(() => {
    if (activeTab === 'completed') {
      return completedVideos;
    }
    if (activeTab === 'saved') {
      return activeVideos.filter((v) => bookmarkedVideoIds.has(v.videoId));
    }
    if (activeTab === 'custom') {
      return activeVideos.filter((v) => v.isCustomImport || v.channelId === 'imported');
    }
    if (activeTab === 'favorites') {
      return activeVideos.filter((v) => favoriteChannelIds.has(v.channelId));
    }
    return activeVideos;
  }, [activeVideos, completedVideos, activeTab, favoriteChannelIds, bookmarkedVideoIds]);

  const renderItem = useCallback(
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

  return (
    <View style={styles.container}>
      {/* ── Curved Gradient Header Banner ── */}
      <HomeHeader
        insets={insets}
        styles={styles}
        onSummarizePress={() => setShowImportModal(true)}
      />

      {/* ── Quick Feed Filter Bar ── */}
      <HomeFilterBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        savedCount={savedCount}
        customCount={customCount}
        completedCount={completedVideos.length}
        styles={styles}
      />

      {/* ── Main Feed Viewport Area (Inshorts Vertical Card Deck) ── */}
      <View
        style={styles.deckViewport}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - cardContainerHeight) > 4) {
            setCardContainerHeight(h);
          }
        }}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading your feed...</Text>
          </View>
        ) : displayedVideos.length === 0 ? (
          <FeedEmptyState
            activeTab={activeTab}
            styles={styles}
            onBrowseAll={() => setActiveTab(activeTab === 'all' && completedVideos.length > 0 ? 'completed' : 'all')}
            onPasteLink={() => setShowImportModal(true)}
            onExploreChannels={() => navigation.navigate('Following')}
            completedCount={completedVideos.length}
          />
        ) : (
          <FlatList
            data={displayedVideos}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
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

      {/* ── Modal: Paste YouTube Link to Summarize ── */}
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
