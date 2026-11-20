import React, {
  useState,
  useMemo,
  useCallback,
  useDeferredValue,
  useEffect,
  useRef,
} from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Animated,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation.types';
import { TrackedSource } from '../../types/models.types';
import { useAppTheme } from '../../context/ThemeContext';
import { usePlatform } from '../../context/PlatformContext';
import { sourcesApi, integrationsApi, redditApi } from '../../services/api';
import { SearchBar } from '../../components/atoms/SearchBar';
import { CategorySquircleIcon } from '../../components/atoms/CategorySquircleIcon';
import { createFollowingStyles } from './FollowingScreen.styles';
import {
  CategoryId,
  SortFilter,
  CATEGORIES,
  classifyChannel,
  sortSources,
} from './types';
import {
  ChannelGridCard,
  ChannelListRow,
  PriorityChannelsBar,
  CategoryPillsBar,
  FilterModal,
  AddSubredditModal,
  SubredditListView,
  FollowingHeader,
  ManualChannelAddForm,
  DomainSourceListView,
  AddDomainSourceModal,
} from './components';

export * from './types';

const FAVORITES_STORAGE_KEY = 'sumora:favorite_channel_ids';
const ACTIVE_TRACKED_KEY = 'sumora:active_channel_ids';
const SYNC_DONE_KEY = 'sumora:yt_thumb_sync_done';
const TRACKED_BOOKS_STORAGE_KEY = 'sumora:tracked_book_authors';
const TRACKED_CINEMA_STORAGE_KEY = 'sumora:tracked_cinema_sources';
const PAGE_SIZE = 24;
const MAX_ACTIVE_TRACKING = 50;

const GRADIENT_STEPS = [
  '#6C47FF',
  '#6355FF',
  '#5967FF',
  '#4D7DFE',
  '#3F92FD',
  '#2EA7FC',
  '#1DBBFA',
  '#0ACDF8',
  '#00DDF6',
  '#00EAF4',
];

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

