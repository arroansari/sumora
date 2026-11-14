import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  RefreshControl,
  ListRenderItemInfo,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native';
import FastImage, { ImageStyle } from '@d11/react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { videosApi } from '../../services/api';
import { VideoItem, SummaryStatus } from '../../types/models.types';
import { createHomeStyles } from './HomeScreen.styles';
import { GradientButton } from '../../components/atoms';

const FAVORITES_STORAGE_KEY = 'sumora:favorite_channel_ids';
const READ_VIDEOS_KEY = 'sumora:read_video_ids';

type FeedTab = 'all' | 'custom' | 'favorites' | 'completed';

interface FeedCardProps {
  item: VideoItem;
  styles: ReturnType<typeof createHomeStyles>;
  isFavoriteChannel?: boolean;
  isCompletedView?: boolean;
  cardHeight?: number;
  onReadSummary: (videoId: string, title: string) => void;
  onWatchVideo: (videoUrl: string) => void;
  onMarkDone?: (videoId: string, title: string) => void;
  onRestoreVideo?: (videoId: string) => void;
}

const getStatusConfig = (status: SummaryStatus) => {
  switch (status) {
    case 'completed':
      return { dot: '#10B981', label: 'Summary Ready' };
    case 'processing':
      return { dot: '#60A5FA', label: 'Generating Summary...' };
    case 'fetching_transcript':
      return { dot: '#60A5FA', label: 'Fetching Transcript...' };
    case 'transcript_unavailable':
      return { dot: '#FBBF24', label: 'Transcript Unavailable' };
    case 'failed':
      return { dot: '#F87171', label: 'Summary Failed' };
    default:
      return { dot: '#94A3B8', label: 'Pending' };
  }
};

