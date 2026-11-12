import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  RefreshControl,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { videosApi } from '../../services/api';
import { VideoItem, SummaryStatus } from '../../types/models.types';
import { createHomeStyles } from './HomeScreen.styles';

interface FeedCardProps {
  item: VideoItem;
  styles: ReturnType<typeof createHomeStyles>;
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

const FeedItemCard = React.memo<FeedCardProps>(({ item, styles, onReadSummary, onWatchVideo }) => {
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

  return (
    <View style={styles.card}>
      <View style={styles.thumbnailContainer}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
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
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.channelRow}>
          <Text style={styles.channelName}>{item.channelName || 'YouTube Creator'}</Text>
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
});

export const HomeScreen: React.FC<any> = ({ navigation }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Performance-optimized mount effect: fetching logic declared inside useEffect with cleanup
  useEffect(() => {
    let isMounted = true;

    async function loadInitialFeed() {
      try {
        const res = await videosApi.getFeed(1, 20);
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
      const res = await videosApi.getFeed(1, 20);
      setVideos(res.videos);
    } catch (err) {
      console.warn('[HomeScreen] Feed refresh failed');
    } finally {
      setRefreshing(false);
    }
  }, []);

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

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<VideoItem>) => (
      <FeedItemCard
        item={item}
        styles={styles}
        onReadSummary={handleReadSummary}
        onWatchVideo={handleWatchVideo}
      />
    ),
    [styles, handleReadSummary, handleWatchVideo]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Video Activity Feed</Text>
        <Text style={styles.headerSubtitle}>AI-distilled summaries from your followed channels</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your feed...</Text>
        </View>
      ) : videos.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📺</Text>
          <Text style={styles.emptyTitle}>No Videos Yet</Text>
          <Text style={styles.emptySubtitle}>
            Connect your YouTube account to automatically track your subscriptions and receive AI summaries for new video uploads.
          </Text>
          <TouchableOpacity
            style={styles.connectButton}
            onPress={() => navigation.navigate('ConnectedAccounts')}>
            <Text style={styles.connectButtonText}>Connect YouTube</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={videos}
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
    </SafeAreaView>
  );
};
