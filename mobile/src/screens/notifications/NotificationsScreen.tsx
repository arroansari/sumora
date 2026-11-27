import React, { useState, useMemo, useCallback, useDeferredValue, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Switch,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
  ListRenderItemInfo,
  Modal,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { usePlatform } from '../../context/PlatformContext';
import { preferencesApi, sourcesApi, integrationsApi, redditApi } from '../../services/api';
import { NotificationPreference, TrackedSource, SpaceType } from '../../types/models.types';
import { SearchBar } from '../../components/atoms/SearchBar';
import { FilterPillOption } from '../../components/atoms/FilterPills';
import { SpaceIcon } from '../../components/atoms/SpaceIcon';
import { createNotificationsStyles } from './NotificationsScreen.styles';

// ─── Types ───────────────────────────────────────────────────────────────────

type MuteFilter = 'all' | 'active' | 'muted';
type SortFilter = 'newest' | 'oldest' | 'a_z' | 'z_a';

const SORT_OPTIONS: FilterPillOption<SortFilter>[] = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'A → Z', value: 'a_z' },
  { label: 'Z → A', value: 'z_a' },
];

const ALERTS_BOOKS_KEY = 'sumora:alerts_books_enabled';
const MUTED_BOOKS_KEY = 'sumora:muted_book_topics';
const ALERTS_CINEMA_KEY = 'sumora:alerts_cinema_enabled';
const MUTED_CINEMA_KEY = 'sumora:muted_cinema_sources';

const DEFAULT_BOOK_SOURCES: TrackedSource[] = [
  { id: 'b1', platform: 'books', sourceId: 'james-clear', sourceName: 'James Clear', isActive: true, memberCount: 4, createdAt: '2026-01-01' },
  { id: 'b2', platform: 'books', sourceId: 'morgan-housel', sourceName: 'Morgan Housel', isActive: true, memberCount: 3, createdAt: '2026-01-01' },
  { id: 'b3', platform: 'books', sourceId: 'jenny-odell', sourceName: 'Jenny Odell', isActive: true, memberCount: 2, createdAt: '2026-01-01' },
  { id: 'b4', platform: 'books', sourceId: 'daniel-kahneman', sourceName: 'Daniel Kahneman', isActive: true, memberCount: 3, createdAt: '2026-01-01' },
  { id: 'b5', platform: 'books', sourceId: 'ryan-holiday', sourceName: 'Ryan Holiday', isActive: true, memberCount: 5, createdAt: '2026-01-01' },
  { id: 'b6', platform: 'books', sourceId: 'psychology', sourceName: 'Psychology Mental Models', isActive: true, memberCount: 14, createdAt: '2026-01-01' },
  { id: 'b7', platform: 'books', sourceId: 'productivity', sourceName: 'Productivity & Habits', isActive: true, memberCount: 18, createdAt: '2026-01-01' },
  { id: 'b8', platform: 'books', sourceId: 'wealth', sourceName: 'Wealth & Decision Making', isActive: true, memberCount: 11, createdAt: '2026-01-01' },
];

const DEFAULT_CINEMA_SOURCES: TrackedSource[] = [
  { id: 'c1', platform: 'cinema', sourceId: 'netflix', sourceName: 'Netflix Originals & Premieres', isActive: true, memberCount: 18, createdAt: '2026-01-01' },
  { id: 'c2', platform: 'cinema', sourceId: 'max', sourceName: 'Max & HBO Cinema Radar', isActive: true, memberCount: 12, createdAt: '2026-01-01' },
  { id: 'c3', platform: 'cinema', sourceId: 'appletv', sourceName: 'Apple TV+ Quality Films', isActive: true, memberCount: 8, createdAt: '2026-01-01' },
  { id: 'c4', platform: 'cinema', sourceId: 'tmdb-trending', sourceName: 'TMDB Trending & Box Office', isActive: true, memberCount: 24, createdAt: '2026-01-01' },
  { id: 'c5', platform: 'cinema', sourceId: 'scifi', sourceName: 'Sci-Fi & Cyberpunk Radar', isActive: true, memberCount: 15, createdAt: '2026-01-01' },
  { id: 'c6', platform: 'cinema', sourceId: 'a24', sourceName: 'A24 & Independent Cinema', isActive: true, memberCount: 9, createdAt: '2026-01-01' },
];

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