export const FollowingScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createFollowingStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Universal Space Switcher State
  const { activeSpace } = usePlatform();

  // YouTube State
  const [sources, setSources] = useState<TrackedSource[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [, setIsYouTubeConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [sortFilter, setSortFilter] = useState<SortFilter>('newest');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('active');

  const route = useRoute<any>();
  useEffect(() => {
    if (route.params?.category) {
      setSelectedCategory(route.params.category);
    }
  }, [route.params?.category]);
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newChannelId, setNewChannelId] = useState<string>('');
  const [newChannelName, setNewChannelName] = useState<string>('');
  const [adding, setAdding] = useState<boolean>(false);

  // Reddit State
  const [subreddits, setSubreddits] = useState<TrackedSource[]>([]);
  const [newSubredditInput, setNewSubredditInput] = useState<string>('');
  const [addingSubreddit, setAddingSubreddit] = useState<boolean>(false);
  const [showAddSubredditModal, setShowAddSubredditModal] = useState<boolean>(false);

  // Books State (Open Library)
  const [bookSources, setBookSources] = useState<TrackedSource[]>(DEFAULT_BOOK_SOURCES);
  const [activeBookCategory, setActiveBookCategory] = useState<string>('All');

  // Cinema State (TMDB)
  const [cinemaSources, setCinemaSources] = useState<TrackedSource[]>(DEFAULT_CINEMA_SOURCES);
  const [activeCinemaCategory, setActiveCinemaCategory] = useState<string>('All');

  // Generic Domain Add Modal State
  const [showAddDomainModal, setShowAddDomainModal] = useState<boolean>(false);
  const [domainModalInput, setDomainModalInput] = useState<string>('');
  const [addingDomain, setAddingDomain] = useState<boolean>(false);

  // Virtual pagination for YouTube
  const BATCH_PAGE_SIZE = 50;
  const [displayLimit, setDisplayLimit] = useState<number>(BATCH_PAGE_SIZE);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    // Rehydrate view mode preference
    AsyncStorage.getItem('@sumora_following_view_mode').then((val) => {
      if (val === 'grid' || val === 'list') setViewMode(val);
    });
  }, []);

  const handleToggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      const next = prev === 'grid' ? 'list' : 'grid';
      AsyncStorage.setItem('@sumora_following_view_mode', next).catch(() => {});
      return next;
    });
  }, []);

  useEffect(() => {
    setDisplayLimit(BATCH_PAGE_SIZE);
  }, [deferredSearchQuery, selectedCategory, sortFilter]);

  // Load stored sources across all spaces
  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_STORAGE_KEY).then((json) => {
      if (json) {
        try {
          const ids = JSON.parse(json);
          if (Array.isArray(ids)) setFavoriteIds(ids);
        } catch {}
      }
    });

    AsyncStorage.getItem(TRACKED_BOOKS_STORAGE_KEY).then((json) => {
      if (json) {
        try {
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed) && parsed.length > 0) setBookSources(parsed);
        } catch {}
      }
    });

    AsyncStorage.getItem(TRACKED_CINEMA_STORAGE_KEY).then((json) => {
      if (json) {
        try {
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed) && parsed.length > 0) setCinemaSources(parsed);
        } catch {}
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function fetchSources() {
        try {
          const [data, accounts, subs] = await Promise.all([
            sourcesApi.list(),
            integrationsApi.list().catch(() => []),
            redditApi.listSources().catch(() => []),
          ]);
          if (isMounted) {
            // Read stored favorites & stored active channels
            let favs: string[] = [];
            let storedActive: string[] | null = null;
            try {
              const [rawFavs, rawActive] = await Promise.all([
                AsyncStorage.getItem(FAVORITES_STORAGE_KEY),
                AsyncStorage.getItem(ACTIVE_TRACKED_KEY),
              ]);
              if (rawFavs) favs = JSON.parse(rawFavs);
              if (rawActive) storedActive = JSON.parse(rawActive);
            } catch {}

            const activeYoutube = data.filter(
              (s: TrackedSource) => s.platform !== 'reddit' && s.isActive !== false
            );

            if (storedActive && Array.isArray(storedActive) && storedActive.length > 0) {
              const activeSet = new Set(storedActive);
              const sanitized = data.map((s: TrackedSource) => {
                if (s.platform === 'reddit') return s;
                return { ...s, isActive: activeSet.has(s.id) || activeSet.has(s.sourceId) };
              });
              setSources(sanitized);
            } else if (activeYoutube.length > MAX_ACTIVE_TRACKING) {
              const favSet = new Set(favs);
              const sanitized = data.map((s: TrackedSource) => {
                if (s.platform === 'reddit') return s;
                const shouldBeActive =
                  favSet.size > 0
                    ? favSet.has(s.sourceId)
                    : activeYoutube.slice(0, 5).some((a: TrackedSource) => a.id === s.id);
                return { ...s, isActive: shouldBeActive };
              });
              setSources(sanitized);
              const initialActive = sanitized
                .filter((s: TrackedSource) => s.platform !== 'reddit' && s.isActive)
                .map((s: TrackedSource) => s.id);
              AsyncStorage.setItem(ACTIVE_TRACKED_KEY, JSON.stringify(initialActive)).catch(() => {});
            } else {
              setSources(data);
            }
            setSubreddits(subs);
            setIsYouTubeConnected(
              accounts.some((a) => a.platform === 'youtube' && a.status === 'active')
            );
          }

          if (data.length > 0 && !data.some((s) => Boolean(s.thumbnailUrl))) {
            const alreadySynced = await AsyncStorage.getItem(SYNC_DONE_KEY);
            if (!alreadySynced) {
              try {
                const synced = await integrationsApi.syncYouTube();
                if (isMounted && synced.sources) {
                  setSources(synced.sources);
                }
                await AsyncStorage.setItem(SYNC_DONE_KEY, 'true');
              } catch {}
            }
          }
        } catch (err: any) {
          console.warn('[FollowingScreen] Failed to load sources:', err.message);
        } finally {
          if (isMounted) setLoading(false);
        }
      }

      fetchSources();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  // YouTube Handlers
  const handleToggleFavorite = useCallback(
    async (source: TrackedSource) => {
      const isFav = favoriteIds.includes(source.sourceId);
      let updated: string[];

      if (isFav) {
        updated = favoriteIds.filter((id) => id !== source.sourceId);
      } else {
        updated = [...favoriteIds, source.sourceId];
        integrationsApi.backfillChannel(source.sourceId).catch(() => {});
      }

      setFavoriteIds(updated);
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
    },
    [favoriteIds]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await sourcesApi.list();
      let storedActive: string[] | null = null;
      try {
        const raw = await AsyncStorage.getItem(ACTIVE_TRACKED_KEY);
        if (raw) storedActive = JSON.parse(raw);
      } catch {}

      if (storedActive && Array.isArray(storedActive) && storedActive.length > 0) {
        const activeSet = new Set(storedActive);
        const sanitized = data.map((s: TrackedSource) => {
          if (s.platform === 'reddit') return s;
          return { ...s, isActive: activeSet.has(s.id) || activeSet.has(s.sourceId) };
        });
        setSources(sanitized);
      } else {
        const activeYoutube = data.filter(
          (s: TrackedSource) => s.platform !== 'reddit' && s.isActive !== false
        );
        if (activeYoutube.length > MAX_ACTIVE_TRACKING) {
          const favSet = new Set(favoriteIds);
          const sanitized = data.map((s: TrackedSource) => {
            if (s.platform === 'reddit') return s;
            const shouldBeActive =
              favSet.size > 0
                ? favSet.has(s.sourceId)
                : activeYoutube.slice(0, 5).some((a: TrackedSource) => a.id === s.id);
            return { ...s, isActive: shouldBeActive };
          });
          setSources(sanitized);
        } else {
          setSources(data);
        }
      }
    } catch {} finally {
      setRefreshing(false);
    }
  }, [favoriteIds]);

  const handleToggleTracking = useCallback(
    async (source: TrackedSource) => {
      const isCurrentlyActive = source.isActive !== false;

      if (isCurrentlyActive) {
        Alert.alert(
          'Pause AI Tracking?',
          `Pause automatic AI summarization for "${source.sourceName}"? This frees up 1 tracking slot.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Pause Tracking',
              style: 'default',
              onPress: async () => {
                const nextSources = sources.map((s) =>
                  s.id === source.id ? { ...s, isActive: false } : s
                );
                setSources(nextSources);

                const activeIds = nextSources
                  .filter((s) => s.platform !== 'reddit' && s.isActive !== false)
                  .map((s) => s.id);
                await AsyncStorage.setItem(ACTIVE_TRACKED_KEY, JSON.stringify(activeIds)).catch(() => {});

                try {
                  await sourcesApi.toggle(source.id);
                } catch (err: any) {
                  // Silently preserve local preference if backend is pending server restart
                  console.warn('[handleToggleTracking] Backend toggle pending server restart:', err.message);
                }
              },
            },
          ]
        );
      } else {
        const currentActiveCount = sources.filter(
          (s) => s.platform !== 'reddit' && s.isActive !== false
        ).length;

        if (currentActiveCount >= MAX_ACTIVE_TRACKING) {
          Alert.alert(
            'Tracking Limit Reached',
            `You are actively tracking ${currentActiveCount} of ${MAX_ACTIVE_TRACKING} channels. Please pause an existing active channel before adding "${source.sourceName}".`
          );
          return;
        }

        const nextSources = sources.map((s) =>
          s.id === source.id ? { ...s, isActive: true } : s
        );
        setSources(nextSources);

        const activeIds = nextSources
          .filter((s) => s.platform !== 'reddit' && s.isActive !== false)
          .map((s) => s.id);
        await AsyncStorage.setItem(ACTIVE_TRACKED_KEY, JSON.stringify(activeIds)).catch(() => {});

        try {
          await sourcesApi.toggle(source.id);
        } catch (err: any) {
          console.warn('[handleToggleTracking] Backend toggle pending server restart:', err.message);
        }
      }
    },
    [sources]
  );

  const handleAddManualChannel = useCallback(async () => {
    const id = newChannelId.trim();
    const name = newChannelName.trim();
    if (!id) {
      Alert.alert('Channel ID Required', 'Please enter a valid YouTube Channel ID (starts with UC…).');
      return;
    }

    setAdding(true);
    try {
      const newSource = await sourcesApi.add({
        platform: 'youtube',
        sourceId: id,
        sourceName: name || id,
      });
      setSources((prev) => [newSource, ...prev]);
      setNewChannelId('');
      setNewChannelName('');
      setShowAddForm(false);
      Alert.alert('Channel Tracked', `"${name || id}" has been added. New uploads will be automatically summarized.`);
    } catch (err: any) {
      Alert.alert('Failed to Track Channel', err.message || 'Please check the channel ID and try again.');
    } finally {
      setAdding(false);
    }
  }, [newChannelId, newChannelName]);

  // Reddit Handlers
  const handleToggleSubreddit = useCallback(async (item: TrackedSource) => {
    const nextActive = !item.isActive;
    setSubreddits((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, isActive: nextActive } : s))
    );
    try {
      await redditApi.toggleSource(item.id);
    } catch {
      setSubreddits((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, isActive: !nextActive } : s))
      );
    }
  }, []);

  const handleRemoveSubreddit = useCallback((item: TrackedSource) => {
    Alert.alert('Remove Subreddit', `Stop tracking debates from ${item.sourceName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await redditApi.removeSource(item.id);
            setSubreddits((prev) => prev.filter((s) => s.id !== item.id));
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Could not remove subreddit.');
          }
        },
      },
    ]);
  }, []);

  const handleAddSubreddit = useCallback(async () => {
    const name = newSubredditInput.trim();
    if (!name) return;
    setAddingSubreddit(true);
    try {
      const newSub = await redditApi.addSource(name);
      if (newSub) {
        setSubreddits((prev) => [newSub, ...prev]);
      }
      setNewSubredditInput('');
      setShowAddSubredditModal(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add subreddit.');
    } finally {
      setAddingSubreddit(false);
    }
  }, [newSubredditInput]);

  // Book Handlers
  const handleToggleBookSource = useCallback((item: TrackedSource) => {
    setBookSources((prev) => {
      const updated = prev.map((s) => (s.id === item.id ? { ...s, isActive: !s.isActive } : s));
      AsyncStorage.setItem(TRACKED_BOOKS_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    if (!item.id.startsWith('b_') && !item.id.startsWith('b1') && !item.id.startsWith('b2')) {
      sourcesApi.toggle(item.id).catch(() => {});
    }
  }, []);

  const handleRemoveBookSource = useCallback((item: TrackedSource) => {
    Alert.alert('Remove Author/Topic', `Stop tracking ${item.sourceName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setBookSources((prev) => {
            const updated = prev.filter((s) => s.id !== item.id);
            AsyncStorage.setItem(TRACKED_BOOKS_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
            return updated;
          });
          if (!item.id.startsWith('b_') && !item.id.startsWith('b1') && !item.id.startsWith('b2')) {
            sourcesApi.remove(item.id).catch(() => {});
          }
        },
      },
    ]);
  }, []);

  // Cinema Handlers
  const handleToggleCinemaSource = useCallback((item: TrackedSource) => {
    setCinemaSources((prev) => {
      const updated = prev.map((s) => (s.id === item.id ? { ...s, isActive: !s.isActive } : s));
      AsyncStorage.setItem(TRACKED_CINEMA_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    if (!item.id.startsWith('c_') && !item.id.startsWith('c1') && !item.id.startsWith('c2')) {
      sourcesApi.toggle(item.id).catch(() => {});
    }
  }, []);

  const handleRemoveCinemaSource = useCallback((item: TrackedSource) => {
    Alert.alert('Remove Radar', `Stop tracking ${item.sourceName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setCinemaSources((prev) => {
            const updated = prev.filter((s) => s.id !== item.id);
            AsyncStorage.setItem(TRACKED_CINEMA_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
            return updated;
          });
          if (!item.id.startsWith('c_') && !item.id.startsWith('c1') && !item.id.startsWith('c2')) {
            sourcesApi.remove(item.id).catch(() => {});
          }
        },
      },
    ]);
  }, []);

  // Generic Domain Add Submission
  const handleAddDomainSource = useCallback(async () => {
    const text = domainModalInput.trim();
    if (!text) return;
    setAddingDomain(true);

    try {
      if (activeSpace === 'OPEN_LIBRARY') {
        const cleanId = text.toLowerCase().replace(/\s+/g, '-');
        let newAuthor: TrackedSource;
        try {
          newAuthor = await sourcesApi.add({
            platform: 'books',
            sourceId: cleanId,
            sourceName: text,
          });
        } catch {
          newAuthor = {
            id: `b_${Date.now()}`,
            platform: 'books',
            sourceId: cleanId,
            sourceName: text,
            isActive: true,
            memberCount: 1,
            createdAt: new Date().toISOString(),
          };
        }
        const updated = [newAuthor, ...bookSources];
        setBookSources(updated);
        await AsyncStorage.setItem(TRACKED_BOOKS_STORAGE_KEY, JSON.stringify(updated));
      } else if (activeSpace === 'TMDB') {
        const cleanId = text.toLowerCase().replace(/\s+/g, '-');
        let newPlatform: TrackedSource;
        try {
          newPlatform = await sourcesApi.add({
            platform: 'cinema',
            sourceId: cleanId,
            sourceName: text,
          });
        } catch {
          newPlatform = {
            id: `c_${Date.now()}`,
            platform: 'cinema',
            sourceId: cleanId,
            sourceName: text,
            isActive: true,
            memberCount: 1,
            createdAt: new Date().toISOString(),
          };
        }
        const updated = [newPlatform, ...cinemaSources];
        setCinemaSources(updated);
        await AsyncStorage.setItem(TRACKED_CINEMA_STORAGE_KEY, JSON.stringify(updated));
      }
      setDomainModalInput('');
      setShowAddDomainModal(false);
    } catch {
      Alert.alert('Error', 'Could not add source.');
    } finally {
      setAddingDomain(false);
    }
  }, [domainModalInput, activeSpace, bookSources, cinemaSources]);

  const handleChannelPress = useCallback(
    (source: TrackedSource) => {
      navigation.navigate('ChannelDetail', {
        channelId: source.sourceId,
        channelName: source.sourceName,
        thumbnailUrl: source.thumbnailUrl,
      });
    },
    [navigation]
  );

  // Filtered YouTube Channels
  const channelSources = useMemo(
    () => sources.filter((s) => s.platform !== 'reddit'),
    [sources]
  );

  const prioritySources = useMemo(
    () => channelSources.filter((s) => favoriteIds.includes(s.sourceId)),
    [channelSources, favoriteIds]
  );

  const activeTrackedCount = useMemo(
    () => channelSources.filter((s) => s.isActive !== false).length,
    [channelSources]
  );

  const filteredSources = useMemo(() => {
    let list = channelSources;
    if (deferredSearchQuery.trim()) {
      const q = deferredSearchQuery.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.sourceName.toLowerCase().includes(q) ||
          s.sourceId.toLowerCase().includes(q)
      );
    }
    if (selectedCategory === 'active') {
      list = list.filter((s) => s.isActive !== false);
    } else if (selectedCategory === 'favorites') {
      list = list.filter((s) => favoriteIds.includes(s.sourceId));
    } else if (selectedCategory !== 'all') {
      list = list.filter((s) => {
        const cat = classifyChannel(s.sourceName, false);
        return cat === selectedCategory;
      });
    }
    return sortSources(list, sortFilter);
  }, [channelSources, favoriteIds, deferredSearchQuery, selectedCategory, sortFilter]);

  const visibleSources = useMemo(
    () => filteredSources.slice(0, displayLimit),
    [filteredSources, displayLimit]
  );

  const handleEndReached = useCallback(() => {
    // When list has more than 50 channels (such as "All" and "Other" tabs), disable automatic infinite scroll
    // and rely on the manual Instagram-style "Load More Channels" button.
    if (filteredSources.length > BATCH_PAGE_SIZE) return;

    setDisplayLimit((prev) => {
      if (prev >= filteredSources.length) return prev;
      return Math.min(prev + BATCH_PAGE_SIZE, filteredSources.length);
    });
  }, [filteredSources.length]);

  const ListFooter = useMemo(() => {
    if (filteredSources.length === 0) return undefined;

    // Instagram-style manual "Load More" button for "All", "Other", or any category with > 50 channels
    if (filteredSources.length > BATCH_PAGE_SIZE) {
      if (visibleSources.length < filteredSources.length) {
        return (
          <View style={styles.loadMoreWrapper}>
            <TouchableOpacity
              style={styles.loadMoreOtherBtn}
              activeOpacity={0.8}
              onPress={() => {
                setDisplayLimit((prev) => Math.min(prev + BATCH_PAGE_SIZE, filteredSources.length));
              }}>
              <Text style={styles.loadMoreOtherBtnText}>
                Load More Channels (Showing {visibleSources.length} of {filteredSources.length}) ↓
              </Text>
            </TouchableOpacity>
          </View>
        );
      }
      return (
        <View style={styles.gridFooterEnd}>
          <Text style={styles.gridFooterEndText}>
            Showing all {filteredSources.length} {filteredSources.length === 1 ? 'channel' : 'channels'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.gridFooterEnd}>
        <Text style={styles.gridFooterEndText}>
          Showing all {filteredSources.length} {filteredSources.length === 1 ? 'channel' : 'channels'}
        </Text>
      </View>
    );
  }, [visibleSources.length, filteredSources.length, styles]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: channelSources.length,
      active: channelSources.filter((s) => s.isActive !== false).length,
    };
    for (const cat of CATEGORIES) {
      if (cat.id !== 'all' && cat.id !== 'active') {
        counts[cat.id] = 0;
      }
    }
    for (const s of channelSources) {
      const isFav = favoriteIds.includes(s.sourceId);
      const catId = classifyChannel(s.sourceName, isFav);
      counts[catId] = (counts[catId] || 0) + 1;
    }
    return counts;
  }, [channelSources, favoriteIds]);

  const keyExtractor = useCallback((item: TrackedSource) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: TrackedSource }) => {
      const isFav = favoriteIds.includes(item.sourceId);
      if (viewMode === 'list') {
        return (
          <ChannelListRow
            item={item}
            isFavorite={isFav}
            styles={styles}
            onToggle={handleToggleTracking}
            onToggleFavorite={handleToggleFavorite}
            onPress={handleChannelPress}
          />
        );
      }
      return (
        <ChannelGridCard
          item={item}
          isFavorite={isFav}
          styles={styles}
          onToggle={handleToggleTracking}
          onToggleFavorite={handleToggleFavorite}
          onPress={handleChannelPress}
        />
      );
    },
    [viewMode, favoriteIds, styles, handleToggleTracking, handleToggleFavorite, handleChannelPress]
  );

  // Dynamic Header Meta per Active Space
  const spaceHeaderMeta = useMemo(() => {
    switch (activeSpace) {
      case 'OPEN_LIBRARY':
        return {
          title: 'Tracked Authors & Topics',
          subtitle: 'Manage followed non-fiction authors, genres & mental model topics',
          count: bookSources.length,
          color: '#10B981',
        };
      case 'TMDB':
        return {
          title: 'Tracked Streaming & Genres',
          subtitle: 'Manage followed streaming networks, critic radars & cinema genres',
          count: cinemaSources.length,
          color: '#F59E0B',
        };
      case 'REDDIT':
        return {
          title: 'Tracked Subreddits',
          subtitle: 'Track high-upvote debates and community consensus across Reddit',
          count: subreddits.length,
          color: '#FF4500',
        };
      case 'YOUTUBE':
      default:
        return {
          title: 'Tracked Channels',
          subtitle: 'Select key channels for automated AI summaries & push alerts',
          count: channelSources.length,
          color: colors.primary,
        };
    }
  }, [activeSpace, bookSources.length, cinemaSources.length, subreddits.length, channelSources.length, activeTrackedCount, colors.primary]);

  const searchPlaceholder = useMemo(() => {
    if (selectedCategory === 'all') return 'Search in All Channels…';
    if (selectedCategory === 'other') return 'Search in Other Channels…';
    const cat = CATEGORIES.find((c) => c.id === selectedCategory);
    return cat ? `Search in ${cat.label}…` : 'Search channels by name or ID…';
  }, [selectedCategory]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {activeSpace !== 'YOUTUBE' && (
        <FollowingHeader
          styles={styles}
          title={spaceHeaderMeta.title}
          subtitle={spaceHeaderMeta.subtitle}
          count={spaceHeaderMeta.count}
          badgeColor={spaceHeaderMeta.color}
          addButtonColor={spaceHeaderMeta.color}
          isAddActive={
            activeSpace === 'REDDIT'
              ? showAddSubredditModal
              : showAddDomainModal
          }
          onToggleAdd={() => {
            if (activeSpace === 'REDDIT') {
              setShowAddSubredditModal(true);
            } else {
              setShowAddDomainModal(true);
            }
          }}
        />
      )}

      {/* 1. YouTube Space */}
      {activeSpace === 'YOUTUBE' && (
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading tracked channels…</Text>
            </View>
          ) : channelSources.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyTitle}>No Channels Tracked Yet</Text>
              <Text style={styles.emptySubtitle}>
                Connect your YouTube account or manually add channel IDs to start auto-generating video summaries.
              </Text>
            </View>
          ) : (
            <ScrollView
              stickyHeaderIndices={[1]}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                />
              }>
              {/* Child 0: Top Overview Section (Tracked Channels + Quota Card) - Scrolls naturally away */}
              <View style={styles.topSectionWrapper}>
                <FollowingHeader
                  styles={styles}
                  title={spaceHeaderMeta.title}
                  subtitle={spaceHeaderMeta.subtitle}
                  count={spaceHeaderMeta.count}
                  badgeColor={spaceHeaderMeta.color}
                  addButtonColor={spaceHeaderMeta.color}
                  isAddActive={showAddForm}
                  onToggleAdd={() => setShowAddForm((prev) => !prev)}
                />

                {showAddForm && (
                  <ManualChannelAddForm
                    styles={styles}
                    channelName={newChannelName}
                    channelId={newChannelId}
                    onChangeName={setNewChannelName}
                    onChangeId={setNewChannelId}
                    onSubmit={handleAddManualChannel}
                    adding={adding}
                  />
                )}

                {/* Active AI Tracking Quota Card */}
                {(() => {
                  const quotaPercent = Math.round((activeTrackedCount / MAX_ACTIVE_TRACKING) * 100);
                  const fillWidthPct = Math.max(18, Math.min(100, quotaPercent));

                  return (
                    <View style={styles.quotaCard}>
                      <View style={styles.quotaCardHeader}>
                        <View style={styles.quotaCardTitleRow}>
                          <Text style={styles.quotaCardTitle}>⚡ Active AI Tracking Slots</Text>
                        </View>
                        <View style={styles.quotaCardCountBadge}>
                          <Text style={styles.quotaCardCountText}>
                            {activeTrackedCount} of {MAX_ACTIVE_TRACKING} Active
                          </Text>
                        </View>
                      </View>

                      <View style={styles.quotaTrack}>
                        <View style={[styles.quotaFill, { width: `${fillWidthPct}%` }]}>
                          <View style={styles.gradientFillContainer}>
                            {GRADIENT_STEPS.map((color, idx) => (
                              <View key={idx} style={{ flex: 1, backgroundColor: color }} />
                            ))}
                          </View>
                          <Text style={styles.quotaPercentText}>
                            {quotaPercent}%
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.quotaSubText}>
                        Automated AI transcripts & digests run only for Active channels to ensure fast, high-signal summaries.
                      </Text>
                    </View>
                  );
                })()}

                {/* Priority Channels Avatar Bar - Scrolls naturally with the page */}
                <PriorityChannelsBar
                  prioritySources={prioritySources}
                  styles={styles}
                  selectedCategory={selectedCategory}
                  onToggleCategoryFilter={() =>
                    setSelectedCategory((prev) => (prev === 'favorites' ? 'all' : 'favorites'))
                  }
                  onChannelPress={handleChannelPress}
                />
              </View>

              {/* Child 1: Sticky Header (Search & Filters + Category Tabs Only) */}
              <View style={styles.stickyHeaderContainer}>
                <View style={styles.searchBarRow}>
                  <View style={{ flex: 1 }}>
                    <SearchBar
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder={searchPlaceholder}
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.filterBtn,
                      (selectedCategory !== 'all' || sortFilter !== 'newest') && styles.filterBtnActive,
                    ]}
                    onPress={() => setShowFilterModal(true)}
                    activeOpacity={0.8}>
                    <Text
                      style={[
                        styles.filterBtnText,
                        (selectedCategory !== 'all' || sortFilter !== 'newest') && styles.filterBtnTextActive,
                      ]}>
                      ⚡ Filters{selectedCategory !== 'all' ? ` (${CATEGORIES.find((c) => c.id === selectedCategory)?.icon || '1'})` : ''}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.viewModeToggleBtn,
                      viewMode === 'list' && styles.viewModeToggleBtnActive,
                    ]}
                    onPress={handleToggleViewMode}
                    activeOpacity={0.8}>
                    <Text
                      style={[
                        styles.viewModeToggleIconText,
                        viewMode === 'list' && { color: colors.primary },
                      ]}>
                      {viewMode === 'grid' ? '☰' : '⊞'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <CategoryPillsBar
                  styles={styles}
                  selectedCategory={selectedCategory}
                  totalChannelsCount={channelSources.length}
                  categoryCounts={categoryCounts}
                  onSelectCategory={setSelectedCategory}
                />
              </View>

              {/* Child 2: Channels Section Header & Items */}
              <View style={styles.gridListContent}>
                {/* 2-Column Grid Section Header */}
                <View style={styles.gridSectionHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CategorySquircleIcon category={selectedCategory} size={16} style={{ marginRight: 6 }} />
                    <Text style={styles.gridSectionTitle}>
                      {selectedCategory === 'all'
                        ? `All Channels (${filteredSources.length})`
                        : `${CATEGORIES.find((c) => c.id === selectedCategory)?.label || 'Channels'} (${filteredSources.length})`}
                    </Text>
                  </View>
                  <Text style={styles.gridSectionSub}>
                    {sortFilter === 'newest'
                      ? 'Newest'
                      : sortFilter === 'oldest'
                      ? 'Oldest'
                      : sortFilter === 'a_z'
                      ? 'A → Z'
                      : 'Z → A'}
                  </Text>
                </View>

                {/* Items in Grid or List */}
                {viewMode === 'grid' ? (
                  <View style={styles.gridColumnWrapper}>
                    {visibleSources.map((item) => (
                      <ChannelGridCard
                        key={item.id}
                        item={item}
                        isFavorite={favoriteIds.includes(item.sourceId)}
                        styles={styles}
                        onToggle={handleToggleTracking}
                        onToggleFavorite={handleToggleFavorite}
                        onPress={handleChannelPress}
                      />
                    ))}
                  </View>
                ) : (
                  <View>
                    {visibleSources.map((item) => (
                      <ChannelListRow
                        key={item.id}
                        item={item}
                        isFavorite={favoriteIds.includes(item.sourceId)}
                        styles={styles}
                        onToggle={handleToggleTracking}
                        onToggleFavorite={handleToggleFavorite}
                        onPress={handleChannelPress}
                      />
                    ))}
                  </View>
                )}

                {/* Footer */}
                {ListFooter}
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {/* 2. Reddit Space */}
      {activeSpace === 'REDDIT' && (
        <SubredditListView
          subreddits={subreddits}
          styles={styles}
          onToggleSubreddit={handleToggleSubreddit}
          onRemoveSubreddit={handleRemoveSubreddit}
          onOpenAddModal={() => setShowAddSubredditModal(true)}
        />
      )}

      {/* 3. Book Insights (Open Library) Space */}
      {activeSpace === 'OPEN_LIBRARY' && (
        <DomainSourceListView
          space="OPEN_LIBRARY"
          items={bookSources}
          styles={styles}
          onToggle={handleToggleBookSource}
          onRemove={handleRemoveBookSource}
          onOpenAddModal={() => setShowAddDomainModal(true)}
          emptyIcon="📚"
          emptyTitle="No Authors Tracked"
          emptySubtitle="Follow your favorite authors or non-fiction genres to auto-distill 5-minute mental models."
          addBtnText="+ Track Author"
          themeColor="#10B981"
          filterCategories={['All', 'Psychology', 'Productivity', 'Wealth', 'Philosophy']}
          activeFilter={activeBookCategory}
          onSelectFilter={setActiveBookCategory}
        />
      )}

      {/* 4. Cinema & OTT (TMDB) Space */}
      {activeSpace === 'TMDB' && (
        <DomainSourceListView
          space="TMDB"
          items={cinemaSources}
          styles={styles}
          onToggle={handleToggleCinemaSource}
          onRemove={handleRemoveCinemaSource}
          onOpenAddModal={() => setShowAddDomainModal(true)}
          emptyIcon="🎬"
          emptyTitle="No Streaming Radars Tracked"
          emptySubtitle="Follow Netflix, Max, or your favorite genres to auto-distill spoiler-free critic consensus."
          addBtnText="+ Track Platform"
          themeColor="#F59E0B"
          filterCategories={['All', 'Netflix', 'Max', 'Apple TV+', 'Top Rated', 'Sci-Fi']}
          activeFilter={activeCinemaCategory}
          onSelectFilter={setActiveCinemaCategory}
        />
      )}

      {/* Modals */}
      <FilterModal
        visible={showFilterModal}
        styles={styles}
        selectedCategory={selectedCategory}
        sortFilter={sortFilter}
        categoryCounts={categoryCounts}
        onSelectCategory={setSelectedCategory}
        onSelectSort={setSortFilter}
        onReset={() => {
          setSelectedCategory('all');
          setSortFilter('newest');
        }}
        onClose={() => setShowFilterModal(false)}
      />

      <AddSubredditModal
        visible={showAddSubredditModal}
        styles={styles}
        value={newSubredditInput}
        onChangeText={setNewSubredditInput}
        onSubmit={handleAddSubreddit}
        loading={addingSubreddit}
        onClose={() => setShowAddSubredditModal(false)}
      />

      <AddDomainSourceModal
        visible={showAddDomainModal}
        title={activeSpace === 'OPEN_LIBRARY' ? 'Track Author or Topic' : 'Track Streaming Network'}
        placeholder={activeSpace === 'OPEN_LIBRARY' ? 'e.g. James Clear or Psychology' : 'e.g. Netflix, HBO, or Sci-Fi'}
        hint={
          activeSpace === 'OPEN_LIBRARY'
            ? 'Enter author name or non-fiction category to prioritize in your daily reading feed.'
            : 'Enter streaming network or genre to track upcoming releases and consensus.'
        }
        themeColor={activeSpace === 'OPEN_LIBRARY' ? '#10B981' : '#F59E0B'}
        styles={styles}
        value={domainModalInput}
        onChangeText={setDomainModalInput}
        onSubmit={handleAddDomainSource}
        loading={addingDomain}
        onClose={() => {
          setDomainModalInput('');
          setShowAddDomainModal(false);
        }}
      />
    </SafeAreaView>
  );
};
