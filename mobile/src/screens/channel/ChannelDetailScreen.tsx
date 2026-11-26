import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ListRenderItemInfo,
  RefreshControl,
  TextInput,
  Modal,
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import FastImage, { ImageStyle } from '@d11/react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { videosApi, integrationsApi, sourcesApi } from '../../services/api';
import { VideoItem, TrackedSource } from '../../types/models.types';
import { RootStackParamList } from '../../types/navigation.types';
import { FilterPills, FilterPillOption } from '../../components/atoms/FilterPills';
import { createChannelDetailStyles } from './ChannelDetailScreen.styles';

// ─── Constants & Types ────────────────────────────────────────────────────────

const ACTIVE_TRACKED_KEY = 'sumora:active_tracked_channels_v2';
const MAX_ACTIVE_TRACKING = 50;

type Props = NativeStackScreenProps<RootStackParamList, 'ChannelDetail'>;

type DateRange = 'popular' | 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'custom_range';

interface DateBounds {
  from: string;
  to: string;
}

const DATE_PRESETS = [
  { label: 'Past 7 Days', days: 7 },
  { label: 'Past 14 Days', days: 14 },
  { label: 'Past 30 Days', days: 30 },
  { label: 'Past 60 Days', days: 60 },
  { label: 'Past 90 Days', days: 90 },
  { label: 'Past 6 Months', days: 180 },
  { label: 'Past 1 Year', days: 365 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function getDateBounds(range: DateRange, customBounds: DateBounds | null): DateBounds | null {
  const startOfDay = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };
  const endOfDay = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(23, 59, 59, 999);
    return copy;
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
    case 'custom_range':
      return customBounds;
    case 'popular':
    case 'custom':
      return null; // All time or popular
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
              <Text style={styles.summaryBadgeText}>Summary ✓</Text>
            </View>
          )}
        </View>

        {/* Meta */}
        <View style={styles.videoMeta}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.videoDate}>
            {item.publishedTime || formatRelativeDate(item.publishedAt)}
            {item.duration ? ` · ⏱️ ${item.duration}` : ''}
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
            ? '✨ Read Summary →'
            : item.summaryStatus === 'processing' || item.summaryStatus === 'fetching_transcript'
            ? '⚡ Generating summary…'
            : '✨ Tap to view & generate summary →'}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

// ─── Sub-Components ──────────────────────────────────────────────────────────

interface ChannelHeroProps {
  avatarUrl: string | null;
  channelName: string;
  trackedDate: string | null;
  isTrackingActive: boolean;
  onToggleTracking: () => void;
  styles: ReturnType<typeof createChannelDetailStyles>;
  heroAvatarScale: Animated.AnimatedInterpolation<number>;
  onLayout?: (e: any) => void;
}

