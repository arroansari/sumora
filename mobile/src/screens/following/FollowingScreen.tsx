import React, {
  useState,
  useMemo,
  useCallback,
  useDeferredValue,
  useEffect,
} from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { sourcesApi, integrationsApi } from '../../services/api';
import { TrackedSource } from '../../types/models.types';
import { SearchBar } from '../../components/atoms/SearchBar';
import { FilterPills, FilterPillOption } from '../../components/atoms/FilterPills';
import { createFollowingStyles } from './FollowingScreen.styles';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation.types';

// ─── Types & Categories ───────────────────────────────────────────────────────

type SortFilter = 'newest' | 'oldest' | 'a_z' | 'z_a';

const SORT_OPTIONS: FilterPillOption<SortFilter>[] = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'A → Z', value: 'a_z' },
  { label: 'Z → A', value: 'z_a' },
];

export type CategoryId =
  | 'all'
  | 'favorites'
  | 'tech'
  | 'business'
  | 'news'
  | 'design'
  | 'food'
  | 'entertainment'
  | 'education'
  | 'other';

interface CategoryConfig {
  id: CategoryId;
  label: string;
  icon: string;
  keywords: string[];
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'favorites',
    label: 'Favorites (Priority)',
    icon: '⭐',
    keywords: [],
  },
  {
    id: 'tech',
    label: 'Tech & Dev',
    icon: '💻',
    keywords: [
      'tech', 'code', 'dev', 'programming', 'software', 'python', 'javascript',
      'react', 'flutter', 'engineer', 'ai', 'cloud', 'cyber', 'gadget', 'computer',
      'linux', 'data', 'terminal', 'algo', 'stack', 'web', 'geek',
    ],
  },
  {
    id: 'business',
    label: 'Business & Finance',
    icon: '💼',
    keywords: [
      'business', 'finance', 'money', 'invest', 'crypto', 'stock', 'market',
      'startup', 'wealth', 'economy', 'trade', 'real estate', 'bank', 'capital',
      'venture', 'fund', 'sales',
    ],
  },
  {
    id: 'news',
    label: 'News & Politics',
    icon: '📰',
    keywords: [
      'news', 'aaj tak', 'ndtv', 'bbc', 'cnn', 'politics', 'live', 'report',
      'press', 'times', 'wire', 'daily', 'abp', 'zee', 'bharat', 'current',
      'affairs', 'media', 'bulletin',
    ],
  },
  {
    id: 'design',
    label: 'Design & Creative',
    icon: '🎨',
    keywords: [
      'design', 'photoshop', 'figma', 'art', 'animation', 'creative', 'ui', 'ux',
      'illustrator', '3d', 'blender', 'drawing', 'vfx', 'graphics', 'photo',
      'camera', 'editing',
    ],
  },
  {
    id: 'food',
    label: 'Food & Cooking',
    icon: '🍔',
    keywords: [
      'food', 'recipe', 'cook', 'kitchen', 'chef', 'taste', 'meal', 'baking',
      'street food', 'eating', 'diet', 'delicious', 'spicy', 'restaurant',
      'dish', 'culinary',
    ],
  },
  {
    id: 'entertainment',
    label: 'Entertainment & Media',
    icon: '🎬',
    keywords: [
      'drama', 'movie', 'cinema', 'music', 'song', 'comedy', 'gaming', 'games',
      'entertainment', 'series', 'tv', 'show', 'clip', 'roast', 'vlog', 'fun',
      'trailer', 'standup',
    ],
  },
  {
    id: 'education',
    label: 'Education & Knowledge',
    icon: '📚',
    keywords: [
      'study', 'learn', 'science', 'history', 'academy', 'course', 'physics',
      'math', 'facts', 'documentary', 'space', 'geography', 'philosophy',
      'mirza', 'islam', 'scholar', 'lecture', 'tutorial', 'insight',
    ],
  },
  {
    id: 'other',
    label: 'Other Channels',
    icon: '📺',
    keywords: [],
  },
];

const FAVORITES_STORAGE_KEY = 'sumora:favorite_channel_ids';
const SYNC_DONE_KEY = 'sumora:yt_thumb_sync_done';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

function classifyChannel(sourceName: string, isFav: boolean): CategoryId {
  if (isFav) return 'favorites';
  const name = sourceName.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.id === 'favorites' || cat.id === 'other') continue;
    if (cat.keywords.some((k) => name.includes(k))) {
      return cat.id;
    }
  }
  return 'other';
}

