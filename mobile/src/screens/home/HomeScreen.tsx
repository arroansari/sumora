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
} from 'react-native';
import FastImage, { ImageStyle } from '@d11/react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { videosApi } from '../../services/api';
import { VideoItem, SummaryStatus } from '../../types/models.types';
import { createHomeStyles } from './HomeScreen.styles';

const FAVORITES_STORAGE_KEY = 'sumora:favorite_channel_ids';

type FeedTab = 'all' | 'custom' | 'favorites';

interface FeedCardProps {
  item: VideoItem;
  styles: ReturnType<typeof createHomeStyles>;
  isFavoriteChannel?: boolean;
  onReadSummary: (videoId: string, title: string) => void;
  onWatchVideo: (videoUrl: string) => void;
}

const getStatusConfig = (status: SummaryStatus) => {
  switch (status) {
    case 'completed':
      return { bg: '#10B98120', label: 'Summary Ready', text: '#10B981' };
    case 'processing':
      return { bg: '#3B82F620', label: 'Generating Summary...', text: '#3B82F6' };
    case 'fetching_transcript':
      return { bg: '#3B82F620', label: 'Fetching Transcript...', text: '#3B82F6' };
    case 'transcript_unavailable':
      return { bg: '#F59E0B20', label: 'Transcript Unavailable', text: '#F59E0B' };
    case 'failed':
      return { bg: '#EF444420', label: 'Summary Failed', text: '#EF4444' };
    default:
      return { bg: '#6B728020', label: 'Pending', text: '#9CA3AF' };
  }
};

const FeedItemCard = React.memo<FeedCardProps>(
  ({ item, styles, isFavoriteChannel, onReadSummary, onWatchVideo }) => {
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
        ? 'AI summary generated.'
        : item.summaryStatus === 'transcript_unavailable'
        ? 'An accessible transcript could not be retrieved, so a summary cannot be generated yet.'
        : item.summaryStatus === 'failed'
        ? 'Unable to generate summary. We will retry where appropriate.'
        : 'Your video summary is being prepared.');

    const statusConfig = getStatusConfig(item.summaryStatus);
    const isCustom = item.isCustomImport || item.channelId === 'imported';

    return (
      <View style={styles.card}>
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
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusConfig.text }]}>
                {statusConfig.label}
              </Text>
            </View>
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

          <Text style={styles.overviewText} numberOfLines={3}>
            {shortOverview}
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.readButton}
              onPress={() => onReadSummary(item.videoId, item.title)}>
              <Text style={styles.readButtonText}>Read Summary</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.watchButton} onPress={() => onWatchVideo(item.videoUrl)}>
              <Text style={styles.watchButtonText}>Watch Video ↗</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
);

export const HomeScreen: React.FC<any> = ({ navigation }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>('');
  const [importing, setImporting] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<FeedTab>('all');
  const [favoriteChannelIds, setFavoriteChannelIds] = useState<Set<string>>(new Set());

  // Load user's starred favorite channels
  const loadFavorites = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        setFavoriteChannelIds(new Set(JSON.parse(stored)));
      }
    } catch {
      // ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
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
      if (activeTab === 'favorites') {
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

  // Dedicated refresh handler, completely decoupled from useEffect dependencies
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await videosApi.getFeed(1, 40);
      setVideos(res.videos);
      await loadFavorites();
    } catch (err) {
      console.warn('[HomeScreen] Feed refresh failed');
    } finally {
      setRefreshing(false);
    }
  }, [loadFavorites]);

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

  const keyExtractor = useCallback((item: VideoItem) => item.id || item.videoId, []);

  // Filter videos based on active filter tab
  const customCount = useMemo(() => {
    return videos.filter((v) => v.isCustomImport || v.channelId === 'imported').length;
  }, [videos]);

  const displayedVideos = useMemo(() => {
    if (activeTab === 'custom') {
      return videos.filter((v) => v.isCustomImport || v.channelId === 'imported');
    }
    if (activeTab === 'favorites') {
      return videos.filter((v) => favoriteChannelIds.has(v.channelId));
    }
    return videos;
  }, [videos, activeTab, favoriteChannelIds]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<VideoItem>) => (
      <FeedItemCard
        item={item}
        styles={styles}
        isFavoriteChannel={favoriteChannelIds.has(item.channelId)}
        onReadSummary={handleReadSummary}
        onWatchVideo={handleWatchVideo}
      />
    ),
    [styles, favoriteChannelIds, handleReadSummary, handleWatchVideo]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Video Activity Feed</Text>
            <Text style={styles.headerSubtitle}>
              AI-distilled summaries from your followed channels & custom links
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addLinkBtn}
            onPress={() => setShowImportModal(true)}
            activeOpacity={0.8}>
            <Text style={styles.addLinkBtnText}>+ Summarize</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Quick Feed Filter Bar ── */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterTab, activeTab === 'all' && styles.filterTabActive]}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.75}>
          <Text style={[styles.filterTabText, activeTab === 'all' && styles.filterTabTextActive]}>
            📡 All Activity
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, activeTab === 'custom' && styles.filterTabActive]}
          onPress={() => setActiveTab('custom')}
          activeOpacity={0.75}>
          <Text style={[styles.filterTabText, activeTab === 'custom' && styles.filterTabTextActive]}>
            🔗 Custom Links
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
            ⭐ Priority
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your feed...</Text>
        </View>
      ) : displayedVideos.length === 0 ? (
        <View style={styles.centerContainer}>
          {activeTab === 'custom' ? (
            <>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>🔗</Text>
              <Text style={styles.emptyTitle}>No Custom Links Yet</Text>
              <Text style={styles.emptySubtitle}>
                Paste any YouTube video or Shorts link using '+ Summarize' to get instant AI summaries kept right here in your feed.
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
              <Text style={styles.emptyTitle}>No Videos Yet</Text>
              <Text style={styles.emptySubtitle}>
                Connect your YouTube account or paste any video link to start receiving AI summaries.
              </Text>
              <TouchableOpacity
                style={styles.connectButton}
                onPress={() => navigation.navigate('ConnectedAccounts')}>
                <Text style={styles.connectButtonText}>Connect YouTube</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={displayedVideos}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={5}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        />
      )}

      {/* ── Modal: Paste YouTube Link to Summarize ── */}
      <Modal
        visible={showImportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImportModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✨ Summarize Any Video</Text>
              <TouchableOpacity
                onPress={() => setShowImportModal(false)}
                style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Paste any YouTube video link or Shorts URL to generate an AI summary instantly:
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
    </SafeAreaView>
  );
};
