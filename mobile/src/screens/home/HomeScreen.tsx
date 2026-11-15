import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ListRenderItemInfo,
  Alert,
  Linking,
  Share,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { videosApi, redditApi } from '../../services/api';
import { VideoItem, RedditPostItem } from '../../types/models.types';
import { createHomeStyles } from './HomeScreen.styles';
import {
  FeedTab,
  FeedItemCard,
  RedditDiscussionCard,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const HomeScreen: React.FC<any> = ({ navigation }) => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);

  // Dual Platform Horizon State
  const [activePlatform, setActivePlatform] = useState<'YOUTUBE' | 'REDDIT'>('YOUTUBE');
  const horizontalScrollRef = useRef<any>(null);

  // YouTube Feed State
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

  // Reddit Feed State
  const [redditPosts, setRedditPosts] = useState<RedditPostItem[]>([]);
  const [redditLoading, setRedditLoading] = useState<boolean>(false);
  const [redditRefreshing, setRedditRefreshing] = useState<boolean>(false);
  const [subreddits, setSubreddits] = useState<string[]>(['technology', 'stocks', 'artificial']);
  const [activeSubreddit, setActiveSubreddit] = useState<string>('all');
  const [readRedditIds, setReadRedditIds] = useState<Set<string>>(new Set());
  const [bookmarkedRedditIds, setBookmarkedRedditIds] = useState<Set<string>>(new Set());

  // Load user storage (both YouTube & Reddit)
  const loadStoredData = useCallback(async () => {
    try {
      const [favStored, readStored, bookmarkStored, readRedditStored, bookmarkRedditStored] =
        await Promise.all([
          AsyncStorage.getItem(FAVORITES_STORAGE_KEY),
          AsyncStorage.getItem(READ_VIDEOS_KEY),
          AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY),
          AsyncStorage.getItem(READ_REDDIT_KEY),
          AsyncStorage.getItem(BOOKMARKS_REDDIT_KEY),
        ]);

      if (favStored) setFavoriteChannelIds(new Set(JSON.parse(favStored)));
      if (readStored) setReadVideoIds(new Set(JSON.parse(readStored)));
      if (bookmarkStored) setBookmarkedVideoIds(new Set(JSON.parse(bookmarkStored)));

      if (readRedditStored) setReadRedditIds(new Set(JSON.parse(readRedditStored)));
      if (bookmarkRedditStored) setBookmarkedRedditIds(new Set(JSON.parse(bookmarkRedditStored)));
    } catch {
      // ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStoredData();
    }, [loadStoredData])
  );

  // Load initial YouTube feed
  useEffect(() => {
    let isMounted = true;
    async function loadInitialFeed() {
      try {
        const res = await videosApi.getFeed(1, 40);
        if (isMounted) setVideos(res?.videos || []);
      } catch (err) {
        console.warn('[HomeScreen] Could not fetch YouTube feed:', err);
        if (isMounted) setVideos([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadInitialFeed();
    return () => { isMounted = false; };
  }, []);

  // Fetch Reddit feed
  const loadRedditFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRedditRefreshing(true);
    else setRedditLoading(true);

    try {
      const subOpt = activeSubreddit !== 'all' ? activeSubreddit : undefined;
      const res = await redditApi.getFeed(1, 40, { subreddit: subOpt });
      setRedditPosts(res?.posts || []);

      // Also refresh tracked subreddits list
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

  // Load Reddit posts when activeSubreddit changes or on initial platform switch
  useEffect(() => {
    loadRedditFeed();
  }, [loadRedditFeed]);

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

  // Reddit Refresh
  const handleRedditRefresh = useCallback(() => {
    loadRedditFeed(true);
    loadStoredData();
  }, [loadRedditFeed, loadStoredData]);

  // Platform Horizon Switcher
  const handlePlatformSwitch = useCallback((platform: 'YOUTUBE' | 'REDDIT') => {
    setActivePlatform(platform);
    horizontalScrollRef.current?.scrollTo({
      x: platform === 'YOUTUBE' ? 0 : SCREEN_WIDTH,
      animated: true,
    });
  }, []);

  // YouTube Actions
  const handleReadSummary = useCallback(
    (videoId: string, title: string) => {
      navigation.navigate('SummaryDetail', { videoId, videoTitle: title });
    },
    [navigation]
  );

  const handleWatchVideo = useCallback((videoUrl: string) => {
    if (videoUrl) Linking.openURL(videoUrl);
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
            } catch {}
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
      Alert.alert('Restored', 'This video has been restored to your active Activity Feed.');
    } catch {}
  }, []);

  const handleCopyTakeaways = useCallback((item: VideoItem) => {
    const text = [
      `📌 ${item.title}`,
      `\n💡 At a Glance:\n${item.summary?.overview || item.description || ''}`,
      item.summary?.keyPoints?.length
        ? `\n🎯 Key Takeaways:\n${item.summary.keyPoints.map((k, i) => `${i + 1}. ${k}`).join('\n')}`
        : '',
      item.summary?.conclusion ? `\n🏁 Verdict:\n${item.summary.conclusion}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    Share.share({ message: text });
  }, []);

  const handleToggleBookmark = useCallback(
    async (videoId: string, title: string) => {
      try {
        const stored = await AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY);
        const ids: string[] = stored ? JSON.parse(stored) : [];
        const isCurrentlyBookmarked = ids.includes(videoId);

        let updated: string[];
        if (isCurrentlyBookmarked) {
          updated = ids.filter((id) => id !== videoId);
        } else {
          updated = [...ids, videoId];
          const hasSeenCelebration = await AsyncStorage.getItem(SAVED_CELEBRATION_KEY);
          if (!hasSeenCelebration) {
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

  const handleShareVideo = useCallback((item: VideoItem) => {
    Share.share({
      title: item.title,
      message: `Check out this summary of "${item.title}": ${item.videoUrl}`,
      url: item.videoUrl,
    });
  }, []);

  // Reddit Actions
  const handleReadRedditSummary = useCallback(
    (postId: string, title: string, item: RedditPostItem) => {
      navigation.navigate('SummaryDetail', {
        videoId: postId,
        videoTitle: title,
        isReddit: true,
        redditItem: item,
      });
    },
    [navigation]
  );

  const handleCopyRedditTakeaways = useCallback((item: RedditPostItem) => {
    const text = [
      `💬 r/${item.subreddit}: ${item.title}`,
      `\n💡 Community Consensus:\n${item.summary?.consensus || ''}`,
      item.summary?.keyTakeaways?.length
        ? `\n🎯 4-Part Debate Takeaways:\n${item.summary.keyTakeaways.map((k, i) => `${i + 1}. ${k}`).join('\n')}`
        : '',
      `\n🔗 Thread: ${item.permalink}`,
    ]
      .filter(Boolean)
      .join('\n');
    Share.share({ message: text });
  }, []);

  const handleToggleRedditBookmark = useCallback(async (postId: string) => {
    try {
      const stored = await AsyncStorage.getItem(BOOKMARKS_REDDIT_KEY);
      const ids: string[] = stored ? JSON.parse(stored) : [];
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
      title: item.title,
      message: `Interesting debate on r/${item.subreddit}: "${item.title}"\n${url}`,
      url,
    });
  }, []);

  const handleMarkRedditDone = useCallback((postId: string, title: string) => {
    Alert.alert(
      'Mark Debate Reviewed?',
      `Did you finish reviewing this community discussion on "${title}"?`,
      [
        { text: 'Keep in Feed', style: 'cancel' },
        {
          text: 'Remove from Feed',
          style: 'destructive',
          onPress: async () => {
            try {
              const stored = await AsyncStorage.getItem(READ_REDDIT_KEY);
              const ids: string[] = stored ? JSON.parse(stored) : [];
              if (!ids.includes(postId)) {
                ids.push(postId);
                await AsyncStorage.setItem(READ_REDDIT_KEY, JSON.stringify(ids));
                setReadRedditIds(new Set(ids));
              }
            } catch {}
          },
        },
      ]
    );
  }, []);

  const handleRestoreRedditThread = useCallback(async (postId: string) => {
    try {
      const stored = await AsyncStorage.getItem(READ_REDDIT_KEY);
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        const updated = ids.filter((id) => id !== postId);
        await AsyncStorage.setItem(READ_REDDIT_KEY, JSON.stringify(updated));
        setReadRedditIds(new Set(updated));
      }
      Alert.alert('Restored', 'This discussion has been restored to your Reddit feed.');
    } catch {}
  }, []);

  // Filter YouTube Videos
  const activeVideos = useMemo(
    () => videos.filter((v) => !readVideoIds.has(v.videoId)),
    [videos, readVideoIds]
  );
  const completedVideos = useMemo(
    () => videos.filter((v) => readVideoIds.has(v.videoId)),
    [videos, readVideoIds]
  );
  const customCount = useMemo(
    () => activeVideos.filter((v) => v.isCustomImport || v.channelId === 'imported').length,
    [activeVideos]
  );
  const savedCount = useMemo(
    () => activeVideos.filter((v) => bookmarkedVideoIds.has(v.videoId)).length,
    [activeVideos, bookmarkedVideoIds]
  );

  const displayedVideos = useMemo(() => {
    if (activeTab === 'completed') return completedVideos;
    if (activeTab === 'saved') return activeVideos.filter((v) => bookmarkedVideoIds.has(v.videoId));
    if (activeTab === 'custom') return activeVideos.filter((v) => v.isCustomImport || v.channelId === 'imported');
    if (activeTab === 'favorites') return activeVideos.filter((v) => favoriteChannelIds.has(v.channelId));
    return activeVideos;
  }, [activeVideos, completedVideos, activeTab, favoriteChannelIds, bookmarkedVideoIds]);

  // Filter Reddit Posts
  const activeRedditPosts = useMemo(
    () => redditPosts.filter((p) => !readRedditIds.has(p.externalId)),
    [redditPosts, readRedditIds]
  );
  const savedRedditCount = useMemo(
    () => activeRedditPosts.filter((p) => bookmarkedRedditIds.has(p.externalId)).length,
    [activeRedditPosts, bookmarkedRedditIds]
  );

  const displayedRedditPosts = useMemo(() => {
    if (activeTab === 'saved') {
      return activeRedditPosts.filter((p) => bookmarkedRedditIds.has(p.externalId));
    }
    if (activeSubreddit !== 'all') {
      return activeRedditPosts.filter(
        (p) => p.subreddit.toLowerCase() === activeSubreddit.toLowerCase()
      );
    }
    return activeRedditPosts;
  }, [activeRedditPosts, activeTab, activeSubreddit, bookmarkedRedditIds]);

  // Render Functions
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
        isCompletedView={activeTab === 'completed'}
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
      activeTab,
      cardContainerHeight,
      handleReadRedditSummary,
      handleCopyRedditTakeaways,
      handleToggleRedditBookmark,
      handleShareRedditThread,
      handleMarkRedditDone,
      handleRestoreRedditThread,
    ]
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
      setVideos((prev) => {
        const filtered = prev.filter((v) => v.videoId !== imported.videoId);
        return [{ ...imported, isCustomImport: true }, ...filtered];
      });
      if (activePlatform !== 'YOUTUBE') {
        handlePlatformSwitch('YOUTUBE');
      }
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
  }, [urlInput, navigation, activePlatform, handlePlatformSwitch]);

  return (
    <View style={styles.container}>
      {/* ── Dynamic Top Header (Updates dynamically with platform state) ── */}
      <HomeHeader
        insets={insets}
        styles={styles}
        title={activePlatform === 'YOUTUBE' ? 'Video Activity Feed' : 'Reddit Discussion Feed'}
        subtitle={
          activePlatform === 'YOUTUBE'
            ? 'Distilled summaries from followed channels & links'
            : 'Distilled debates from followed subreddits & links'
        }
        activePlatform={activePlatform}
        onPlatformSwitch={handlePlatformSwitch}
        onSummarizePress={() => setShowImportModal(true)}
      />

      {/* ── Secondary Filter Pills Adapt to Active Page ── */}
      <HomeFilterBar
        platform={activePlatform}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        savedCount={activePlatform === 'YOUTUBE' ? savedCount : savedRedditCount}
        customCount={customCount}
        completedCount={completedVideos.length}
        styles={styles}
        subreddits={subreddits}
        activeSubreddit={activeSubreddit}
        onSelectSubreddit={setActiveSubreddit}
      />

      {/* ── Dual-Feed Horizontal Swipe Horizon Container (Option 3) ── */}
      <View
        style={styles.deckViewport}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - cardContainerHeight) > 4) {
            setCardContainerHeight(h);
          }
        }}>
        <ScrollView
          ref={horizontalScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const pageIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setActivePlatform(pageIndex === 0 ? 'YOUTUBE' : 'REDDIT');
          }}
          style={{ flex: 1 }}>
          {/* PAGE 0: YouTube Video Activity Feed */}
          <View style={{ width: SCREEN_WIDTH, height: '100%' }}>
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
                  setActiveTab(activeTab === 'all' && completedVideos.length > 0 ? 'completed' : 'all')
                }
                onPasteLink={() => setShowImportModal(true)}
                onExploreChannels={() => navigation.navigate('Following')}
                completedCount={completedVideos.length}
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

          {/* PAGE 1: Reddit Discussion Feed */}
          <View style={{ width: SCREEN_WIDTH, height: '100%' }}>
            {redditLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#FF4500" />
                <Text style={styles.loadingText}>Loading community debates...</Text>
              </View>
            ) : displayedRedditPosts.length === 0 ? (
              <View style={[styles.centerContainer, { paddingHorizontal: 32 }]}>
                <Text style={{ fontSize: 36, marginBottom: 12 }}>💬</Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '800',
                    color: colors.textPrimary,
                    textAlign: 'center',
                    marginBottom: 8,
                  }}>
                  No Reddit Debates Yet
                </Text>
                <Text
                  style={{
                    fontSize: 13.5,
                    color: colors.textMuted,
                    textAlign: 'center',
                    lineHeight: 20,
                    marginBottom: 20,
                  }}>
                  Follow your favorite subreddits in the Following tab to distill high-upvote community discussions.
                </Text>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: '#FF4500',
                  }}
                  onPress={() => navigation.navigate('Following')}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                    Manage Subreddits
                  </Text>
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
                    onRefresh={handleRedditRefresh}
                    tintColor="#FF4500"
                  />
                }
              />
            )}
          </View>
        </ScrollView>
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
