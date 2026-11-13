import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ListRenderItemInfo,
  RefreshControl,
} from 'react-native';
import FastImage, { ImageStyle } from '@d11/react-native-fast-image';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { videosApi, integrationsApi } from '../../services/api';
import { VideoItem } from '../../types/models.types';
import { RootStackParamList } from '../../types/navigation.types';
import { FilterPills, FilterPillOption } from '../../components/atoms/FilterPills';
import { createChannelDetailStyles } from './ChannelDetailScreen.styles';

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'ChannelDetail'>;

type DateRange = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

interface DateBounds {
  from: string;
  to: string;
}

const DATE_OPTIONS: FilterPillOption<DateRange>[] = [
  { label: 'All Time', value: 'custom' },
  { label: 'This Month', value: 'month' },
  { label: 'This Week', value: 'week' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Today', value: 'today' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function getDateBounds(range: DateRange): DateBounds | null {
  const now = new Date();

  const startOfDay = (d: Date) => {
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const endOfDay = (d: Date) => {
    d.setHours(23, 59, 59, 999);
    return d;
  };

  switch (range) {
    case 'today':
      return {
        from: startOfDay(new Date()).toISOString(),
        to: endOfDay(new Date()).toISOString(),
      };
    case 'yesterday': {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return {
        from: startOfDay(y).toISOString(),
        to: endOfDay(new Date(y)).toISOString(),
      };
    }
    case 'week': {
      const w = new Date();
      w.setDate(w.getDate() - 7);
      return {
        from: startOfDay(w).toISOString(),
        to: endOfDay(new Date()).toISOString(),
      };
    }
    case 'month': {
      const m = new Date();
      m.setDate(m.getDate() - 30);
      return {
        from: startOfDay(m).toISOString(),
        to: endOfDay(new Date()).toISOString(),
      };
    }
    case 'custom':
      return null; // All time — no date filter
  }
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── VideoCard ────────────────────────────────────────────────────────────────

interface VideoCardProps {
  item: VideoItem;
  styles: ReturnType<typeof createChannelDetailStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
  onPress: (item: VideoItem) => void;
}

const VideoCard = React.memo<VideoCardProps>(({ item, styles, colors, onPress }) => {
  const hasOverview = Boolean(item.summary?.overview);

  const thumbnailUri =
    item.thumbnailUrl || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;

  return (
    <TouchableOpacity
      style={styles.videoCard}
      onPress={() => onPress(item)}
      activeOpacity={0.75}>
      <View style={styles.videoCardInner}>
        {/* FastImage Thumbnail */}
        <View style={styles.thumbnailBox}>
          <FastImage
            source={{
              uri: thumbnailUri,
              priority: FastImage.priority.high,
              cache: FastImage.cacheControl.immutable,
            }}
            style={styles.thumbnail as ImageStyle}
            resizeMode={FastImage.resizeMode.cover}
          />
          {item.summaryStatus === 'completed' && (
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryBadgeText}>AI ✓</Text>
            </View>
          )}
        </View>

        {/* Meta */}
        <View style={styles.videoMeta}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.videoDate}>
            {formatRelativeDate(item.publishedAt)}
          </Text>
          {hasOverview && (
            <Text style={styles.videoPreview} numberOfLines={2}>
              {item.summary!.overview}
            </Text>
          )}
        </View>
      </View>

      {/* Read Summary CTA */}
      <View style={styles.readRow}>
        <Text
          style={[
            styles.readLabel,
            {
              color:
                item.summaryStatus === 'completed'
                  ? colors.primary
                  : item.summaryStatus === 'processing'
                  ? '#EAB308'
                  : colors.primary,
              fontWeight: item.summaryStatus === 'completed' ? '700' : '600',
            },
          ]}>
          {item.summaryStatus === 'completed'
            ? '✨ Read AI Summary →'
            : item.summaryStatus === 'processing' || item.summaryStatus === 'fetching_transcript'
            ? '⚡ Generating AI summary…'
            : '✨ Tap to view & generate summary →'}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const ChannelDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { channelId, channelName, thumbnailUrl, trackedSince } = route.params;
  const { colors } = useAppTheme();
  const styles = useMemo(() => createChannelDetailStyles(colors), [colors]);

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('custom');
  const [backfilling, setBackfilling] = useState(false);
  // Guard: only run RSS backfill once per screen mount, not on every filter change
  const hasBackfilled = useRef(false);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchVideos = useCallback(
    async (range: DateRange) => {
      const bounds = getDateBounds(range);
      const data = await videosApi.getFeed(1, 50, {
        channelId,
        ...(bounds ? { from: bounds.from, to: bounds.to } : {}),
      });
      return data.videos;
    },
    [channelId]
  );

  /**
   * Backfill recent uploads from YouTube's public RSS feed.
   * Called automatically on first load when the DB has no videos for this channel.
   */
  const backfillAndRefetch = useCallback(
    async (isMountedRef: { current: boolean }) => {
      setBackfilling(true);
      try {
        await integrationsApi.backfillChannel(channelId);
      } catch (err: any) {
        console.warn('[ChannelDetail] Backfill error:', err.message);
      } finally {
        if (isMountedRef.current) setBackfilling(false);
      }
      // Re-fetch All Time after backfill so we show results, but DON'T change
      // the selected filter pill — that caused the "Yesterday jumps to All Time" bug
      const all = await fetchVideos('custom').catch(() => []);
      if (isMountedRef.current && all.length > 0) {
        setVideos(all);
        // ⚠️  Do NOT call setDateRange here — the user's filter stays intact
      }
    },
    [channelId, fetchVideos]
  );

  useFocusEffect(
    useCallback(() => {
      let isMountedRef = { current: true };
      setLoading(true);

      fetchVideos(dateRange)
        .then(async (vids) => {
          if (!isMountedRef.current) return;
          setVideos(vids);
          // Only backfill on first open AND only when All Time is selected with 0 results.
          // Guarding on dateRange === 'custom' prevents any other filter pill from
          // triggering a backfill + setDateRange reset (the "Yesterday jumps back" bug).
          if (vids.length === 0 && !hasBackfilled.current && dateRange === 'custom') {
            hasBackfilled.current = true;
            await backfillAndRefetch(isMountedRef);
          }
        })
        .catch((err) =>
          console.warn('[ChannelDetail] Load error:', err.message)
        )
        .finally(() => {
          if (isMountedRef.current) setLoading(false);
        });

      return () => {
        isMountedRef.current = false;
      };
    }, [fetchVideos, dateRange, backfillAndRefetch])
  );

  const handleDateRangeChange = useCallback(
    (range: DateRange) => {
      setDateRange(range);
      // loading state will be re-triggered by useFocusEffect deps change
    },
    []
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const vids = await fetchVideos(dateRange);
      setVideos(vids);
    } finally {
      setRefreshing(false);
    }
  }, [fetchVideos, dateRange]);

  const handleVideoPress = useCallback(
    (item: VideoItem) => {
      navigation.navigate('SummaryDetail', {
        videoId: item.videoId,
        videoTitle: item.title,
      });
    },
    [navigation]
  );

  // ── Render helpers ─────────────────────────────────────────────────────────

  const keyExtractor = useCallback((item: VideoItem) => item.id, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<VideoItem>) => (
      <VideoCard
        item={item}
        styles={styles}
        colors={colors}
        onPress={handleVideoPress}
      />
    ),
    [styles, colors, handleVideoPress]
  );

  const trackedDate = trackedSince
    ? new Date(trackedSince).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const ListHeader = useMemo(
    () => (
      <View>
        {/* Channel Header */}
        <View style={styles.channelHeader}>
          <View style={styles.avatarWrap}>
            {thumbnailUrl ? (
              <FastImage
                source={{
                  uri: thumbnailUrl,
                  priority: FastImage.priority.high,
                  cache: FastImage.cacheControl.immutable,
                }}
                style={styles.avatarImage as ImageStyle}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <Text style={styles.avatarInitials}>{getInitials(channelName)}</Text>
            )}
          </View>
          <Text style={styles.channelName}>{channelName}</Text>
          <Text style={styles.channelMeta}>
            YouTube{trackedDate ? ` · Tracking since ${trackedDate}` : ''}
          </Text>
        </View>

        {/* Date Filter Pills */}
        <FilterPills<DateRange>
          options={DATE_OPTIONS}
          selectedValue={dateRange}
          onSelect={handleDateRangeChange}
          style={styles.filterRow}
        />

        {/* Result count */}
        {!loading && (
          <Text style={styles.resultCount}>
            {videos.length > 0
              ? `${videos.length} video${videos.length !== 1 ? 's' : ''}`
              : ''}
          </Text>
        )}
      </View>
    ),
    [
      styles,
      thumbnailUrl,
      channelName,
      trackedDate,
      dateRange,
      handleDateRangeChange,
      loading,
      videos.length,
    ]
  );

  const ListEmpty = useMemo(() => {
    if (loading) return null;
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyEmoji}>😔</Text>
        <Text style={styles.emptyTitle}>
          {dateRange === 'today'
            ? 'No Videos Today'
            : dateRange === 'yesterday'
            ? 'No Videos Yesterday'
            : dateRange === 'week'
            ? 'No Videos This Week'
            : dateRange === 'month'
            ? 'No Videos This Month'
            : 'No Videos Yet'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {channelName} hasn't uploaded anything in this time range.
        </Text>
        <TouchableOpacity
          style={styles.emptyAction}
          onPress={() => handleDateRangeChange('custom')}
          activeOpacity={0.8}>
          <Text style={styles.emptyActionText}>View All Time</Text>
        </TouchableOpacity>
      </View>
    );
  }, [loading, dateRange, channelName, handleDateRangeChange, styles]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {loading ? (
        <>
          {ListHeader}
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              {backfilling ? 'Fetching recent videos…' : 'Loading videos…'}
            </Text>
          </View>
        </>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty ?? undefined}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={10}
          maxToRenderPerBatch={6}
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
    </SafeAreaView>
  );
};

