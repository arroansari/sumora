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
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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
  PriorityChannelsBar,
  CategoryPillsBar,
  FilterModal,
  AddSubredditModal,
  SubredditListView,
  FollowingHeader,
  ManualChannelAddForm,
} from './components';

export * from './types';

const FAVORITES_STORAGE_KEY = 'sumora:favorite_channel_ids';
const SYNC_DONE_KEY = 'sumora:yt_thumb_sync_done';
const PAGE_SIZE = 24;

export const FollowingScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createFollowingStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [sources, setSources] = useState<TrackedSource[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [, setIsYouTubeConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [sortFilter, setSortFilter] = useState<SortFilter>('newest');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newChannelId, setNewChannelId] = useState<string>('');
  const [newChannelName, setNewChannelName] = useState<string>('');
  const [adding, setAdding] = useState<boolean>(false);

  // Platform Section
  const { activePlatform } = usePlatform();
  const platformSection = activePlatform === 'REDDIT' ? 'subreddits' : 'channels';
  const [subreddits, setSubreddits] = useState<TrackedSource[]>([]);
  const [newSubredditInput, setNewSubredditInput] = useState<string>('');
  const [addingSubreddit, setAddingSubreddit] = useState<boolean>(false);
  const [showAddSubredditModal, setShowAddSubredditModal] = useState<boolean>(false);

  // Virtual pagination
  const [displayLimit, setDisplayLimit] = useState<number>(PAGE_SIZE);

  useEffect(() => {
    setDisplayLimit(PAGE_SIZE);
  }, [deferredSearchQuery, selectedCategory, sortFilter]);

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
          const [data, accounts, subs] = await Promise.all([
            sourcesApi.list(),
            integrationsApi.list().catch(() => []),
            redditApi.listSources().catch(() => []),
          ]);
          if (isMounted) {
            setSources(data);
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

  const handleToggleFavorite = useCallback(
    async (source: TrackedSource) => {
      const isFav = favoriteIds.includes(source.sourceId);
      let updated: string[];

      if (isFav) {
        updated = favoriteIds.filter((id) => id !== source.sourceId);
      } else {
        updated = [...favoriteIds, source.sourceId];
        integrationsApi.backfillChannel(source.sourceId).catch((err) => {
          console.warn('[FollowingScreen] Favorite backfill note:', err.message);
        });
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
      setSources(data);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleToggleTracking = useCallback(
    (source: TrackedSource) => {
      Alert.alert(
        'Stop Tracking Channel?',
        `Pause automatic summarization for "${source.sourceName}"? You can re-enable anytime.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Stop Tracking',
            style: 'destructive',
            onPress: async () => {
              try {
                await sourcesApi.remove(source.sourceId);
                setSources((prev) => prev.filter((s) => s.sourceId !== source.sourceId));
                if (favoriteIds.includes(source.sourceId)) {
                  handleToggleFavorite(source);
                }
              } catch (err: any) {
                Alert.alert('Error', err.message || 'Could not update channel.');
              }
            },
          },
        ]
      );
    },
    [favoriteIds, handleToggleFavorite]
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

  const channelSources = useMemo(
    () => sources.filter((s) => s.platform !== 'reddit'),
    [sources]
  );

  const prioritySources = useMemo(
    () => channelSources.filter((s) => favoriteIds.includes(s.sourceId)),
    [channelSources, favoriteIds]
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
    if (selectedCategory === 'favorites') {
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
    setDisplayLimit((prev) => {
      if (prev >= filteredSources.length) return prev;
      return Math.min(prev + PAGE_SIZE, filteredSources.length);
    });
  }, [filteredSources.length]);

  const ListFooter = useMemo(() => {
    if (filteredSources.length === 0) return undefined;
    if (visibleSources.length >= filteredSources.length) {
      return (
        <View style={styles.gridFooterEnd}>
          <Text style={styles.gridFooterEndText}>
            Showing all {filteredSources.length} {filteredSources.length === 1 ? 'channel' : 'channels'}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.gridFooterLoading}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.gridFooterLoadingText}>
          Loading more… ({visibleSources.length} of {filteredSources.length})
        </Text>
      </View>
    );
  }, [visibleSources.length, filteredSources.length, colors.primary, styles]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: channelSources.length };
    for (const cat of CATEGORIES) {
      counts[cat.id] = 0;
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
    ({ item }: { item: TrackedSource }) => (
      <ChannelGridCard
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

  const ListHeader = useMemo(
    () => (
      <View>
        <PriorityChannelsBar
          prioritySources={prioritySources}
          styles={styles}
          selectedCategory={selectedCategory}
          onToggleCategoryFilter={() =>
            setSelectedCategory((prev) => (prev === 'favorites' ? 'all' : 'favorites'))
          }
          onChannelPress={handleChannelPress}
        />

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

        <CategoryPillsBar
          styles={styles}
          selectedCategory={selectedCategory}
          totalChannelsCount={channelSources.length}
          categoryCounts={categoryCounts}
          onSelectCategory={setSelectedCategory}
        />

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
      </View>
    ),
    [
      styles,
      searchQuery,
      sortFilter,
      selectedCategory,
      channelSources.length,
      categoryCounts,
      prioritySources,
      filteredSources.length,
      handleChannelPress,
    ]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <FollowingHeader
        styles={styles}
        platformSection={platformSection}
        count={platformSection === 'channels' ? channelSources.length : subreddits.length}
        isAddActive={platformSection === 'channels' ? showAddForm : showAddSubredditModal}
        onToggleAdd={() => {
          if (platformSection === 'channels') {
            setShowAddForm((prev) => !prev);
          } else {
            setShowAddSubredditModal(true);
          }
        }}
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

      {platformSection === 'subreddits' ? (
        <SubredditListView
          subreddits={subreddits}
          styles={styles}
          onToggleSubreddit={handleToggleSubreddit}
          onRemoveSubreddit={handleRemoveSubreddit}
          onOpenAddModal={() => setShowAddSubredditModal(true)}
        />
      ) : loading ? (
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
        <FlatList
          data={visibleSources}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.gridColumnWrapper}
          contentContainerStyle={styles.gridListContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
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
    </SafeAreaView>
  );
};