const ChannelHero = React.memo<ChannelHeroProps>(
  ({ avatarUrl, channelName, trackedDate, isTrackingActive, onToggleTracking, styles, heroAvatarScale, onLayout }) => (
    <View style={styles.channelHeader} onLayout={onLayout}>
      <Animated.View
        style={[
          styles.avatarWrap,
          {
            transform: [{ scale: heroAvatarScale }],
          },
        ]}>
        {avatarUrl ? (
          <FastImage
            source={{
              uri: avatarUrl,
              priority: FastImage.priority.high,
              cache: FastImage.cacheControl.immutable,
            }}
            style={styles.avatarImage as ImageStyle}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <Text style={styles.avatarInitials}>{getInitials(channelName)}</Text>
        )}
      </Animated.View>
      <Text style={styles.channelName}>{channelName}</Text>
      <Text style={styles.channelMeta}>
        YouTube{trackedDate ? ` · Tracking since ${trackedDate}` : ''}
      </Text>

      {/* Interactive Tracking Active/Inactive Toggle */}
      <TouchableOpacity
        style={[
          styles.heroTrackBtn,
          isTrackingActive ? styles.heroTrackBtnActive : styles.heroTrackBtnInactive,
        ]}
        onPress={onToggleTracking}
        activeOpacity={0.8}>
        <Text style={styles.heroTrackBtnIcon}>{isTrackingActive ? '✓' : '⚡'}</Text>
        <View style={styles.heroTrackBtnTextCol}>
          <Text
            style={[
              styles.heroTrackBtnTitle,
              isTrackingActive ? styles.heroTrackBtnTitleActive : styles.heroTrackBtnTitleInactive,
            ]}>
            {isTrackingActive ? 'Tracking Active • Alerts Enabled' : 'Track Channel • Enable Alerts'}
          </Text>
          <Text style={styles.heroTrackBtnSub}>
            {isTrackingActive
              ? 'Auto AI summaries & push alerts enabled'
              : 'Tap to enable automated summaries & alerts'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  )
);

type SearchScope = 'channel' | 'global';

interface ChannelStickyControlsProps {
  styles: ReturnType<typeof createChannelDetailStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  onClearSearch: () => void;
  dateOptions: FilterPillOption<DateRange>[];
  dateRange: DateRange;
  onSelectDateRange: (range: DateRange) => void;
  searchScopeOptions: FilterPillOption<SearchScope>[];
  searchScope: SearchScope;
  onSelectSearchScope: (scope: SearchScope) => void;
  resultCountText?: string;
}

const ChannelStickyControls = React.memo<ChannelStickyControlsProps>(
  ({
    styles,
    colors,
    searchQuery,
    onChangeSearchQuery,
    onClearSearch,
    dateOptions,
    dateRange,
    onSelectDateRange,
    searchScopeOptions,
    searchScope,
    onSelectSearchScope,
    resultCountText,
  }) => (
    <View style={styles.stickyControlsWrap}>
      {/* 1. Control Bar: Full-width Live Search */}
      <View style={styles.controlBar}>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search videos in channel…"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={onChangeSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {Boolean(searchQuery) && (
            <TouchableOpacity
              onPress={onClearSearch}
              style={styles.clearSearchBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 2. Filter Pills: Search Scope (when searching) or Date Range (when browsing) */}
      {Boolean(searchQuery.trim()) ? (
        <FilterPills<SearchScope>
          options={searchScopeOptions}
          selectedValue={searchScope}
          onSelect={onSelectSearchScope}
          style={styles.filterRow}
        />
      ) : (
        <FilterPills<DateRange>
          options={dateOptions}
          selectedValue={dateRange}
          onSelect={onSelectDateRange}
          style={styles.filterRow}
        />
      )}

      {/* 3. Result Count & Feedback */}
      {Boolean(resultCountText) && (
        <Text style={styles.resultCount}>{resultCountText}</Text>
      )}
    </View>
  )
);

interface ChannelEmptyStateProps {
  styles: ReturnType<typeof createChannelDetailStyles>;
  searchQuery: string;
  dateRange: DateRange;
  customLabel: string;
  channelName: string;
  onReset: () => void;
  searchScope?: SearchScope;
  onSearchGlobal?: () => void;
}

const ChannelEmptyState = React.memo<ChannelEmptyStateProps>(
  ({ styles, searchQuery, dateRange, customLabel, channelName, onReset, searchScope, onSearchGlobal }) => (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyEmoji}>😔</Text>
      <Text style={styles.emptyTitle}>
        {searchQuery
          ? 'No Matching Videos'
          : dateRange === 'today'
          ? 'No Videos Today'
          : dateRange === 'yesterday'
          ? 'No Videos Yesterday'
          : dateRange === 'week'
          ? 'No Videos This Week'
          : dateRange === 'month'
          ? 'No Videos This Month'
          : dateRange === 'custom_range'
          ? `No Videos in ${customLabel}`
          : 'No Videos Yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? searchScope === 'channel'
            ? `No videos matched "${searchQuery}" in ${channelName}. Try searching across all of YouTube.`
            : `No videos matched "${searchQuery}" across YouTube. Try a different title or keyword.`
          : `${channelName} hasn't uploaded anything in this time range.`}
      </Text>
      {searchQuery && searchScope === 'channel' && onSearchGlobal ? (
        <TouchableOpacity style={styles.emptyAction} onPress={onSearchGlobal} activeOpacity={0.8}>
          <Text style={styles.emptyActionText}>🌐 Search Across All of YouTube</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.emptyAction} onPress={onReset} activeOpacity={0.8}>
          <Text style={styles.emptyActionText}>View All Time</Text>
        </TouchableOpacity>
      )}
    </View>
  )
);