// ─── Sub-row Component for Generic Domain Source ─────────────────────────────

interface DomainNotificationRowProps {
  space: SpaceType;
  item: TrackedSource;
  isMasterEnabled: boolean;
  isMuted: boolean;
  themeColor: string;
  styles: ReturnType<typeof createNotificationsStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
  onToggleMute: (id: string) => void;
}

const DomainNotificationRow = React.memo<DomainNotificationRowProps>(
  ({ space, item, isMasterEnabled, isMuted, themeColor, styles, colors, onToggleMute }) => {
    const isNotifying = isMasterEnabled && !isMuted;

    return (
      <View style={styles.channelCard}>
        <View style={styles.toggleRow}>
          <View style={styles.channelLeft}>
            <View style={{ marginRight: 12 }}>
              <SpaceIcon space={space} size={42} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.channelTitle} numberOfLines={1}>
                {item.sourceName}
              </Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isNotifying ? themeColor : colors.textMuted },
                  ]}
                />
                <Text
                  style={[
                    styles.channelStatus,
                    { color: isNotifying ? themeColor : colors.textMuted },
                  ]}>
                  {isNotifying ? 'Alerts active' : 'Muted'}
                </Text>
              </View>
            </View>
          </View>
          <Switch
            value={!isMuted}
            onValueChange={() => onToggleMute(item.sourceId)}
            disabled={!isMasterEnabled}
            trackColor={{ false: colors.border, true: themeColor }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
    );
  }
);

// ─── ChannelNotificationRow ──────────────────────────────────────────────────

interface ChannelNotificationRowProps {
  channel: TrackedSource;
  isYouTubeEnabled: boolean;
  isMuted: boolean;
  styles: ReturnType<typeof createNotificationsStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
  onToggleMute: (channelId: string) => void;
}