const FeedItemCard = React.memo<FeedCardProps>(
  ({
    item,
    styles,
    isFavoriteChannel,
    isCompletedView,
    cardHeight,
    onReadSummary,
    onWatchVideo,
    onMarkDone,
    onRestoreVideo,
  }) => {
    const publishedFormatted = item.publishedAt
      ? new Date(item.publishedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      : 'Recently';

    const shortOverview =
      item.summary?.overview ||
      (item.summaryStatus === 'completed'
        ? 'Summary ready to read.'
        : item.summaryStatus === 'transcript_unavailable'
          ? 'An accessible transcript could not be retrieved, so a summary cannot be generated yet.'
          : item.summaryStatus === 'failed'
            ? 'Unable to generate summary. We will retry where appropriate.'
            : 'Your video summary is being prepared.');

    const statusConfig = getStatusConfig(item.summaryStatus);
    const isCustom = item.isCustomImport || item.channelId === 'imported';

    const takeawayBullets = useMemo(() => {
      if (item.summary?.keyPoints && item.summary.keyPoints.length > 0) {
        return item.summary.keyPoints
          .slice(0, 3)
          .map((p) => p.replace(/^[-•*]\s*/, '').trim());
      }
      const text = item.summary?.overview || item.description || shortOverview;
      if (text) {
        const sentences = text
          .split(/(?<=[.?!])\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 12);
        if (sentences.length > 0) {
          return sentences.slice(0, 3);
        }
      }
      return [shortOverview];
    }, [item.summary, item.description, shortOverview]);

    return (
      <View style={[styles.card, cardHeight && cardHeight > 0 ? { height: cardHeight - 16, marginBottom: 16 } : null]}>
        <View style={styles.thumbnailContainer}>
          {item.thumbnailUrl ? (
            <FastImage
              source={{
                uri: item.thumbnailUrl,
                priority: FastImage.priority.high,
                cache: FastImage.cacheControl.immutable,
              }}
              style={styles.thumbnail as ImageStyle}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Text style={{ fontSize: 32 }}>▶</Text>
            </View>
          )}
          <View style={styles.badgeOverlay}>
            {item.summaryStatus === 'completed' ? (
              <View style={styles.statusBadgeShadowWrapper}>
                <View style={styles.statusBadgeGradientWrapper}>
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      { borderRadius: 14, overflow: 'hidden' },
                    ]}
                    pointerEvents="none">
                    <Image
                      source={require('../../assets/images/button_gradient.png')}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={styles.statusSparkle}>✦</Text>
                  <Text style={styles.statusBadgeGradientText}>Summary Ready</Text>
                </View>
              </View>
            ) : (
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: statusConfig.dot }]} />
                <Text style={styles.statusBadgeText}>
                  {statusConfig.label}
                </Text>
              </View>
            )}
            {isCustom ? (
              <View style={styles.customBadge}>
                <Text style={styles.customBadgeText}>🔗 Custom Link</Text>
              </View>
            ) : isFavoriteChannel ? (
              <View style={styles.favoriteBadge}>
                <Text style={styles.favoriteBadgeText}>⭐ Priority</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.channelRow}>
            <Text style={styles.channelName}>{item.channelName || (isCustom ? 'Custom Link' : 'YouTube Creator')}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.dateText}>{publishedFormatted}</Text>
          </View>

          {/* 60-Second Inshorts Key Takeaways */}
          <View style={styles.takeawaysContainer}>
            <View style={styles.takeawaysHeader}>
              <Text style={styles.takeawaysIcon}>💡</Text>
              <Text style={styles.takeawaysTitle}>60-Second Takeaways</Text>
            </View>
            {takeawayBullets.map((bullet, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText} numberOfLines={2}>
                  {bullet}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.readButtonLavender}
              onPress={() => onReadSummary(item.videoId, item.title)}
              activeOpacity={0.8}>
              <Text style={styles.readButtonTextLavender}>Read Summary</Text>
            </TouchableOpacity>

            <GradientButton
              title="Watch"
              onPress={() => onWatchVideo(item.videoUrl)}
              style={styles.watchGradientBtn}
            />

            {isCompletedView ? (
              <TouchableOpacity
                style={styles.restoreButton}
                onPress={() => onRestoreVideo?.(item.videoId)}
                activeOpacity={0.75}>
                <Text style={styles.restoreButtonText}>↺</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => onMarkDone?.(item.videoId, item.title)}
                activeOpacity={0.75}>
                <Text style={styles.doneButtonText}>✓ Done</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.swipePromptRow}>
            <Text style={styles.swipePromptText}>▲ Swipe up for next video</Text>
          </View>
        </View>
      </View>
    );
  }
);

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

  // Load user's starred favorite channels and completed/read video IDs
  const loadStoredData = useCallback(async () => {
    try {
      const [favStored, readStored] = await Promise.all([
        AsyncStorage.getItem(FAVORITES_STORAGE_KEY),
        AsyncStorage.getItem(READ_VIDEOS_KEY),
      ]);
      if (favStored) {
        setFavoriteChannelIds(new Set(JSON.parse(favStored)));
      }
      if (readStored) {
        setReadVideoIds(new Set(JSON.parse(readStored)));
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
      console.warn('[HomeScreen] Feed refresh failed');
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

  const displayedVideos = useMemo(() => {
    if (activeTab === 'completed') {
      return completedVideos;
    }
    if (activeTab === 'custom') {
      return activeVideos.filter((v) => v.isCustomImport || v.channelId === 'imported');
    }
    if (activeTab === 'favorites') {
      return activeVideos.filter((v) => favoriteChannelIds.has(v.channelId));
    }
    return activeVideos;
  }, [activeVideos, completedVideos, activeTab, favoriteChannelIds]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<VideoItem>) => (
      <FeedItemCard
        item={item}
        styles={styles}
        isFavoriteChannel={favoriteChannelIds.has(item.channelId)}
        isCompletedView={activeTab === 'completed'}
        cardHeight={cardContainerHeight}
        onReadSummary={handleReadSummary}
        onWatchVideo={handleWatchVideo}
        onMarkDone={handleMarkDone}
        onRestoreVideo={handleRestoreVideo}
      />
    ),
    [
      styles,
      favoriteChannelIds,
      activeTab,
      cardContainerHeight,
      handleReadSummary,
      handleWatchVideo,
      handleMarkDone,
      handleRestoreVideo,
    ]
  );

  return (
    <View style={styles.container}>
      {/* ── Curved Gradient Header Banner (Matching attached Prototype) ── */}
      <View style={[styles.headerGradientWrapper, { paddingTop: insets.top + 6 }]}>
        <Image
          source={require('../../assets/images/header_gradient.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <View style={styles.headerContent}>
          <View style={styles.headerLeftCol}>
            <Text style={styles.headerTitle}>Video Activity Feed</Text>
            <Text style={styles.headerSubtitle} numberOfLines={2}>
              Distilled summaries from followed channels & links
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerSummarizeBtn}
            onPress={() => setShowImportModal(true)}
            activeOpacity={0.85}>
            <View
              style={[
                StyleSheet.absoluteFill,
                { borderRadius: 19, overflow: 'hidden' },
              ]}
              pointerEvents="none">
              <Image
                source={require('../../assets/images/button_gradient.png')}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.headerSparkleIcon}>✦</Text>
            <Text style={styles.headerSummarizeBtnText}>Summarize</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Quick Feed Filter Bar ── */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 24 }}>
          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'all' && styles.filterTabActive]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.75}>
            <Text style={[styles.filterTabText, activeTab === 'all' && styles.filterTabTextActive]}>
              All Activity
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'custom' && styles.filterTabActive]}
            onPress={() => setActiveTab('custom')}
            activeOpacity={0.75}>
            <Text style={[styles.filterTabText, activeTab === 'custom' && styles.filterTabTextActive]}>
              Custom Links
            </Text>
            {customCount > 0 && (
              <View
                style={[
                  styles.filterTabCount,
                  activeTab === 'custom' && styles.filterTabCountActive,
                ]}>
                <Text
                  style={[
                    styles.filterTabCountText,
                    activeTab === 'custom' && styles.filterTabCountTextActive,
                  ]}>
                  {customCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'favorites' && styles.filterTabActive]}
            onPress={() => setActiveTab('favorites')}
            activeOpacity={0.75}>
            <Text style={[styles.filterTabText, activeTab === 'favorites' && styles.filterTabTextActive]}>
              Priority
            </Text>
          </TouchableOpacity>

          {completedVideos.length > 0 && (
            <TouchableOpacity
              style={[styles.filterTab, activeTab === 'completed' && styles.filterTabActive]}
              onPress={() => setActiveTab('completed')}
              activeOpacity={0.75}>
              <Text style={[styles.filterTabText, activeTab === 'completed' && styles.filterTabTextActive]}>
                Completed
              </Text>
              <View
                style={[
                  styles.filterTabCount,
                  activeTab === 'completed' && styles.filterTabCountActive,
                ]}>
                <Text
                  style={[
                    styles.filterTabCountText,
                    activeTab === 'completed' && styles.filterTabCountTextActive,
                  ]}>
                  {completedVideos.length}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* ── Main Feed Viewport Area (Inshorts Vertical Card Deck) ── */}
      <View
        style={{ flex: 1 }}
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
          <View style={styles.centerContainer}>
            {activeTab === 'completed' ? (
              <>
                <Text style={{ fontSize: 44, marginBottom: 12 }}>🎉</Text>
                <Text style={styles.emptyTitle}>No Completed Summaries</Text>
                <Text style={styles.emptySubtitle}>
                  When you finish reading a summary and mark it as completed, it will be automatically stored in this archive.
                </Text>
              </>
            ) : activeTab === 'custom' ? (
              <>
                <Text style={{ fontSize: 44, marginBottom: 12 }}>🔗</Text>
                <Text style={styles.emptyTitle}>No Custom Links Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Paste any YouTube video or Shorts link using '✦ Summarize' to get instant video summaries kept right here in your feed.
                </Text>
                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={() => setShowImportModal(true)}>
                  <Text style={styles.connectButtonText}>+ Paste YouTube Link</Text>
                </TouchableOpacity>
              </>
            ) : activeTab === 'favorites' ? (
              <>
                <Text style={{ fontSize: 44, marginBottom: 12 }}>⭐</Text>
                <Text style={styles.emptyTitle}>No Priority Channels Starred</Text>
                <Text style={styles.emptySubtitle}>
                  Head to the Following tab and star your favorite channels so their summaries are highlighted here.
                </Text>
                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={() => navigation.navigate('Following')}>
                  <Text style={styles.connectButtonText}>Explore Followed Channels</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>📺</Text>
                <Text style={styles.emptyTitle}>All Caught Up!</Text>
                <Text style={styles.emptySubtitle}>
                  You have completed all video summaries in your active feed.
                </Text>
                {completedVideos.length > 0 && (
                  <TouchableOpacity
                    style={styles.connectButton}
                    onPress={() => setActiveTab('completed')}>
                    <Text style={styles.connectButtonText}>View Completed Archive ({completedVideos.length})</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        ) : (
          <FlatList
            data={displayedVideos}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            snapToInterval={cardContainerHeight > 0 ? cardContainerHeight : undefined}
            snapToAlignment="start"
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            initialNumToRender={3}
            maxToRenderPerBatch={5}
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
      <Modal
        visible={showImportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImportModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✨ Summarize Any Video</Text>
              <TouchableOpacity
                onPress={() => setShowImportModal(false)}
                style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Paste any YouTube video link or Shorts URL to generate a concise summary instantly:
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="https://www.youtube.com/watch?v=..."
              placeholderTextColor={colors.textMuted}
              value={urlInput}
              onChangeText={setUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => setShowImportModal(false)}
                activeOpacity={0.75}
                disabled={importing}>
                <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={handleGlobalImport}
                activeOpacity={0.8}
                disabled={importing}>
                {importing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalPrimaryBtnText}>Distill Video ✨</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
