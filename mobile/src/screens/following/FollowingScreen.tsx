import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useDeferredValue,
} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ListRenderItemInfo,
  Animated,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { sourcesApi, integrationsApi } from '../../services/api';
import { TrackedSource } from '../../types/models.types';
import { SearchBar } from '../../components/atoms/SearchBar';
import { FilterPills, FilterPillOption } from '../../components/atoms/FilterPills';
import { createFollowingStyles } from './FollowingScreen.styles';

// ─── Types ───────────────────────────────────────────────────────────────────

type SortFilter = 'newest' | 'oldest' | 'a_z' | 'z_a';

const SORT_OPTIONS: FilterPillOption<SortFilter>[] = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'A → Z', value: 'a_z' },
  { label: 'Z → A', value: 'z_a' },
];

const UNDO_DURATION_MS = 6000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

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

// ─── ChannelRow ──────────────────────────────────────────────────────────────

interface ChannelRowProps {
  item: TrackedSource;
  styles: ReturnType<typeof createFollowingStyles>;
  onToggle: (source: TrackedSource) => void;
}

const ChannelRow = React.memo<ChannelRowProps>(({ item, styles, onToggle }) => (
  <View style={styles.sourceCard}>
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
        ID: {item.sourceId.slice(0, 18)}...
      </Text>
    </View>

    <TouchableOpacity style={styles.trackingButton} onPress={() => onToggle(item)}>
      <Text style={styles.trackingButtonText}>Tracking ✓</Text>
    </TouchableOpacity>
  </View>
));

// ─── UndoBanner ──────────────────────────────────────────────────────────────

interface UndoBannerProps {
  count: number;
  countdown: number;
  onUndo: () => void;
  styles: ReturnType<typeof createFollowingStyles>;
}