const ChannelNotificationRow = React.memo<ChannelNotificationRowProps>(
  ({ channel, isYouTubeEnabled, isMuted, styles, colors, onToggleMute }) => {
    const isNotifying = isYouTubeEnabled && !isMuted;

    return (
      <View style={styles.channelCard}>
        <View style={styles.toggleRow}>
          <View style={styles.channelLeft}>
            <View
              style={[
                styles.channelAvatar,
                !isNotifying && styles.channelAvatarMuted,
              ]}>
              {channel.thumbnailUrl ? (
                <FastImage
                  source={{
                    uri: channel.thumbnailUrl,
                    priority: FastImage.priority.normal,
                    cache: FastImage.cacheControl.immutable,
                  }}
                  style={[
                    styles.channelAvatarImage,
                    !isNotifying && styles.channelAvatarImageMuted,
                  ]}
                  resizeMode={FastImage.resizeMode.cover}
                />
              ) : (
                <Text
                  style={[
                    styles.channelAvatarText,
                    !isNotifying && styles.channelAvatarTextMuted,
                  ]}>
                  {getInitials(channel.sourceName)}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.channelTitle} numberOfLines={1}>
                {channel.sourceName}
              </Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isNotifying ? '#10B981' : colors.textMuted },
                  ]}
                />
                <Text
                  style={[
                    styles.channelStatus,
                    { color: isNotifying ? '#10B981' : colors.textMuted },
                  ]}>
                  {isNotifying ? 'Alerts active' : channel.isActive === false ? 'Inactive (Tracking off)' : 'Muted'}
                </Text>
              </View>
            </View>
          </View>
          <Switch
            value={!isMuted}
            onValueChange={() => onToggleMute(channel.sourceId)}
            disabled={!isYouTubeEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
    );
  }
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const NotificationsScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createNotificationsStyles(colors), [colors]);

  // Universal Space Horizon State
  const { activeSpace } = usePlatform();

  // YouTube / Reddit API State
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [sources, setSources] = useState<TrackedSource[]>([]);
  const [subreddits, setSubreddits] = useState<TrackedSource[]>([]);
  const [mutedSubreddits, setMutedSubreddits] = useState<Record<string, boolean>>({});
  const [, setIsYouTubeConnected] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [mutedChannels, setMutedChannels] = useState<Record<string, boolean>>({});

  // Books Domain State
  const [bookSources, setBookSources] = useState<TrackedSource[]>(DEFAULT_BOOK_SOURCES);
  const [isBooksEnabled, setIsBooksEnabled] = useState<boolean>(true);
  const [mutedBooks, setMutedBooks] = useState<Record<string, boolean>>({});

  // Cinema Domain State
  const [cinemaSources, setCinemaSources] = useState<TrackedSource[]>(DEFAULT_CINEMA_SOURCES);
  const [isCinemaEnabled, setIsCinemaEnabled] = useState<boolean>(true);
  const [mutedCinema, setMutedCinema] = useState<Record<string, boolean>>({});

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [muteFilter, setMuteFilter] = useState<MuteFilter>('all');
  const [sortFilter, setSortFilter] = useState<SortFilter>('newest');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

  // Load local preferences for books & cinema
  useEffect(() => {
    AsyncStorage.getItem(ALERTS_BOOKS_KEY).then((v) => {
      if (v !== null) setIsBooksEnabled(v === 'true');
    });
    AsyncStorage.getItem(MUTED_BOOKS_KEY).then((v) => {
      if (v) {
        try {
          setMutedBooks(JSON.parse(v));
        } catch {}
      }
    });

    AsyncStorage.getItem(ALERTS_CINEMA_KEY).then((v) => {
      if (v !== null) setIsCinemaEnabled(v === 'true');
    });
    AsyncStorage.getItem(MUTED_CINEMA_KEY).then((v) => {
      if (v) {
        try {
          setMutedCinema(JSON.parse(v));
        } catch {}
      }
    });
  }, []);

  const lastFetchedAtRef = useRef<number>(0);
  const hasLoadedOnceRef = useRef<boolean>(false);

  const fetchNotificationData = useCallback(async () => {
    const [prefs, channels, accounts, subs, bks, cnm] = await Promise.all([
      preferencesApi.get().catch(() => []),
      sourcesApi.list().catch(() => []),
      integrationsApi.list().catch(() => []),
      redditApi.listSources().catch(() => []),
      sourcesApi.list({ platform: 'books' }).catch(() => []),
      sourcesApi.list({ platform: 'cinema' }).catch(() => []),
    ]);
    return {
      prefs,
      channels,
      subreddits: subs,
      books: bks && bks.length > 0 ? bks : DEFAULT_BOOK_SOURCES,
      cinema: cnm && cnm.length > 0 ? cnm : DEFAULT_CINEMA_SOURCES,
      ytConnected: accounts.some((a) => a.platform === 'youtube' && a.status === 'active'),
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function loadNotificationData() {
        const now = Date.now();
        if (hasLoadedOnceRef.current && now - lastFetchedAtRef.current < 15000) {
          return;
        }
        try {
          const { prefs, channels, subreddits: subs, books, cinema, ytConnected } = await fetchNotificationData();
          if (isMounted) {
            hasLoadedOnceRef.current = true;
            lastFetchedAtRef.current = Date.now();
            setPreferences(prefs);
            setSources(channels);
            setSubreddits(subs);
            setBookSources(books);
            setCinemaSources(cinema);
            setIsYouTubeConnected(ytConnected);
          }
        } catch (err: any) {
          console.warn('[NotificationsScreen] Load error:', err.message);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }

      loadNotificationData();

      return () => {
        isMounted = false;
      };
    }, [fetchNotificationData])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { prefs, channels, subreddits: subs, books, cinema, ytConnected } = await fetchNotificationData();
      hasLoadedOnceRef.current = true;
      lastFetchedAtRef.current = Date.now();
      setPreferences(prefs);
      setSources(channels);
      setSubreddits(subs);
      setBookSources(books);
      setCinemaSources(cinema);
      setIsYouTubeConnected(ytConnected);
    } catch {
      console.warn('[NotificationsScreen] Refresh failed');
    } finally {
      setRefreshing(false);
    }
  }, [fetchNotificationData]);

  // Master Toggle Values
  const isYouTubeEnabled =
    preferences.find((p) => p.platform === 'youtube')?.enabled ?? true;

  const isRedditEnabled =
    preferences.find((p) => p.platform === 'reddit')?.enabled ?? true;

  // Domain Master Toggle Handlers
  const handleToggleGlobalYouTube = useCallback(async (value: boolean) => {
    try {
      setPreferences((prev) =>
        prev.map((p) => (p.platform === 'youtube' ? { ...p, enabled: value } : p))
      );
      await preferencesApi.update({ platform: 'youtube', enabled: value });
    } catch {
      Alert.alert('Error', 'Could not update YouTube notification preference.');
    }
  }, []);

  const handleToggleGlobalReddit = useCallback(async (value: boolean) => {
    try {
      setPreferences((prev) =>
        prev.map((p) => (p.platform === 'reddit' ? { ...p, enabled: value } : p))
      );
      await preferencesApi.update({ platform: 'reddit', enabled: value });
    } catch {
      Alert.alert('Error', 'Could not update Reddit notification preference.');
    }
  }, []);

  const handleToggleGlobalBooks = useCallback(async (value: boolean) => {
    setIsBooksEnabled(value);
    await AsyncStorage.setItem(ALERTS_BOOKS_KEY, String(value));
  }, []);

  const handleToggleGlobalCinema = useCallback(async (value: boolean) => {
    setIsCinemaEnabled(value);
    await AsyncStorage.setItem(ALERTS_CINEMA_KEY, String(value));
  }, []);

  // Filtered Source Selection based on activeSpace
  const currentDomainItems = useMemo(() => {
    switch (activeSpace) {
      case 'OPEN_LIBRARY':
        return bookSources;
      case 'TMDB':
        return cinemaSources;
      case 'REDDIT':
        return subreddits;
      case 'YOUTUBE':
      default:
        return sources;
    }
  }, [activeSpace, bookSources, cinemaSources, subreddits, sources]);

  const currentMutedRecord = useMemo(() => {
    switch (activeSpace) {
      case 'OPEN_LIBRARY':
        return mutedBooks;
      case 'TMDB':
        return mutedCinema;
      case 'REDDIT':
        return mutedSubreddits;
      case 'YOUTUBE':
      default:
        return mutedChannels;
    }
  }, [activeSpace, mutedBooks, mutedCinema, mutedSubreddits, mutedChannels]);

  // Resolves mute status: alerts are enabled ONLY when channel is actively tracked (isActive !== false)
  const getIsMuted = useCallback(
    (item: TrackedSource) => {
      // Inactive channel: alerts are disabled (muted)
      if (item.isActive === false) return true;
      const explicit = currentMutedRecord[item.sourceId];
      if (explicit !== undefined) return explicit;
      return false; // Active channels have alerts enabled by default
    },
    [currentMutedRecord]
  );

  // Individual Mute Handlers
  const handleToggleChannelMute = useCallback(
    async (channelId: string) => {
      const targetSource = sources.find((s) => s.sourceId === channelId || s.id === channelId);
      if (!targetSource) return;

      const currentlyMuted = getIsMuted(targetSource);
      const nextMuted = !currentlyMuted;
      const nextActive = !nextMuted;

      // When activating a channel, verify 50-slot limit
      if (nextActive && targetSource.isActive === false) {
        const currentActiveCount = sources.filter(
          (s) => s.platform !== 'reddit' && s.isActive !== false
        ).length;
        if (currentActiveCount >= 50) {
          Alert.alert(
            'Tracking Limit Reached',
            'You are actively tracking 50 channels. Please pause an existing active channel before enabling alerts for this channel.'
          );
          return;
        }
      }

      // Optimistically update sources and mute states
      setSources((prev) =>
        prev.map((s) => (s.id === targetSource.id ? { ...s, isActive: nextActive } : s))
      );
      setMutedChannels((prev) => ({
        ...prev,
        [targetSource.sourceId]: nextMuted,
      }));

      // Persist active state directly to backend
      try {
        await sourcesApi.toggle(targetSource.id);
      } catch (err: any) {
        console.warn('[NotificationsScreen] Toggle failed:', err.message);
        // Revert on error
        setSources((prev) =>
          prev.map((s) => (s.id === targetSource.id ? { ...s, isActive: !nextActive } : s))
        );
        setMutedChannels((prev) => ({
          ...prev,
          [targetSource.sourceId]: currentlyMuted,
        }));
      }
    },
    [sources, getIsMuted]
  );

  const handleToggleSubredditMute = useCallback(
    async (subredditId: string) => {
      const targetSub = subreddits.find((s) => s.sourceId === subredditId || s.id === subredditId);
      if (!targetSub) return;

      const currentlyMuted = getIsMuted(targetSub);
      const nextMuted = !currentlyMuted;
      const nextActive = !nextMuted;

      setSubreddits((prev) =>
        prev.map((s) => (s.id === targetSub.id ? { ...s, isActive: nextActive } : s))
      );
      setMutedSubreddits((prev) => ({
        ...prev,
        [targetSub.sourceId]: nextMuted,
      }));

      try {
        await sourcesApi.toggle(targetSub.id);
      } catch (err: any) {
        console.warn('[NotificationsScreen] Subreddit toggle failed:', err.message);
        setSubreddits((prev) =>
          prev.map((s) => (s.id === targetSub.id ? { ...s, isActive: !nextActive } : s))
        );
        setMutedSubreddits((prev) => ({
          ...prev,
          [targetSub.sourceId]: currentlyMuted,
        }));
      }
    },
    [subreddits, getIsMuted]
  );

  const handleToggleBookMute = useCallback(
    async (topicId: string) => {
      const target = bookSources.find((s) => s.sourceId === topicId || s.id === topicId);
      if (!target) return;

      const currentlyMuted = getIsMuted(target);
      const nextMuted = !currentlyMuted;
      const nextActive = !nextMuted;

      setBookSources((prev) =>
        prev.map((s) => (s.id === target.id ? { ...s, isActive: nextActive } : s))
      );
      setMutedBooks((prev) => {
        const updated = { ...prev, [target.sourceId]: nextMuted };
        AsyncStorage.setItem(MUTED_BOOKS_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });

      if (!target.id.startsWith('b_') && !target.id.startsWith('b1') && !target.id.startsWith('b2')) {
        sourcesApi.toggle(target.id).catch(() => {});
      }
    },
    [bookSources, getIsMuted]
  );

  const handleToggleCinemaMute = useCallback(
    async (radarId: string) => {
      const target = cinemaSources.find((s) => s.sourceId === radarId || s.id === radarId);
      if (!target) return;

      const currentlyMuted = getIsMuted(target);
      const nextMuted = !currentlyMuted;
      const nextActive = !nextMuted;

      setCinemaSources((prev) =>
        prev.map((s) => (s.id === target.id ? { ...s, isActive: nextActive } : s))
      );
      setMutedCinema((prev) => {
        const updated = { ...prev, [target.sourceId]: nextMuted };
        AsyncStorage.setItem(MUTED_CINEMA_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });

      if (!target.id.startsWith('c_') && !target.id.startsWith('c1') && !target.id.startsWith('c2')) {
        sourcesApi.toggle(target.id).catch(() => {});
      }
    },
    [cinemaSources, getIsMuted]
  );

  const filteredItems = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    let result = query
      ? currentDomainItems.filter((c) => c.sourceName.toLowerCase().includes(query))
      : currentDomainItems;

    if (muteFilter === 'active') {
      result = result.filter((c) => !getIsMuted(c));
    } else if (muteFilter === 'muted') {
      result = result.filter((c) => getIsMuted(c));
    }

    const copy = [...result];
    copy.sort((a, b) => {
      // 1. Actively tracked channels with Alerts Active come FIRST at the top!
      const aMuted = getIsMuted(a);
      const bMuted = getIsMuted(b);
      if (!aMuted && bMuted) return -1;
      if (aMuted && !bMuted) return 1;

      // 2. Priority channels float to the top among active channels
      if (Boolean(a.isPriority) !== Boolean(b.isPriority)) {
        return a.isPriority ? -1 : 1;
      }

      // 3. Secondary user sort
      switch (sortFilter) {
        case 'a_z':
          return a.sourceName.localeCompare(b.sourceName, undefined, { sensitivity: 'base' });
        case 'z_a':
          return b.sourceName.localeCompare(a.sourceName, undefined, { sensitivity: 'base' });
        case 'oldest':
          return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
        case 'newest':
        default:
          return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      }
    });

    return copy;
  }, [currentDomainItems, deferredSearchQuery, muteFilter, getIsMuted, sortFilter]);

  const activeCount = useMemo(
    () => currentDomainItems.filter((s) => !getIsMuted(s)).length,
    [currentDomainItems, getIsMuted]
  );

  const mutedCount = currentDomainItems.length - activeCount;
  const anyMuted = mutedCount > 0;
  const hasActiveFilter = muteFilter !== 'all' || sortFilter !== 'newest';

  const handleMuteAll = useCallback(() => {
    const allMuted: Record<string, boolean> = {};
    for (const item of currentDomainItems) {
      allMuted[item.sourceId] = true;
    }
    if (activeSpace === 'OPEN_LIBRARY') setMutedBooks(allMuted);
    else if (activeSpace === 'TMDB') setMutedCinema(allMuted);
    else if (activeSpace === 'REDDIT') setMutedSubreddits(allMuted);
    else setMutedChannels(allMuted);
  }, [currentDomainItems, activeSpace]);

  const handleUnmuteAll = useCallback(() => {
    if (activeSpace === 'OPEN_LIBRARY') setMutedBooks({});
    else if (activeSpace === 'TMDB') setMutedCinema({});
    else if (activeSpace === 'REDDIT') setMutedSubreddits({});
    else setMutedChannels({});
  }, [activeSpace]);

  // Master Card Meta Config
  const masterCardMeta = useMemo(() => {
    switch (activeSpace) {
      case 'OPEN_LIBRARY':
        return {
          title: 'Daily Book Insight Alerts',
          subtitle: isBooksEnabled
            ? 'Push alerts for daily 5-min mental models'
            : 'All reading alerts paused',
          enabled: isBooksEnabled,
          onToggle: handleToggleGlobalBooks,
          color: '#10B981',
          sectionTitle: 'Author & Topic Notifications',
          searchPlaceholder: 'Search authors or topics...',
        };
      case 'TMDB':
        return {
          title: 'Cinema Radar Alerts',
          subtitle: isCinemaEnabled
            ? 'Push alerts for new releases & critic consensus'
            : 'All cinema alerts paused',
          enabled: isCinemaEnabled,
          onToggle: handleToggleGlobalCinema,
          color: '#F59E0B',
          sectionTitle: 'Streaming & Radar Notifications',
          searchPlaceholder: 'Search platforms or genres...',
        };
      case 'REDDIT':
        return {
          title: 'Reddit Discussion Alerts',
          subtitle: isRedditEnabled
            ? 'Push alerts for top community debates'
            : 'All Reddit alerts paused',
          enabled: isRedditEnabled,
          onToggle: handleToggleGlobalReddit,
          color: '#FF4500',
          sectionTitle: 'Subreddit Debate Notifications',
          searchPlaceholder: 'Search subreddits to mute or unmute...',
        };
      case 'YOUTUBE':
      default:
        return {
          title: 'YouTube Video Alerts',
          subtitle: isYouTubeEnabled
            ? 'Push notifications enabled for new uploads'
            : 'All notifications paused',
          enabled: isYouTubeEnabled,
          onToggle: handleToggleGlobalYouTube,
          color: colors.primary,
          sectionTitle: 'Channel Notifications',
          searchPlaceholder: 'Search channels to mute or unmute...',
        };
    }
  }, [
    activeSpace,
    isBooksEnabled,
    isCinemaEnabled,
    isRedditEnabled,
    isYouTubeEnabled,
    handleToggleGlobalBooks,
    handleToggleGlobalCinema,
    handleToggleGlobalReddit,
    handleToggleGlobalYouTube,
    colors.primary,
  ]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TrackedSource>) => {
      if (activeSpace === 'OPEN_LIBRARY') {
        return (
          <DomainNotificationRow
            space="OPEN_LIBRARY"
            item={item}
            isMasterEnabled={isBooksEnabled}
            isMuted={getIsMuted(item)}
            themeColor="#10B981"
            styles={styles}
            colors={colors}
            onToggleMute={handleToggleBookMute}
          />
        );
      }
      if (activeSpace === 'TMDB') {
        return (
          <DomainNotificationRow
            space="TMDB"
            item={item}
            isMasterEnabled={isCinemaEnabled}
            isMuted={getIsMuted(item)}
            themeColor="#F59E0B"
            styles={styles}
            colors={colors}
            onToggleMute={handleToggleCinemaMute}
          />
        );
      }
      if (activeSpace === 'REDDIT') {
        return (
          <DomainNotificationRow
            space="REDDIT"
            item={item}
            isMasterEnabled={isRedditEnabled}
            isMuted={getIsMuted(item)}
            themeColor="#FF4500"
            styles={styles}
            colors={colors}
            onToggleMute={handleToggleSubredditMute}
          />
        );
      }
      return (
        <ChannelNotificationRow
          channel={item}
          isYouTubeEnabled={isYouTubeEnabled}
          isMuted={getIsMuted(item)}
          styles={styles}
          colors={colors}
          onToggleMute={handleToggleChannelMute}
        />
      );
    },
    [
      activeSpace,
      isBooksEnabled,
      handleToggleBookMute,
      isCinemaEnabled,
      handleToggleCinemaMute,
      isRedditEnabled,
      handleToggleSubredditMute,
      isYouTubeEnabled,
      getIsMuted,
      handleToggleChannelMute,
      styles,
      colors,
    ]
  );

  const listHeader = useMemo(
    () => (
      <View>
        {/* Dynamic Master Card */}
        <View style={styles.masterCard}>
          <View style={styles.masterLeft}>
            <View style={{ marginRight: 12 }}>
              <SpaceIcon space={activeSpace} size={42} />
            </View>
            <View style={styles.masterTextGroup}>
              <Text style={styles.masterTitle}>{masterCardMeta.title}</Text>
              <Text style={styles.masterSubtitle} numberOfLines={1}>
                {masterCardMeta.subtitle}
              </Text>
            </View>
          </View>
          <Switch
            value={masterCardMeta.enabled}
            onValueChange={masterCardMeta.onToggle}
            trackColor={{ false: colors.border, true: masterCardMeta.color }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Instant Test Push Dispatcher */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            backgroundColor: `${masterCardMeta.color}12`,
            borderColor: `${masterCardMeta.color}35`,
            borderWidth: 1,
            borderRadius: 14,
            paddingVertical: 11,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
          onPress={async () => {
            try {
              const res = await preferencesApi.sendTestPush();
              Alert.alert('Push Notification Test', res.message || 'Dispatched notification successfully!');
            } catch (err: any) {
              Alert.alert('Push Notification', err.message || 'Test push notification could not be dispatched.');
            }
          }}>
          <Text style={{ color: masterCardMeta.color, fontWeight: '700', fontSize: 14 }}>
            🔔 Send Test Notification
          </Text>
        </TouchableOpacity>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{masterCardMeta.sectionTitle}</Text>
          <View
            style={[
              styles.countBadge,
              { backgroundColor: `${masterCardMeta.color}18` },
            ]}>
            <Text style={[styles.countBadgeText, { color: masterCardMeta.color }]}>
              {currentDomainItems.length}
            </Text>
          </View>
        </View>

        {currentDomainItems.length > 0 && (
          <>
            {/* Search bar + Filters modal button */}
            <View style={styles.searchRow}>
              <View style={styles.searchBarWrapper}>
                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={masterCardMeta.searchPlaceholder}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  hasActiveFilter && styles.filterBtnActive,
                ]}
                onPress={() => setShowFilterModal(true)}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.filterBtnText,
                    hasActiveFilter && styles.filterBtnTextActive,
                  ]}>
                  ⚡ Filters{muteFilter !== 'all' ? ` (${muteFilter === 'active' ? 'Active' : 'Muted'})` : ''}
                </Text>
                {hasActiveFilter && <View style={styles.activeFilterIndicator} />}
              </TouchableOpacity>
            </View>

            {/* Filter status & Bulk action row */}
            <View style={styles.bulkActionRow}>
              <Text style={styles.searchMetaText}>
                {searchQuery.trim().length > 0
                  ? `${filteredItems.length} of ${currentDomainItems.length} items`
                  : muteFilter !== 'all'
                  ? `${filteredItems.length} ${muteFilter} items`
                  : `${currentDomainItems.length} items (${activeCount} active)`}
              </Text>
              <View style={{ flex: 1 }} />
              {anyMuted ? (
                <TouchableOpacity
                  style={styles.bulkButton}
                  onPress={handleUnmuteAll}
                  activeOpacity={0.75}>
                  <Text style={styles.bulkButtonText}>🔔 Unmute All</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.bulkButton, styles.bulkButtonMute]}
                  onPress={handleMuteAll}
                  activeOpacity={0.75}>
                  <Text style={[styles.bulkButtonText, styles.bulkButtonMuteText]}>
                    🔕 Mute All
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>
    ),
    [
      styles,
      activeSpace,
      masterCardMeta,
      colors.border,
      currentDomainItems.length,
      searchQuery,
      filteredItems.length,
      hasActiveFilter,
      muteFilter,
      activeCount,
      anyMuted,
      handleMuteAll,
      handleUnmuteAll,
    ]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Dynamic Screen Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <Text style={styles.headerSubtitle}>
          {activeSpace === 'OPEN_LIBRARY'
            ? 'Control daily mental model digests and author notifications'
            : activeSpace === 'TMDB'
            ? 'Control critic consensus alerts and cinema release radar'
            : activeSpace === 'REDDIT'
            ? 'Control push notification alerts for community debates'
            : 'Control push notification alerts for video summaries'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={masterCardMeta.color} />
          <Text style={styles.loadingText}>Loading notification preferences…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={25}
          windowSize={5}
          removeClippedSubviews={true}
          ListHeaderComponent={listHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={masterCardMeta.color}
            />
          }
        />
      )}

      {/* Filter Modal Sheet */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Alerts</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSectionTitle}>Alert Status</Text>
            <View style={styles.modalGrid}>
              {(['all', 'active', 'muted'] as MuteFilter[]).map((f) => {
                const isActive = muteFilter === f;
                return (
                  <TouchableOpacity
                    key={f}
                    style={[
                      styles.modalChip,
                      isActive && { backgroundColor: masterCardMeta.color, borderColor: masterCardMeta.color },
                    ]}
                    onPress={() => setMuteFilter(f)}>
                    <Text
                      style={[
                        styles.modalChipText,
                        isActive && styles.modalChipTextActive,
                      ]}>
                      {f === 'all' ? 'All' : f === 'active' ? 'Active Alerts' : 'Muted'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.modalSectionTitle}>Sort Order</Text>
            <View style={styles.modalGrid}>
              {SORT_OPTIONS.map((opt) => {
                const isActive = sortFilter === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.modalChip,
                      isActive && { backgroundColor: masterCardMeta.color, borderColor: masterCardMeta.color },
                    ]}
                    onPress={() => setSortFilter(opt.value)}>
                    <Text
                      style={[
                        styles.modalChipText,
                        isActive && styles.modalChipTextActive,
                      ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalPrimaryBtn, { backgroundColor: masterCardMeta.color }]}
                onPress={() => setShowFilterModal(false)}>
                <Text style={styles.modalPrimaryBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