const sortSources = (arr: TrackedSource[], filter: SortFilter): TrackedSource[] => {
  const copy = [...arr];
  switch (filter) {
    case 'newest':
      return copy.sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
    case 'oldest':
      return copy.sort(
        (a, b) =>
          new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
      );
    case 'a_z':
      return copy.sort((a, b) =>
        a.sourceName.localeCompare(b.sourceName, undefined, { sensitivity: 'base' })
      );
    case 'z_a':
      return copy.sort((a, b) =>
        b.sourceName.localeCompare(a.sourceName, undefined, { sensitivity: 'base' })
      );
  }
};

// ─── ChannelRow Component ────────────────────────────────────────────────────

interface ChannelRowProps {
  item: TrackedSource;
  isFavorite: boolean;
  styles: ReturnType<typeof createFollowingStyles>;
  onToggle: (source: TrackedSource) => void;
  onToggleFavorite: (source: TrackedSource) => void;
  onPress: (source: TrackedSource) => void;
}

const ChannelRow = React.memo<ChannelRowProps>(
  ({ item, isFavorite, styles, onToggle, onToggleFavorite, onPress }) => (
    <TouchableOpacity
      style={styles.sourceCard}
      onPress={() => onPress(item)}
      activeOpacity={0.75}>
      <View style={styles.sourceAvatar}>
        {item.thumbnailUrl ? (
          <FastImage
            source={{
              uri: item.thumbnailUrl,
              priority: FastImage.priority.normal,
              cache: FastImage.cacheControl.immutable,
            }}
            style={styles.sourceAvatarImage}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <Text style={styles.sourceAvatarText}>{getInitials(item.sourceName)}</Text>
        )}
      </View>

      <View style={styles.sourceInfo}>
        <Text style={styles.sourceName} numberOfLines={1}>
          {item.sourceName}
        </Text>
        <Text style={styles.sourceIdText} numberOfLines={1}>
          ID: {item.sourceId.slice(0, 18)}…
        </Text>
        <Text style={styles.sourceHint} numberOfLines={1}>
          Tap to view summaries ›
        </Text>
      </View>

      <View style={styles.sourceActionRow}>
        {/* Star / Favorite Priority Button */}
        <TouchableOpacity
          style={[styles.starBtn, isFavorite && styles.starBtnActive]}
          onPress={() => onToggleFavorite(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}>
          <Text style={[styles.starIcon, isFavorite && styles.starIconActive]}>
            {isFavorite ? '⭐' : '☆'}
          </Text>
        </TouchableOpacity>

        {/* Tracking Pill Button */}
        <TouchableOpacity style={styles.trackingButton} onPress={() => onToggle(item)}>
          <Text style={styles.trackingButtonText}>Tracking ✓</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
);

// ─── Main Following Screen ───────────────────────────────────────────────────

export const FollowingScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createFollowingStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [sources, setSources] = useState<TrackedSource[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isYouTubeConnected, setIsYouTubeConnected] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [sortFilter, setSortFilter] = useState<SortFilter>('newest');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newChannelId, setNewChannelId] = useState<string>('');
  const [newChannelName, setNewChannelName] = useState<string>('');
  const [adding, setAdding] = useState<boolean>(false);

  // Load persistent favorites from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_STORAGE_KEY).then((json) => {
      if (json) {
        try {
          const ids = JSON.parse(json);
          if (Array.isArray(ids)) setFavoriteIds(ids);
        } catch {
          // ignore parsing error
        }
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function fetchSources() {
        try {
          const [data, accounts] = await Promise.all([
            sourcesApi.list(),
            integrationsApi.list().catch(() => []),
          ]);
          if (isMounted) {
            setSources(data);
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
              } catch {
                // ignore
              }
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

  // Toggle favorite / priority summarization
  const handleToggleFavorite = useCallback(
    async (source: TrackedSource) => {
      const isFav = favoriteIds.includes(source.sourceId);
      let updated: string[];

      if (isFav) {
        updated = favoriteIds.filter((id) => id !== source.sourceId);
      } else {
        updated = [...favoriteIds, source.sourceId];
        // Priority auto-summarization trigger: when marked favorite, immediately backfill & pre-summarize in background
        integrationsApi.backfillChannel(source.sourceId).catch((err) => {
          console.warn('[FollowingScreen] Favorite backfill note:', err.message);
        });
      }

      setFavoriteIds(updated);
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
    },
    [favoriteIds]
  );

  const handleSyncYouTube = useCallback(async () => {
    setSyncing(true);
    try {
      const synced = await integrationsApi.syncYouTube();
      if (synced.sources) {
        setSources(synced.sources);
      } else {
        const data = await sourcesApi.list();
        setSources(data);
      }
    } catch (err: any) {
      Alert.alert('Sync Failed', err.message || 'Could not sync YouTube subscriptions.');
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await sourcesApi.list();
      setSources(data);
    } catch (err: any) {
      console.warn('[FollowingScreen] Refresh failed');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleToggleTracking = useCallback((source: TrackedSource) => {
    Alert.alert(
      'Stop Tracking?',
      `Do you want to stop tracking new uploads from "${source.sourceName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop Tracking',
          style: 'destructive',
          onPress: async () => {
            try {
              await sourcesApi.remove(source.id);
              setSources((prev) => prev.filter((s) => s.id !== source.id));
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to stop tracking channel.');
            }
          },
        },
      ]
    );
  }, []);

  const handleAddManualChannel = useCallback(async () => {
    if (!newChannelId.trim() || !newChannelName.trim()) {
      Alert.alert('Required Fields', 'Please enter both Channel Name and YouTube Channel ID.');
      return;
    }

    setAdding(true);
    try {
      const added = await sourcesApi.add({
        platform: 'youtube',
        sourceId: newChannelId.trim(),
        sourceName: newChannelName.trim(),
      });
      setSources((prev) => [added, ...prev]);
      setNewChannelId('');
      setNewChannelName('');
      setShowAddForm(false);
      Alert.alert('Success', `Now tracking "${added.sourceName}" for new uploads.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add channel.');
    } finally {
      setAdding(false);
    }
  }, [newChannelId, newChannelName]);

  const handleChannelPress = useCallback(
    (source: TrackedSource) => {
      navigation.navigate('ChannelDetail', {
        channelId: source.sourceId,
        channelName: source.sourceName,
        thumbnailUrl: source.thumbnailUrl,
        trackedSince: source.createdAt,
      });
    },
    [navigation]
  );

  // ── SectionList Categorization ─────────────────────────────────────────────

  const sections = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    // 1. Filter by search query if any
    const searched = query
      ? sources.filter(
          (s) =>
            s.sourceName.toLowerCase().includes(query) ||
            s.sourceId.toLowerCase().includes(query)
        )
      : sources;

    // 2. Group into category buckets
    const bucketMap = new Map<CategoryId, TrackedSource[]>();
    for (const cat of CATEGORIES) {
      bucketMap.set(cat.id, []);
    }

    for (const source of searched) {
      const isFav = favoriteIds.includes(source.sourceId);
      const catId = classifyChannel(source.sourceName, isFav);
      bucketMap.get(catId)?.push(source);
    }

    // 3. Build SectionList sections based on selectedCategory filter
    const result: Array<{
      id: CategoryId;
      title: string;
      icon: string;
      totalCount: number;
      isCollapsed: boolean;
      data: TrackedSource[];
    }> = [];

    for (const cat of CATEGORIES) {
      if (selectedCategory !== 'all' && selectedCategory !== cat.id) {
        continue;
      }

      const items = bucketMap.get(cat.id) || [];
      if (items.length > 0) {
        const isCollapsed = Boolean(collapsedSections[cat.id]);
        result.push({
          id: cat.id,
          title: cat.label,
          icon: cat.icon,
          totalCount: items.length,
          isCollapsed,
          data: isCollapsed ? [] : sortSources(items, sortFilter),
        });
      }
    }

    return result;
  }, [sources, favoriteIds, deferredSearchQuery, selectedCategory, sortFilter, collapsedSections]);

  const toggleCollapse = useCallback((catId: CategoryId) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  }, []);

  // Category counts for pills
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sources.length };
    for (const cat of CATEGORIES) {
      counts[cat.id] = 0;
    }
    for (const s of sources) {
      const isFav = favoriteIds.includes(s.sourceId);
      const catId = classifyChannel(s.sourceName, isFav);
      counts[catId] = (counts[catId] || 0) + 1;
    }
    return counts;
  }, [sources, favoriteIds]);

  const keyExtractor = useCallback((item: TrackedSource) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: TrackedSource }) => (
      <ChannelRow
        item={item}
        isFavorite={favoriteIds.includes(item.sourceId)}
        styles={styles}
        onToggle={handleToggleTracking}
        onToggleFavorite={handleToggleFavorite}
        onPress={handleChannelPress}
      />
    ),
    [favoriteIds, styles, handleToggleTracking, handleToggleFavorite, handleChannelPress]
  );

  const renderSectionHeader = useCallback(
    ({
      section,
    }: {
      section: {
        id: CategoryId;
        title: string;
        icon: string;
        totalCount: number;
        isCollapsed: boolean;
        data: TrackedSource[];
      };
    }) => (
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleCollapse(section.id)}
        activeOpacity={0.75}>
        <View style={styles.sectionTitleRow}>
          <Text style={{ fontSize: 16 }}>{section.icon}</Text>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>
            {section.totalCount} {section.totalCount === 1 ? 'channel' : 'channels'}
          </Text>
          <Text style={styles.sectionChevron}>
            {section.isCollapsed ? '▶' : '▼'}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [styles, toggleCollapse]
  );

  const ListHeader = useMemo(
    () => (
      <View>
        {/* Search Bar + Filter Button Row */}
        <View style={styles.searchBarRow}>
          <View style={{ flex: 1 }}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search channels by name or ID…"
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
        </View>

        {/* Horizontal Category Switcher */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryPillsRow}
          contentContainerStyle={{ gap: 8, paddingRight: 32 }}>
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === 'all' && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory('all')}>
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === 'all' && styles.categoryChipTextActive,
              ]}>
              All ({sources.length})
            </Text>
          </TouchableOpacity>

          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            if (count === 0 && cat.id !== 'favorites') return null;
            const isActive = selectedCategory === cat.id;

            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.id)}>
                <Text
                  style={[
                    styles.categoryChipText,
                    isActive && styles.categoryChipTextActive,
                  ]}>
                  {cat.icon} {cat.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    ),
    [
      styles,
      searchQuery,
      sortFilter,
      selectedCategory,
      sources.length,
      categoryCounts,
    ]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Tracked Channels</Text>
            {sources.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{sources.length}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.toggleAddButton,
              showAddForm && styles.toggleAddButtonActive,
            ]}
            onPress={() => setShowAddForm((prev) => !prev)}>
            <Text
              style={[
                styles.toggleAddButtonText,
                showAddForm && styles.toggleAddButtonTextActive,
              ]}>
              {showAddForm ? '✕ Close' : '+ Add'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          Manage subscribed channels for automatic AI summarization
        </Text>
      </View>

      {/* Manual Add Form */}
      {showAddForm && (
        <View style={styles.addBox}>
          <Text style={styles.addBoxTitle}>Track a YouTube Channel</Text>
          <TextInput
            style={styles.input}
            placeholder="Channel Name (e.g. Marques Brownlee)"
            placeholderTextColor={colors.textMuted}
            value={newChannelName}
            onChangeText={setNewChannelName}
          />
          <TextInput
            style={styles.input}
            placeholder="Channel ID (e.g. UCbXXXXXXXXXXXXXX)"
            placeholderTextColor={colors.textMuted}
            value={newChannelId}
            onChangeText={setNewChannelId}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddManualChannel}
            disabled={adding}>
            {adding ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.addButtonText}>Start Tracking</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Body: SectionList */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading tracked channels…</Text>
        </View>
      ) : sources.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 44, marginBottom: 12 }}>📡</Text>
          <Text style={styles.emptyTitle}>No Channels Tracked</Text>
          <Text style={styles.emptySubtitle}>
            Connect your YouTube account to automatically track your subscriptions, or add a channel manually above.
          </Text>
          {isYouTubeConnected && (
            <TouchableOpacity
              style={styles.syncEmptyButton}
              onPress={handleSyncYouTube}
              disabled={syncing}>
              {syncing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.syncEmptyButtonText}>Sync YouTube Subscriptions</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
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

      {/* ── Filter & Sort Modal ────────────────────────────────────────── */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚡ Filter & Sort Channels</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Section 1: Categories */}
            <Text style={styles.modalSectionTitle}>Category Filter</Text>
            <View style={styles.modalGrid}>
              <TouchableOpacity
                style={[
                  styles.modalChip,
                  selectedCategory === 'all' && styles.modalChipActive,
                ]}
                onPress={() => setSelectedCategory('all')}
                activeOpacity={0.75}>
                <Text
                  style={[
                    styles.modalChipText,
                    selectedCategory === 'all' && styles.modalChipTextActive,
                  ]}>
                  All Channels ({sources.length})
                </Text>
              </TouchableOpacity>

              {CATEGORIES.map((cat) => {
                const count = categoryCounts[cat.id] || 0;
                if (count === 0 && cat.id !== 'favorites') return null;
                const isActive = selectedCategory === cat.id;

                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.modalChip, isActive && styles.modalChipActive]}
                    onPress={() => setSelectedCategory(cat.id)}
                    activeOpacity={0.75}>
                    <Text
                      style={[
                        styles.modalChipText,
                        isActive && styles.modalChipTextActive,
                      ]}>
                      {cat.icon} {cat.label} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section 2: Sort Order */}
            <Text style={styles.modalSectionTitle}>Sort Order</Text>
            <View style={styles.modalGrid}>
              {SORT_OPTIONS.map((opt) => {
                const isActive = sortFilter === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.modalChip, isActive && styles.modalChipActive]}
                    onPress={() => setSortFilter(opt.value)}
                    activeOpacity={0.75}>
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

            {/* Footer Buttons */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  setSelectedCategory('all');
                  setSortFilter('newest');
                }}
                activeOpacity={0.75}>
                <Text style={styles.modalSecondaryBtnText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.8}>
                <Text style={styles.modalPrimaryBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
