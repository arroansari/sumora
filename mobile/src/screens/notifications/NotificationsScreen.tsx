import React, { useState, useMemo, useCallback, useDeferredValue } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { preferencesApi, sourcesApi, integrationsApi } from '../../services/api';
import { NotificationPreference, TrackedSource } from '../../types/models.types';
import { SearchBar } from '../../components/atoms/SearchBar';
import { FilterPills, FilterPillOption } from '../../components/atoms/FilterPills';
import { createNotificationsStyles } from './NotificationsScreen.styles';

// ─── Types ───────────────────────────────────────────────────────────────────

type MuteFilter = 'all' | 'active' | 'muted';
type SortFilter = 'newest' | 'oldest' | 'a_z' | 'z_a';

const MUTE_FILTER_OPTIONS: FilterPillOption<MuteFilter>[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Muted', value: 'muted' },
];

const SORT_OPTIONS: FilterPillOption<SortFilter>[] = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'A → Z', value: 'a_z' },
  { label: 'Z → A', value: 'z_a' },
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
  const [isYouTubeConnected, setIsYouTubeConnected] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [mutedChannels, setMutedChannels] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [muteFilter, setMuteFilter] = useState<MuteFilter>('all');
  const [sortFilter, setSortFilter] = useState<SortFilter>('newest');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

  const fetchNotificationData = useCallback(async () => {
    const [prefs, channels, accounts] = await Promise.all([
      preferencesApi.get().catch(() => []),
      sourcesApi.list().catch(() => []),
      integrationsApi.list().catch(() => []),
    ]);
    return {
      prefs,
      channels,
      ytConnected: accounts.some((a) => a.platform === 'youtube' && a.status === 'active'),
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function loadNotificationData() {
        try {
          const { prefs, channels, ytConnected } = await fetchNotificationData();
          if (isMounted) {
            setPreferences(prefs);
            setSources(channels);
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
      const { prefs, channels, ytConnected } = await fetchNotificationData();
      setPreferences(prefs);
      setSources(channels);
      setIsYouTubeConnected(ytConnected);
    } catch (err: any) {
      console.warn('[NotificationsScreen] Refresh failed');
    } finally {
      setRefreshing(false);
    }
  }, [fetchNotificationData]);

  const handleSyncYouTube = useCallback(async () => {
    setSyncing(true);
    try {
      const synced = await integrationsApi.syncYouTube();
      if (synced.sources) {
        setSources(synced.sources);
      } else {
        const channels = await sourcesApi.list().catch(() => []);
        setSources(channels);
      }
    } catch (err: any) {
      Alert.alert('Sync Failed', err.message || 'Could not sync YouTube subscriptions.');
    } finally {
      setSyncing(false);
    }
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
    switch (sortFilter) {
      case 'a_z':
        copy.sort((a, b) =>
          a.sourceName.localeCompare(b.sourceName, undefined, { sensitivity: 'base' })
        );
        break;
      case 'z_a':
        copy.sort((a, b) =>
          b.sourceName.localeCompare(a.sourceName, undefined, { sensitivity: 'base' })
        );
        break;
      case 'oldest':
        copy.sort(
          (a, b) =>
            new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
        );
        break;
      case 'newest':
      default:
        copy.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
        );
        break;
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
  const activeCount = sources.length - mutedCount;
  const hasActiveFilter = muteFilter !== 'all' || sortFilter !== 'newest';

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
        {/* Compact Master Global Toggle */}
        <View style={styles.masterCard}>
          <View style={styles.masterLeft}>
            <View style={styles.masterIconBadge}>
              <Text style={styles.masterIconText}>▶</Text>
            </View>
            <View style={styles.masterTextGroup}>
              <Text style={styles.masterTitle}>YouTube Summaries</Text>
              <Text style={styles.masterSubtitle} numberOfLines={1}>
                {isYouTubeEnabled
                  ? 'Push notifications enabled for new uploads'
                  : 'All notifications paused'}
              </Text>
            </View>
          </View>
          <Switch
            value={isYouTubeEnabled}
            onValueChange={handleToggleGlobalYouTube}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Channel Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Channel Notifications</Text>
          {sources.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{sources.length}</Text>
            </View>
          )}
        </View>

        {sources.length > 0 && (
          <>
            {/* Search bar + Filters modal button */}
            <View style={styles.searchRow}>
              <View style={styles.searchBarWrapper}>
                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search channels to mute or unmute..."
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
                  ? `${filteredSources.length} of ${sources.length} channels`
                  : muteFilter !== 'all'
                  ? `${filteredSources.length} ${muteFilter} channels • ${SORT_OPTIONS.find((s) => s.value === sortFilter)?.label || 'Sorted'}`
                  : `${sources.length} channels (${activeCount} active)`}
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
      isYouTubeEnabled,
      handleToggleGlobalYouTube,
      colors.border,
      colors.primary,
      sources.length,
      searchQuery,
      filteredSources.length,
      hasActiveFilter,
      muteFilter,
      sortFilter,
      activeCount,
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
            {isYouTubeConnected
              ? 'Your YouTube account is connected, but no channels are synced yet.'
              : 'No tracked channels yet. Connect YouTube or add channels to configure notifications.'}
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
  }, [sources.length, styles, colors.textMuted, searchQuery, muteFilter, isYouTubeConnected, syncing, handleSyncYouTube]);

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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />

      {/* ── Filter & Sort Modal ────────────────────────────────────────── */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⚡ Filter & Sort Alerts</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Section 1: Alert Status */}
            <Text style={styles.modalSectionTitle}>Alert Status</Text>
            <View style={styles.modalGrid}>
              <TouchableOpacity
                style={[
                  styles.modalChip,
                  muteFilter === 'all' && styles.modalChipActive,
                ]}
                onPress={() => setMuteFilter('all')}
                activeOpacity={0.75}>
                <Text
                  style={[
                    styles.modalChipText,
                    muteFilter === 'all' && styles.modalChipTextActive,
                  ]}>
                  🔔 All Channels ({sources.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalChip,
                  muteFilter === 'active' && styles.modalChipActive,
                ]}
                onPress={() => setMuteFilter('active')}
                activeOpacity={0.75}>
                <Text
                  style={[
                    styles.modalChipText,
                    muteFilter === 'active' && styles.modalChipTextActive,
                  ]}>
                  ✅ Active Alerts ({activeCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalChip,
                  muteFilter === 'muted' && styles.modalChipActive,
                ]}
                onPress={() => setMuteFilter('muted')}
                activeOpacity={0.75}>
                <Text
                  style={[
                    styles.modalChipText,
                    muteFilter === 'muted' && styles.modalChipTextActive,
                  ]}>
                  🔕 Muted Channels ({mutedCount})
                </Text>
              </TouchableOpacity>
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
                  setMuteFilter('all');
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