type ChannelListItem =
  | { key: '__hero__'; type: 'hero' }
  | { key: '__controls__'; type: 'controls' }
  | { key: '__loading__'; type: 'loading' }
  | { key: '__empty__'; type: 'empty' }
  | { key: '__yt_header__'; type: 'yt_header'; title: string }
  | { key: '__yt_loading__'; type: 'yt_loading' }
  | { key: string; type: 'video'; video: VideoItem };

const SCREEN_HEIGHT = Dimensions.get('window').height;

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const ChannelDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { channelId, channelName, thumbnailUrl, trackedSince } = route.params;
  const { colors, accentTheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createChannelDetailStyles(colors), [colors]);

  const flatListRef = useRef<any>(null);
  const scrollYOffset = useRef(0);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(thumbnailUrl || null);
  const [trackedSource, setTrackedSource] = useState<TrackedSource | null>(null);
  const [isTrackingActive, setIsTrackingActive] = useState<boolean>(true);
  const [activeCount, setActiveCount] = useState<number>(0);

  const fetchChannelTrackingState = useCallback(() => {
    let isMounted = true;
    sourcesApi
      .list({ platform: 'youtube' })
      .then((sources) => {
        if (!isMounted) return;
        const currentActive = sources.filter((s) => s.platform !== 'reddit' && s.isActive !== false).length;
        setActiveCount(currentActive);
        const found = sources.find((s) => s.sourceId === channelId || s.id === channelId);
        if (found) {
          setTrackedSource(found);
          setIsTrackingActive(found.isActive !== false);
          if (found.thumbnailUrl && !avatarUrl) {
            setAvatarUrl(found.thumbnailUrl);
          }
        }
      })
      .catch((err) => {
        console.warn('[ChannelDetail] Failed to resolve channel tracking:', err?.message);
      });
    return () => {
      isMounted = false;
    };
  }, [channelId, avatarUrl]);

  useEffect(() => {
    return fetchChannelTrackingState();
  }, [fetchChannelTrackingState]);

  const handleToggleTracking = useCallback(async () => {
    if (isTrackingActive) {
      Alert.alert(
        'Pause AI Tracking?',
        `Pause automatic AI summaries & push alerts for "${channelName}"? This frees up 1 tracking slot.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pause Tracking',
            style: 'default',
            onPress: async () => {
              setIsTrackingActive(false);
              setActiveCount((c) => Math.max(0, c - 1));

              try {
                const stored = await AsyncStorage.getItem(ACTIVE_TRACKED_KEY);
                if (stored) {
                  const ids: string[] = JSON.parse(stored);
                  const updated = ids.filter((id) => id !== channelId && id !== trackedSource?.id);
                  await AsyncStorage.setItem(ACTIVE_TRACKED_KEY, JSON.stringify(updated));
                }
              } catch {}

              try {
                await sourcesApi.toggle(trackedSource?.id || channelId);
              } catch (err: any) {
                console.warn('[ChannelDetail] Toggle tracking failed:', err?.message);
              }
            },
          },
        ]
      );
    } else {
      if (activeCount >= MAX_ACTIVE_TRACKING) {
        Alert.alert(
          'Tracking Limit Reached',
          `You are actively tracking ${activeCount} of ${MAX_ACTIVE_TRACKING} channels. Please pause an existing active channel before activating "${channelName}".`
        );
        return;
      }

      setIsTrackingActive(true);
      setActiveCount((c) => c + 1);

      try {
        const stored = await AsyncStorage.getItem(ACTIVE_TRACKED_KEY);
        const ids: string[] = stored ? JSON.parse(stored) : [];
        const targetId = trackedSource?.id || channelId;
        if (!ids.includes(targetId)) {
          ids.push(targetId);
          await AsyncStorage.setItem(ACTIVE_TRACKED_KEY, JSON.stringify(ids));
        }
      } catch {}

      try {
        await sourcesApi.toggle(trackedSource?.id || channelId);
      } catch (err: any) {
        console.warn('[ChannelDetail] Toggle tracking failed:', err?.message);
      }
    }
  }, [isTrackingActive, activeCount, channelName, channelId, trackedSource]);

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('popular');
  const [customBounds, setCustomBounds] = useState<DateBounds | null>(null);
  const [customLabel, setCustomLabel] = useState<string>('📅 Custom');
  const [selectedPresetDays, setSelectedPresetDays] = useState<number | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [heroHeight, setHeroHeight] = useState(150);

  // In-memory tab video cache: guarantees instant 0ms switching without screen reload
  const tabCache = useRef<Record<string, VideoItem[]>>({});

  // Search & Date Modal state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('channel');
  const [ytSearchResults, setYtSearchResults] = useState<VideoItem[]>([]);
  const [searchingYouTube, setSearchingYouTube] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);

  const searchScopeOptions = useMemo<FilterPillOption<SearchScope>[]>(
    () => [
      { label: `🎯 In ${channelName}`, value: 'channel' },
      { label: '🌐 All of YouTube', value: 'global' },
    ],
    [channelName]
  );

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setYtSearchResults([]);
      setSearchingYouTube(false);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    setSearchingYouTube(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await videosApi.searchYouTube(q, {
          channelName: searchScope === 'channel' ? channelName : undefined,
          channelId: searchScope === 'channel' ? channelId : undefined,
          limit: 15,
        });
        setYtSearchResults(results);
      } catch (err: any) {
        console.warn('[ChannelDetail] YouTube search error:', err.message);
        setYtSearchResults([]);
      } finally {
        setSearchingYouTube(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, searchScope, channelName, channelId]);

  // Guard: only run RSS backfill once per screen mount, not on every filter change
  const hasBackfilled = useRef(false);

  const onHeroLayout = useCallback((e: any) => {
    const h = e.nativeEvent?.layout?.height;
    if (h && h > 60 && Math.abs(h - heroHeight) > 2) {
      setHeroHeight(Math.round(h));
    }
  }, [heroHeight]);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchVideos = useCallback(
    async (range: DateRange, boundsOverride?: DateBounds | null) => {
      if (range === 'popular') {
        return videosApi.getPopularVideos(channelId, 10);
      }
      const bounds = boundsOverride !== undefined ? boundsOverride : getDateBounds(range, customBounds);
      const data = await videosApi.getFeed(1, 50, {
        channelId,
        ...(bounds ? { from: bounds.from, to: bounds.to } : {}),
      });
      return data.videos;
    },
    [channelId, customBounds]
  );

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
      const all = await fetchVideos('custom', null).catch(() => []);
      if (isMountedRef.current && all.length > 0) {
        tabCache.current['custom'] = all;
        setVideos(all);
      }
    },
    [channelId, fetchVideos]
  );

  // Initial load: fetches default 'popular' tab once on mount and caches it
  useEffect(() => {
    let isMounted = true;
    fetchVideos('popular')
      .then(async (vids) => {
        if (!isMounted) return;
        tabCache.current['popular'] = vids;
        setVideos(vids);
        if (vids.length === 0 && !hasBackfilled.current) {
          hasBackfilled.current = true;
          await backfillAndRefetch({ current: isMounted });
        }
      })
      .catch((err) => console.warn('[ChannelDetail] Load error:', err?.message))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [channelId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tab switch handler: updates videos in-place without unmounting FlatList or bringing hero down
  const handleDateRangeChange = useCallback(
    async (range: DateRange) => {
      if (range === 'custom_range') {
        setShowDateModal(true);
        return;
      }
      setDateRange(range);
      const wasCollapsed = scrollYOffset.current >= heroHeight - 15;
      const cacheKey = range;

      // 1. Instant Cache Hit: 0ms, zero lag, scroll position stays firmly pinned
      if (tabCache.current[cacheKey]) {
        setVideos(tabCache.current[cacheKey]);
        if (wasCollapsed) {
          requestAnimationFrame(() => {
            flatListRef.current?.scrollToOffset({ offset: heroHeight, animated: false });
          });
        }
        return;
      }

      // 2. Cache Miss: Background fetch, keep list stable and docked
      setTabLoading(true);
      try {
        const vids = await fetchVideos(range);
        tabCache.current[cacheKey] = vids;
        setVideos(vids);
        if (wasCollapsed) {
          requestAnimationFrame(() => {
            flatListRef.current?.scrollToOffset({ offset: heroHeight, animated: false });
          });
        }
      } catch (err: any) {
        console.warn('[ChannelDetail] Tab switch error:', err.message);
      } finally {
        setTabLoading(false);
      }
    },
    [fetchVideos, heroHeight]
  );

  const handleApplyPreset = useCallback(
    async (preset: { label: string; days: number }) => {
      setSelectedPresetDays(preset.days);
      const now = new Date();
      const past = new Date();
      past.setDate(past.getDate() - preset.days);
      past.setHours(0, 0, 0, 0);

      const bounds: DateBounds = {
        from: past.toISOString(),
        to: now.toISOString(),
      };

      setCustomBounds(bounds);
      setCustomLabel(`📅 ${preset.label}`);
      setDateRange('custom_range');
      setShowDateModal(false);

      const wasCollapsed = scrollYOffset.current >= heroHeight - 15;
      const cacheKey = `custom_range_${bounds.from}_${bounds.to}`;
      if (tabCache.current[cacheKey]) {
        setVideos(tabCache.current[cacheKey]);
        if (wasCollapsed) {
          requestAnimationFrame(() => {
            flatListRef.current?.scrollToOffset({ offset: heroHeight, animated: false });
          });
        }
        return;
      }

      setTabLoading(true);
      try {
        const vids = await fetchVideos('custom_range', bounds);
        tabCache.current[cacheKey] = vids;
        setVideos(vids);
        if (wasCollapsed) {
          requestAnimationFrame(() => {
            flatListRef.current?.scrollToOffset({ offset: heroHeight, animated: false });
          });
        }
      } catch (err: any) {
        console.warn('[ChannelDetail] Custom range error:', err.message);
      } finally {
        setTabLoading(false);
      }
    },
    [fetchVideos, heroHeight]
  );

  const handleResetToAllTime = useCallback(() => {
    setSelectedPresetDays(null);
    setCustomBounds(null);
    setCustomLabel('📅 Custom');
    setShowDateModal(false);
    handleDateRangeChange('custom');
  }, [handleDateRangeChange]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const vids = await fetchVideos(dateRange);
      const cacheKey =
        dateRange === 'custom_range' && customBounds
          ? `${dateRange}_${customBounds.from}_${customBounds.to}`
          : dateRange;
      tabCache.current[cacheKey] = vids;
      setVideos(vids);
    } finally {
      setRefreshing(false);
    }
  }, [fetchVideos, dateRange, customBounds]);

  const handleVideoPress = useCallback(
    (item: VideoItem) => {
      navigation.navigate('SummaryDetail', {
        videoId: item.videoId,
        videoTitle: item.title,
        channelName: item.channelName || channelName,
        thumbnailUrl: item.thumbnailUrl,
        publishedAt: item.publishedAt,
        readTime: '1-2 Min Read',
        summary: item.summary || undefined,
      });
    },
    [navigation, channelName]
  );

  // ── Client-side Live Search ────────────────────────────────────────────────

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videos;
    const q = searchQuery.toLowerCase().trim();
    return videos.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        (v.summary?.overview && v.summary.overview.toLowerCase().includes(q))
    );
  }, [videos, searchQuery]);

  // ── Filter Options with Dynamic Custom Date Label ─────────────────────────

  const dateOptions = useMemo<FilterPillOption<DateRange>[]>(
    () => [
      { label: '🔥 Top 10 Popular', value: 'popular' },
      { label: 'Latest Uploads', value: 'custom' },
      { label: 'This Month', value: 'month' },
      { label: 'This Week', value: 'week' },
      {
        label: dateRange === 'custom_range' ? customLabel : '📅 Custom',
        value: 'custom_range',
      },
    ],
    [dateRange, customLabel]
  );

  // ── WhatsApp-style Collapsible Header & Sticky Controls ────────────────────
  const scrollYRef = useRef<Animated.Value | null>(null);
  if (!scrollYRef.current) {
    scrollYRef.current = new Animated.Value(0);
  }
  const scrollY = scrollYRef.current;

  // Header compact profile (avatar + title) smoothly animates in ONLY when hero reaches header
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, Math.max(heroHeight - 30, 80), heroHeight],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, Math.max(heroHeight - 30, 80), heroHeight],
    outputRange: [8, 8, 0],
    extrapolate: 'clamp',
  });

  // Hero avatar subtly scales on pull-down
  const heroAvatarScale = scrollY.interpolate({
    inputRange: [-60, 0, heroHeight],
    outputRange: [1.12, 1, 0.95],
    extrapolate: 'clamp',
  });

  const trackedDate = trackedSince
    ? new Date(trackedSince).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const listItems = useMemo<ChannelListItem[]>(() => {
    const items: ChannelListItem[] = [
      { key: '__controls__', type: 'controls' },
    ];

    if (loading && videos.length === 0) {
      items.push({ key: '__loading__', type: 'loading' });
      return items;
    }

    const q = searchQuery.trim();
    if (q) {
      // 1. Show matching local channel videos first
      for (const v of filteredVideos) {
        items.push({ key: v.id, type: 'video', video: v });
      }

      // 2. Show live YouTube search loading or results
      if (searchingYouTube) {
        items.push({ key: '__yt_loading__', type: 'yt_loading' });
      } else if (ytSearchResults.length > 0) {
        const localIds = new Set(filteredVideos.map((f) => f.videoId));
        const extraYt = ytSearchResults.filter((y) => !localIds.has(y.videoId));

        if (extraYt.length > 0) {
          items.push({
            key: '__yt_header__',
            type: 'yt_header',
            title:
              searchScope === 'global'
                ? '🌐 YouTube Results'
                : `🌐 Found on YouTube (${channelName})`,
          });

          for (const v of extraYt) {
            items.push({ key: `yt_${v.videoId}`, type: 'video', video: v });
          }
        }
      }

      // 3. If no local AND no YouTube results and not loading -> empty state
      if (
        filteredVideos.length === 0 &&
        ytSearchResults.length === 0 &&
        !searchingYouTube
      ) {
        items.push({ key: '__empty__', type: 'empty' });
      }
    } else {
      if (!tabLoading && filteredVideos.length === 0) {
        items.push({ key: '__empty__', type: 'empty' });
      } else {
        for (const v of filteredVideos) {
          items.push({ key: v.id, type: 'video', video: v });
        }
      }
    }

    return items;
  }, [
    filteredVideos,
    loading,
    tabLoading,
    videos.length,
    searchQuery,
    searchingYouTube,
    ytSearchResults,
    searchScope,
    channelName,
  ]);

  const keyExtractor = useCallback((item: ChannelListItem) => item.key, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChannelListItem>) => {
      switch (item.type) {
        case 'hero':
          return (
            <ChannelHero
              avatarUrl={avatarUrl}
              channelName={channelName}
              trackedDate={trackedDate}
              isTrackingActive={isTrackingActive}
              onToggleTracking={handleToggleTracking}
              styles={styles}
              heroAvatarScale={heroAvatarScale}
              onLayout={onHeroLayout}
            />
          );
        case 'controls':
          return (
            <ChannelStickyControls
              styles={styles}
              colors={colors}
              searchQuery={searchQuery}
              onChangeSearchQuery={setSearchQuery}
              onClearSearch={() => setSearchQuery('')}
              dateOptions={dateOptions}
              dateRange={dateRange}
              onSelectDateRange={handleDateRangeChange}
              searchScopeOptions={searchScopeOptions}
              searchScope={searchScope}
              onSelectSearchScope={setSearchScope}
              resultCountText={
                tabLoading
                  ? '⚡ Loading uploads…'
                  : searchingYouTube
                  ? '⚡ Searching YouTube…'
                  : searchQuery
                  ? filteredVideos.length > 0 || ytSearchResults.length > 0
                    ? `Found ${filteredVideos.length + ytSearchResults.length} matching "${searchQuery}"`
                    : `0 matching "${searchQuery}"`
                  : dateRange === 'popular'
                  ? `🔥 Top ${videos.length} Most Popular Videos`
                  : `${videos.length} video${videos.length !== 1 ? 's' : ''}`
              }
            />
          );
        case 'yt_header':
          return (
            <View style={styles.ytSectionHeader}>
              <Text style={styles.ytSectionTitle}>{item.title}</Text>
              <Text style={styles.ytSectionBadge}>Live YouTube</Text>
            </View>
          );
        case 'yt_loading':
          return (
            <View style={styles.ytLoadingBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.ytLoadingText}>Searching YouTube for "{searchQuery}"…</Text>
            </View>
          );
        case 'loading':
          return (
            <View style={styles.tabLoadingBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.tabLoadingText}>Loading uploads…</Text>
            </View>
          );
        case 'empty':
          return (
            <ChannelEmptyState
              styles={styles}
              searchQuery={searchQuery}
              dateRange={dateRange}
              customLabel={customLabel}
              channelName={channelName}
              searchScope={searchScope}
              onSearchGlobal={() => setSearchScope('global')}
              onReset={() => {
                setSearchQuery('');
                setSearchScope('channel');
                handleResetToAllTime();
              }}
            />
          );
        case 'video':
          return (
            <VideoCard
              item={item.video}
              styles={styles}
              colors={colors}
              onPress={handleVideoPress}
            />
          );
      }
    },
    [
      avatarUrl,
      channelName,
      trackedDate,
      styles,
      colors,
      heroAvatarScale,
      onHeroLayout,
      searchQuery,
      dateOptions,
      dateRange,
      handleDateRangeChange,
      searchScopeOptions,
      searchScope,
      tabLoading,
      searchingYouTube,
      filteredVideos.length,
      ytSearchResults.length,
      videos.length,
      customLabel,
      handleResetToAllTime,
      handleVideoPress,
      isTrackingActive,
      handleToggleTracking,
    ]
  );

  return (
    <View style={styles.container}>
      {/* ── Top Curved Gradient Header Banner ── */}
      <View
        style={[
          styles.topHeaderGradient,
          {
            paddingTop: insets.top + 8,
            shadowColor: accentTheme.primaryDark,
          },
        ]}>
        <Image
          source={accentTheme.assets.header ?? undefined}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        <View style={styles.topHeaderRow}>
          <TouchableOpacity
            style={styles.navBackBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.navBackText}>‹ Following</Text>
          </TouchableOpacity>

          <View style={styles.navProfileWrap}>
            <View style={styles.navAvatar}>
              {avatarUrl ? (
                <FastImage
                  source={{
                    uri: avatarUrl,
                    priority: FastImage.priority.high,
                    cache: FastImage.cacheControl.immutable,
                  }}
                  style={styles.navAvatarImage as ImageStyle}
                  resizeMode={FastImage.resizeMode.cover}
                />
              ) : (
                <Text style={styles.navAvatarInitials}>{getInitials(channelName)}</Text>
              )}
            </View>
            <Text style={styles.navTitle} numberOfLines={1}>
              {channelName}
            </Text>
          </View>

          {/* Quick Active Tracking Toggle Pill */}
          <TouchableOpacity
            style={[
              styles.headerTrackBtn,
              isTrackingActive ? styles.headerTrackBtnActive : styles.headerTrackBtnInactive,
            ]}
            onPress={handleToggleTracking}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text
              style={[
                styles.headerTrackBtnText,
                isTrackingActive ? styles.headerTrackBtnTextActive : styles.headerTrackBtnTextInactive,
              ]}>
              {isTrackingActive ? '✓ Active' : '+ Track'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.FlatList
        ref={flatListRef}
        data={listItems}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        stickyHeaderIndices={[0]}
        decelerationRate="fast"
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: true,
            listener: (e: any) => {
              scrollYOffset.current = e.nativeEvent?.contentOffset?.y ?? 0;
            },
          }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.listContent,
          { minHeight: SCREEN_HEIGHT + heroHeight + 50 },
        ]}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />

      {/* ── Modal 1: Custom Date Presets Picker ───────────────────────────── */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📅 Filter by Date Range</Text>
              <TouchableOpacity
                onPress={() => setShowDateModal(false)}
                style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Select a time window to filter uploads from {channelName}:
            </Text>

            <View style={styles.presetGrid}>
              {DATE_PRESETS.map((p) => {
                const isActive = selectedPresetDays === p.days;
                return (
                  <TouchableOpacity
                    key={p.days}
                    style={[styles.presetChip, isActive && styles.presetChipActive]}
                    onPress={() => handleApplyPreset(p)}
                    activeOpacity={0.75}>
                    <Text
                      style={[
                        styles.presetChipText,
                        isActive && styles.presetChipTextActive,
                      ]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={handleResetToAllTime}
                activeOpacity={0.75}>
                <Text style={styles.modalSecondaryBtnText}>Reset (All Time)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => setShowDateModal(false)}
                activeOpacity={0.75}>
                <Text style={styles.modalPrimaryBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
