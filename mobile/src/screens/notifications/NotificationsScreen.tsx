import React, { useState, useEffect, useMemo, useCallback, useDeferredValue } from 'react';
import {
  View,
  Text,
  FlatList,
  Switch,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ListRenderItemInfo,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { preferencesApi, sourcesApi } from '../../services/api';
import { NotificationPreference, TrackedSource } from '../../types/models.types';
import { SearchBar } from '../../components/atoms/SearchBar';
import { FilterPills, FilterPillOption } from '../../components/atoms/FilterPills';
import { createNotificationsStyles } from './NotificationsScreen.styles';

// ─── Types ───────────────────────────────────────────────────────────────────

type MuteFilter = 'all' | 'active' | 'muted';
type SortFilter = 'newest' | 'a_z';

const MUTE_FILTER_OPTIONS: FilterPillOption<MuteFilter>[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Muted', value: 'muted' },
];

const SORT_OPTIONS: FilterPillOption<SortFilter>[] = [
  { label: 'Newest First', value: 'newest' },
  { label: 'A → Z', value: 'a_z' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

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
                  {isNotifying ? 'Alerts active' : 'Muted'}
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

  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [sources, setSources] = useState<TrackedSource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mutedChannels, setMutedChannels] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [muteFilter, setMuteFilter] = useState<MuteFilter>('all');
  const [sortFilter, setSortFilter] = useState<SortFilter>('newest');

  useEffect(() => {
    let isMounted = true;

    async function loadNotificationData() {
      try {
        const [prefs, channels] = await Promise.all([
          preferencesApi.get().catch(() => []),
          sourcesApi.list().catch(() => []),
        ]);
        if (isMounted) {
          setPreferences(prefs);
          setSources(channels);
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
  }, []);

  const isYouTubeEnabled =
    preferences.find((p) => p.platform === 'youtube')?.enabled ?? true;

  const filteredSources = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    // 1. Search filter
    let result = query
      ? sources.filter((c) => c.sourceName.toLowerCase().includes(query))
      : sources;

    // 2. Mute filter
    if (muteFilter === 'active') {
      result = result.filter((c) => !mutedChannels[c.sourceId]);
    } else if (muteFilter === 'muted') {
      result = result.filter((c) => Boolean(mutedChannels[c.sourceId]));
    }

    // 3. Sort
    const copy = [...result];
    if (sortFilter === 'a_z') {
      copy.sort((a, b) =>
        a.sourceName.localeCompare(b.sourceName, undefined, { sensitivity: 'base' })
      );
    } else {
      // 'newest' — sort by createdAt DESC (default API order preserved)
      copy.sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
    }

    return copy;
  }, [sources, deferredSearchQuery, muteFilter, sortFilter, mutedChannels]);

  const handleToggleGlobalYouTube = useCallback(async (value: boolean) => {
    try {
      setPreferences((prev) =>
        prev.map((p) => (p.platform === 'youtube' ? { ...p, enabled: value } : p))
      );
      await preferencesApi.update({ platform: 'youtube', enabled: value });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update preference.');
    }
  }, []);

  const handleToggleChannelMute = useCallback((channelId: string) => {
    setMutedChannels((prev) => ({
      ...prev,
      [channelId]: !prev[channelId],
    }));
  }, []);

  // ── Mute All / Unmute All ──────────────────────────────────────────────────

  const handleMuteAll = useCallback(() => {
    if (sources.length === 0) return;
    const updated: Record<string, boolean> = {};
    sources.forEach((s) => {
      updated[s.sourceId] = true;
    });
    setMutedChannels(updated);
  }, [sources]);

  const handleUnmuteAll = useCallback(() => {
    setMutedChannels({});
  }, []);

  const mutedCount = useMemo(
    () => sources.filter((s) => Boolean(mutedChannels[s.sourceId])).length,
    [sources, mutedChannels]
  );

  const allMuted = mutedCount === sources.length && sources.length > 0;
  const anyMuted = mutedCount > 0;

  // ── Render helpers ─────────────────────────────────────────────────────────

  const keyExtractor = useCallback((item: TrackedSource) => item.id, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TrackedSource>) => (
      <ChannelNotificationRow
        channel={item}
        isYouTubeEnabled={isYouTubeEnabled}
        isMuted={Boolean(mutedChannels[item.sourceId])}
        styles={styles}
        colors={colors}
        onToggleMute={handleToggleChannelMute}
      />
    ),
    [isYouTubeEnabled, mutedChannels, styles, colors, handleToggleChannelMute]
  );

  const listHeader = useMemo(
    () => (
      <View>
        {/* Global Platform Toggles */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Platform Push Notifications</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.toggleLabel}>YouTube Summaries</Text>
              <Text style={styles.toggleDesc}>
                Receive a push notification when newly published YouTube videos are summarized.
              </Text>
            </View>
            <Switch
              value={isYouTubeEnabled}
              onValueChange={handleToggleGlobalYouTube}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Channel-Specific Section Header */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Channel-Specific Notifications</Text>
          {sources.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{sources.length}</Text>
            </View>
          )}
        </View>

        {sources.length > 0 && (
          <>
            {/* Search bar */}
            <View style={styles.searchContainer}>
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search channels to mute or unmute..."
              />
            </View>

            {/* Mute/active filter pills */}
            <FilterPills<MuteFilter>
              options={MUTE_FILTER_OPTIONS}
              selectedValue={muteFilter}
              onSelect={setMuteFilter}
              style={styles.filterPillsRow}
            />

            {/* Sort pills */}
            <FilterPills<SortFilter>
              options={SORT_OPTIONS}
              selectedValue={sortFilter}
              onSelect={setSortFilter}
              style={styles.filterPillsRowSecond}
            />

            {/* Bulk action row */}
            <View style={styles.bulkActionRow}>
              {searchQuery.trim().length > 0 && (
                <Text style={styles.searchMetaText}>
                  {filteredSources.length} of {sources.length} channels
                </Text>
              )}
              {mutedCount > 0 && searchQuery.trim().length === 0 && (
                <Text style={styles.searchMetaText}>
                  {mutedCount} muted
                </Text>
              )}
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
      isYouTubeEnabled,
      handleToggleGlobalYouTube,
      colors.border,
      colors.primary,
      sources.length,
      searchQuery,
      filteredSources.length,
      muteFilter,
      sortFilter,
      mutedCount,
      anyMuted,
      handleMuteAll,
      handleUnmuteAll,
    ]
  );

  const listEmpty = useMemo(() => {
    if (sources.length === 0) {
      return (
        <View style={styles.card}>
          <Text style={{ color: colors.textMuted, textAlign: 'center', padding: 8 }}>
            No tracked channels yet. Connect YouTube or add channels to configure notifications.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptySearchBox}>
        <Text style={{ fontSize: 30 }}>🔎</Text>
        <Text style={styles.emptySearchTitle}>No Matching Channels</Text>
        <Text style={styles.emptySearchSubtitle}>
          {muteFilter !== 'all'
            ? `No ${muteFilter === 'active' ? 'active' : 'muted'} channels match your search.`
            : `No channels matched "${searchQuery}".`}
        </Text>
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={() => {
            setSearchQuery('');
            setMuteFilter('all');
          }}>
          <Text style={styles.clearSearchButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      </View>
    );
  }, [sources.length, styles, colors.textMuted, searchQuery, muteFilter]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <Text style={styles.headerSubtitle}>
          Control push notification alerts for AI video summaries
        </Text>
      </View>

      <FlatList
        data={filteredSources}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  );
};