const UndoBanner = React.memo<UndoBannerProps>(({ count, countdown, onUndo, styles }) => (
  <View style={styles.undoBanner}>
    <Text style={styles.undoBannerText}>
      Untracked {count} channel{count !== 1 ? 's' : ''} · {countdown}s
    </Text>
    <TouchableOpacity onPress={onUndo} style={styles.undoButton}>
      <Text style={styles.undoButtonText}>Undo</Text>
    </TouchableOpacity>
  </View>
));

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const FollowingScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createFollowingStyles(colors), [colors]);

  const [sources, setSources] = useState<TrackedSource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [sortFilter, setSortFilter] = useState<SortFilter>('newest');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newChannelId, setNewChannelId] = useState<string>('');
  const [newChannelName, setNewChannelName] = useState<string>('');
  const [adding, setAdding] = useState<boolean>(false);

  // Undo state
  const [undoCountdown, setUndoCountdown] = useState<number>(0);
  const removedSourcesRef = useRef<TrackedSource[]>([]);
  const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchSources() {
      try {
        const data = await sourcesApi.list();
        if (isMounted) {
          setSources(data);
        }

        // Backfill channel profile images for already-connected YouTube accounts
        if (data.length > 0 && !data.some((s) => Boolean(s.thumbnailUrl))) {
          try {
            const synced = await integrationsApi.syncYouTube();
            if (isMounted && synced.sources) {
              setSources(synced.sources);
            }
          } catch {
            // Ignore if YouTube account isn't connected
          }
        }
      } catch (err: any) {
        console.warn('[FollowingScreen] Failed to load sources:', err.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSources();

    return () => {
      isMounted = false;
    };
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearInterval(undoTimerRef.current);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  const filteredSources = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    const searched = query
      ? sources.filter(
          (s) =>
            s.sourceName.toLowerCase().includes(query) ||
            s.sourceId.toLowerCase().includes(query)
        )
      : sources;
    return sortSources(searched, sortFilter);
  }, [sources, deferredSearchQuery, sortFilter]);

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

  // ── Untrack All ────────────────────────────────────────────────────────────

  const startUndoTimer = useCallback(() => {
    if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

    setUndoCountdown(Math.round(UNDO_DURATION_MS / 1000));

    undoTimerRef.current = setInterval(() => {
      setUndoCountdown((prev) => {
        if (prev <= 1) {
          if (undoTimerRef.current) clearInterval(undoTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    undoTimeoutRef.current = setTimeout(() => {
      // Undo window expired — clear ref so GC can collect
      removedSourcesRef.current = [];
      setUndoCountdown(0);
    }, UNDO_DURATION_MS);
  }, []);

  const handleUntrackAll = useCallback(() => {
    if (sources.length === 0) return;

    Alert.alert(
      'Untrack All Channels?',
      `This will stop tracking all ${sources.length} channel${sources.length !== 1 ? 's' : ''}. You have 6 seconds to undo.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Untrack All',
          style: 'destructive',
          onPress: async () => {
            // Snapshot for undo
            removedSourcesRef.current = [...sources];
            const count = sources.length;

            // Optimistically clear the list
            setSources([]);
            startUndoTimer();

            // Fire-and-forget removals in background
            try {
              await Promise.all(
                removedSourcesRef.current.map((s) => sourcesApi.remove(s.id))
              );
            } catch (err: any) {
              // If calls fail, undo banner is still available
              console.warn('[FollowingScreen] Untrack all partial failure:', err.message);
            }
          },
        },
      ]
    );
  }, [sources, startUndoTimer]);

  const handleUndo = useCallback(async () => {
    if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoCountdown(0);

    const toRestore = removedSourcesRef.current;
    removedSourcesRef.current = [];

    if (toRestore.length === 0) return;

    try {
      // Re-add all channels; use optimistic update first
      setSources(toRestore);
      await Promise.all(
        toRestore.map((s) =>
          sourcesApi.add({
            platform: s.platform ?? 'youtube',
            sourceId: s.sourceId,
            sourceName: s.sourceName,
          })
        )
      );
    } catch (err: any) {
      Alert.alert('Undo Failed', 'Some channels could not be re-added. Please refresh.');
      console.warn('[FollowingScreen] Undo re-add failed:', err.message);
    }
  }, []);

  // ── Render helpers ─────────────────────────────────────────────────────────

  const keyExtractor = useCallback((item: TrackedSource) => item.id, []);

  // Fixed card height (74) + marginBottom (10) = 84px for O(1) FlatList virtualization
  const getItemLayout = useCallback(
    (_data: ArrayLike<TrackedSource> | null | undefined, index: number) => ({
      length: 84,
      offset: 84 * index,
      index,
    }),
    []
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TrackedSource>) => (
      <ChannelRow item={item} styles={styles} onToggle={handleToggleTracking} />
    ),
    [styles, handleToggleTracking]
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
              {showAddForm ? 'Close' : '+ Add'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          Manage subscribed channels for automatic AI summarization
        </Text>
      </View>

      {/* Undo Banner */}
      {undoCountdown > 0 && (
        <UndoBanner
          count={removedSourcesRef.current.length}
          countdown={undoCountdown}
          onUndo={handleUndo}
          styles={styles}
        />
      )}

      {/* Collapsible Manual Add Channel Box */}
      {showAddForm && (
        <View style={styles.addBox}>
          <Text style={styles.addBoxTitle}>Track a Specific Channel</Text>
          <TextInput
            style={styles.input}
            placeholder="Channel Name (e.g. Veritasium)"
            placeholderTextColor={colors.textMuted}
            value={newChannelName}
            onChangeText={setNewChannelName}
          />
          <TextInput
            style={styles.input}
            placeholder="YouTube Channel ID (e.g. UCHnyfMqiRRG1u-2MsSQLbXA)"
            placeholderTextColor={colors.textMuted}
            value={newChannelId}
            onChangeText={setNewChannelId}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddManualChannel}
            disabled={adding}>
            {adding ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.addButtonText}>+ Track Channel</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Search + Filters */}
      {sources.length > 0 && (
        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tracked channels by name or ID..."
          />

          {/* Sort filter pills */}
          <FilterPills<SortFilter>
            options={SORT_OPTIONS}
            selectedValue={sortFilter}
            onSelect={setSortFilter}
            style={styles.filterPillsRow}
          />

          {/* Bulk action row */}
          <View style={styles.bulkActionRow}>
            {searchQuery.trim().length > 0 && (
              <Text style={styles.searchMetaText}>
                {filteredSources.length} of {sources.length} channels
              </Text>
            )}
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={styles.untrackAllButton}
              onPress={handleUntrackAll}
              activeOpacity={0.75}>
              <Text style={styles.untrackAllButtonText}>⚠ Untrack All</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading channels...</Text>
        </View>
      ) : sources.length === 0 && undoCountdown === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 44, marginBottom: 12 }}>⭐️</Text>
          <Text style={styles.emptyTitle}>No Channels Tracked</Text>
          <Text style={styles.emptySubtitle}>
            Connect your YouTube account or tap "+ Add" above to start summarizing uploads.
          </Text>
        </View>
      ) : filteredSources.length === 0 && sources.length > 0 ? (
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 38, marginBottom: 10 }}>🔎</Text>
          <Text style={styles.emptyTitle}>No Matching Channels</Text>
          <Text style={styles.emptySubtitle}>
            No tracked channels matched "{searchQuery}".
          </Text>
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearchButtonText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredSources}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
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
