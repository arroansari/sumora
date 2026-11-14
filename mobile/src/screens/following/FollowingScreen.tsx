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
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
  Image,
  StyleSheet,
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
  | 'games'
  | 'food'
  | 'faith'
  | 'education'
  | 'lifestyle'
  | 'entertainment'
  | 'other';

interface CategoryConfig {
  id: CategoryId;
  label: string;
  icon: string;
  matcher: RegExp;
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'favorites',
    label: 'Favorites (Priority)',
    icon: '⭐',
    matcher: /(?:)/,
  },
  {
    id: 'faith',
    label: 'Faith & Spirituality',
    icon: '🕌',
    matcher:
      /\b(quran|islam|islamic|hadees|hadith|sunnat|zakir naik|muhammad ali mirza|prophet|ahle|azhari|masjid|deen|bayan|molana|maulana|shia|sunni|sufi|jashn|rekhta|surah|dua|allah|namaz|dargah|alra tv|mehrban ali|hanfi|madani|naat|islamic hub|sabeel|mufti|peer|peerzada|qadri|ilyas qadri|tariq jameel|saqib raza|attari)\b/i,
  },
  {
    id: 'tech',
    label: 'Tech & Dev',
    icon: '💻',
    matcher:
      /\b(flutter|python|javascript|typescript|react|angular|vue|golang|rust|cpp|coding|codebasics|programmer|programming|software|developer|devops|cloud|aws|docker|kubernetes|linux|terminal|backend|frontend|cyber|beebom|techie|technical sagar|google cloud|gyrus sulcus|dcod style|hacker|hacking|web dev|web development|app dev|computer science)\b/i,
  },
  {
    id: 'design',
    label: 'Design & 3D Creative',
    icon: '🎨',
    matcher:
      /\b(blender|photoshop|figma|animschool|phlearn|polygon runway|schaeferart|cg cookie|cg opinions|3d|vfx|cgi|drawing|illustration|illustrator|after effects|premiere pro|graphic design|typography|render|corridor crew|kk create|nafay 3d|black beard projects|diy|woodworking|craft|crafts|animation)\b/i,
  },
  {
    id: 'games',
    label: 'Gaming & Chess',
    icon: '🎮',
    matcher:
      /\b(chess|chessnetwork|thechesswebsite|game|games|gaming|gameplay|esports|gamer|minecraft|gta|pubg|freefire|walkthrough|games4two|strike & pocket)\b/i,
  },
  {
    id: 'food',
    label: 'Food & Cooking',
    icon: '🍔',
    matcher:
      /\b(recipe|recipes|cooking|kitchen|chef|street food|culinary|food pharmer|village food|food secrets|foodie|swad|zaika|baking|meal prep|rasoi|khana|tasty|taste|delicious)\b/i,
  },
  {
    id: 'news',
    label: 'News & Politics',
    icon: '📰',
    matcher:
      /\b(news|aaj tak|ndtv|bbc|cnn|hindustan times|the wire|the deshbhakt|inqalaab|theredmike|samachar|khabar|press|bulletin|times of india|lallantop|abp|republic|firstpost|middle east eye|knockingnews|politics|political|media|lok sabha|rajya sabha|parliament)\b/i,
  },
  {
    id: 'business',
    label: 'Business & Finance',
    icon: '💼',
    matcher:
      /\b(business|finance|crypto|bitcoin|stock|stocks|invest|investing|investor|startup|wealth|economy|economic|money|alex hormozi|garyvee|simon sinek|rahul malodia|entrepreneur|ecommerce|trading|market|sales|real estate|financial|venture|capital|sahil khanna)\b/i,
  },
  {
    id: 'education',
    label: 'Education & Learning',
    icon: '📚',
    matcher:
      /\b(study|study iq|studyiq|ias|upsc|ted-ed|tedx|crashcourse|academy|class101|arabicpod|learn english|english with|physics|chemistry|mathematics|history|science|scientist|facts|roshan facts|getsetflyscience|english addict|impressive english|lisan ul quran|thinktrek|tsmadaan|duncan|education|course|tutorial|lecture|professor|qasim ali shah|ali abdaal|learn|learning|ielts|toefl|knowledge|exam|how to|law advice|advocate|dr ram puniyani|dr sultan sikandar)\b/i,
  },
  {
    id: 'lifestyle',
    label: 'Health & Lifestyle',
    icon: '🏃',
    matcher:
      /\b(thenx|workout|fitness|gym|calisthenics|yoga|diet|health|fashion|teachingmensfashion|mensfashion|style|bikedekho|motovlog|vlog|vlogs|shridesh vlogs|travel|lifestyle|grooming|biker|automobile|car dekho|cars)\b/i,
  },
  {
    id: 'entertainment',
    label: 'Entertainment & Media',
    icon: '🎬',
    matcher:
      /\b(drama|turkish drama|movie|movies|cinema|films|film|bollywood|hollywood|music|songs|song|t-series|speed records|goldmines|comedy|timeliners|roast|funny|hilarious|sab tv|sony sab|colors gujarati|ultra bollywood|sonic enterprise|neeraj beniwal|cut|entertainment|series|clip|talent|drm drama|tlc uk|the social house)\b/i,
  },
  {
    id: 'other',
    label: 'Other Channels',
    icon: '📺',
    matcher: /(?:)/,
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
  for (const cat of CATEGORIES) {
    if (cat.id === 'favorites' || cat.id === 'other') continue;
    if (cat.matcher.test(sourceName)) {
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

// ─── ChannelGridCard Component (Option 3: 2-Column Visual Grid) ───────────────

interface ChannelGridCardProps {
  item: TrackedSource;
  isFavorite: boolean;
  styles: ReturnType<typeof createFollowingStyles>;
  onToggle: (source: TrackedSource) => void;
  onToggleFavorite: (source: TrackedSource) => void;
  onPress: (source: TrackedSource) => void;
}

const ChannelGridCard = React.memo<ChannelGridCardProps>(
  ({ item, isFavorite, styles, onToggle, onToggleFavorite, onPress }) => {
    const category = useMemo(() => {
      for (const cat of CATEGORIES) {
        if (cat.id === 'favorites' || cat.id === 'other') continue;
        if (cat.matcher.test(item.sourceName)) {
          return cat;
        }
      }
      return null;
    }, [item.sourceName]);

    return (
      <TouchableOpacity
        style={styles.channelGridCard}
        onPress={() => onPress(item)}
        activeOpacity={0.8}>
        {/* Top bar: Category badge on left, Star priority button on right */}
        <View style={styles.gridCardTopRow}>
          {category ? (
            <View style={styles.gridCategoryBadge}>
              <Text style={styles.gridCategoryText} numberOfLines={1}>
                {category.icon} {category.label.split(' ')[0]}
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <TouchableOpacity
            style={[styles.gridStarBtn, isFavorite && styles.gridStarBtnActive]}
            onPress={() => onToggleFavorite(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}>
            <Text style={styles.gridStarIcon}>{isFavorite ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
        </View>

        {/* Center: Circular Avatar */}
        <View style={styles.gridAvatarContainer}>
          {item.thumbnailUrl ? (
            <FastImage
              source={{
                uri: item.thumbnailUrl,
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.immutable,
              }}
              style={styles.gridAvatarImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <View style={styles.gridAvatarPlaceholder}>
              <Text style={styles.gridAvatarText}>{getInitials(item.sourceName)}</Text>
            </View>
          )}
        </View>

        {/* Channel Name */}
        <Text style={styles.gridChannelTitle} numberOfLines={1}>
          {item.sourceName}
        </Text>

        {/* Subtle tap hint */}
        <Text style={styles.gridSubMeta} numberOfLines={1}>
          Tap to view ›
        </Text>

        {/* Bottom: Tracking Pill Button */}
        <TouchableOpacity
          style={styles.gridTrackingBtn}
          onPress={() => onToggle(item)}
          activeOpacity={0.75}>
          <Text style={styles.gridTrackingText}>Tracking ✓</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }
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

  const prioritySources = useMemo(() => {
    return sources.filter((s) => favoriteIds.includes(s.sourceId));
  }, [sources, favoriteIds]);

  // ── 2-Column Grid Filtering & Sorting (Option 3) ──────────────────────────

  const filteredSources = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    // 1. Filter by search query if any
    let list = query
      ? sources.filter(
          (s) =>
            s.sourceName.toLowerCase().includes(query) ||
            s.sourceId.toLowerCase().includes(query)
        )
      : sources;

    // 2. Filter by category
    if (selectedCategory === 'favorites') {
      list = list.filter((s) => favoriteIds.includes(s.sourceId));
    } else if (selectedCategory !== 'all') {
      list = list.filter((s) => {
        const catId = classifyChannel(s.sourceName, false);
        return catId === selectedCategory;
      });
    }

    // 3. Sort
    return sortSources(list, sortFilter);
  }, [sources, favoriteIds, deferredSearchQuery, selectedCategory, sortFilter]);

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
        {/* ── Priority Channels Story Bar (Matching Prototype - Preserved) ── */}
        <View style={styles.prioritySection}>
          <View style={styles.priorityHeaderRow}>
            <Text style={styles.priorityHeaderTitle}>Priority Channels</Text>
            <TouchableOpacity
              onPress={() => setSelectedCategory((prev) => (prev === 'favorites' ? 'all' : 'favorites'))}
              activeOpacity={0.75}>
              <Text style={styles.prioritySeeAllText}>
                {selectedCategory === 'favorites' ? 'Show All' : 'See all'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.priorityScrollContent}>
            {prioritySources.map((item) => (
              <TouchableOpacity
                key={item.sourceId}
                style={styles.priorityItem}
                onPress={() => handleChannelPress(item)}
                activeOpacity={0.8}>
                <View style={styles.gradientRingWrapper}>
                  <Image
                    source={require('../../assets/images/header_gradient.png')}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                  <View style={styles.avatarInnerGap}>
                    {item.thumbnailUrl ? (
                      <FastImage
                        source={{
                          uri: item.thumbnailUrl,
                          priority: FastImage.priority.high,
                          cache: FastImage.cacheControl.immutable,
                        }}
                        style={styles.priorityAvatar}
                        resizeMode={FastImage.resizeMode.cover}
                      />
                    ) : (
                      <View style={styles.priorityAvatarPlaceholder}>
                        <Text style={styles.priorityAvatarInitial}>
                          {item.sourceName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.priorityName} numberOfLines={1}>
                  {item.sourceName}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.priorityItem}
              onPress={() => {
                Alert.alert(
                  'Add Priority Channel',
                  'Tap the ⭐ star button on any channel in the grid below to pin it to Priority Channels!'
                );
              }}
              activeOpacity={0.8}>
              <View style={styles.priorityAddButton}>
                <Text style={styles.priorityAddText}>+</Text>
              </View>
              <Text style={styles.priorityName} numberOfLines={1}>
                Add More
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

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

        {/* Horizontal Category Filter Pills */}
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

        {/* 2-Column Grid Section Header */}
        <View style={styles.gridSectionHeaderRow}>
          <Text style={styles.gridSectionTitle}>
            {selectedCategory === 'all'
              ? `All Channels (${filteredSources.length})`
              : `${CATEGORIES.find((c) => c.id === selectedCategory)?.icon || ''} ${CATEGORIES.find((c) => c.id === selectedCategory)?.label || 'Channels'} (${filteredSources.length})`}
          </Text>
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
      sources.length,
      categoryCounts,
      prioritySources,
      filteredSources.length,
      handleChannelPress,
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
          Manage subscribed channels for automatic summarization
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

      {/* Body: 2-Column Visual Grid */}
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
        <FlatList
          data={filteredSources}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={styles.gridColumnWrapper}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.gridListContent}
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
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>🔍</Text>
              <Text style={styles.emptyTitle}>No Channels Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No tracked channels match "${searchQuery}".`
                  : 'No channels found for the selected category.'}
              </Text>
              {selectedCategory !== 'all' && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSelectedCategory('all')}>
                  <Text style={styles.clearSearchButtonText}>Show All Channels</Text>
                </TouchableOpacity>
              )}
            </View>
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
