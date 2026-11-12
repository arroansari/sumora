import React, {
  useState,
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

// ─── Types ───────────────────────────────────────────────────────────────────

type SortFilter = 'newest' | 'oldest' | 'a_z' | 'z_a';

const SORT_OPTIONS: FilterPillOption<SortFilter>[] = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'A → Z', value: 'a_z' },
  { label: 'Z → A', value: 'z_a' },
];

/** AsyncStorage key to track whether the YouTube thumbnail sync has already run. */
const SYNC_DONE_KEY = 'sumora:yt_thumb_sync_done';

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

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const FollowingScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createFollowingStyles(colors), [colors]);

  const [sources, setSources] = useState<TrackedSource[]>([]);
  const [isYouTubeConnected, setIsYouTubeConnected] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [sortFilter, setSortFilter] = useState<SortFilter>('newest');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newChannelId, setNewChannelId] = useState<string>('');
  const [newChannelName, setNewChannelName] = useState<string>('');
  const [adding, setAdding] = useState<boolean>(false);

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

          // Backfill channel thumbnails only ONCE (first time channels have no thumbnails).
          // We persist a flag so this never runs again on subsequent tab visits.
          if (data.length > 0 && !data.some((s) => Boolean(s.thumbnailUrl))) {
            const alreadySynced = await AsyncStorage.getItem(SYNC_DONE_KEY);
            if (!alreadySynced) {
              try {
                const synced = await integrationsApi.syncYouTube();
                if (isMounted && synced.sources) {
                  setSources(synced.sources);
                }
                // Mark as done so we never call this endpoint again automatically
                await AsyncStorage.setItem(SYNC_DONE_KEY, 'true');
              } catch {
                // Ignore if YouTube account isn't connected or rate-limited
              }
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
    }, [])
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

      {/* Search + Sort Filters */}
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

          {/* Search result count */}
          {searchQuery.trim().length > 0 && (
            <View style={styles.searchMetaRow}>
              <Text style={styles.searchMetaText}>
                {filteredSources.length} of {sources.length} channels
              </Text>
            </View>
          )}
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading channels...</Text>
        </View>
      ) : sources.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 44, marginBottom: 12 }}>
            {isYouTubeConnected ? '📺' : '⭐️'}
          </Text>
          <Text style={styles.emptyTitle}>
            {isYouTubeConnected ? 'No Channels Synced Yet' : 'No Channels Tracked'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {isYouTubeConnected
              ? 'Your YouTube account is connected! Tap below to sync your subscribed channels.'
              : 'Connect your YouTube account or tap "+ Add" above to start summarizing uploads.'}
          </Text>
          {isYouTubeConnected && (
            <TouchableOpacity
              style={styles.syncEmptyButton}
              onPress={handleSyncYouTube}
              disabled={syncing}
              activeOpacity={0.8}>
              {syncing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.syncEmptyButtonText}>↻ Sync YouTube Subscriptions</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      ) : filteredSources.length === 0 ? (
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
