import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useAppTheme } from '../../../context/ThemeContext';
import { createHomeStyles } from '../HomeScreen.styles';
import { SpaceType } from '../../../types/models.types';

export type FeedTab = 'all' | 'saved' | 'custom' | 'favorites' | 'completed';

export interface SelectedChannelSummary {
  channelId: string;
  channelName: string;
  videoCount: number;
}

export interface HomeFilterBarProps {
  platform?: 'YOUTUBE' | 'REDDIT';
  space?: SpaceType;
  activeTab: FeedTab;
  onSelectTab: (tab: FeedTab) => void;
  savedCount: number;
  customCount: number;
  completedCount: number;
  styles: ReturnType<typeof createHomeStyles>;
  // YouTube channel filter
  selectedChannel?: SelectedChannelSummary | null;
  onOpenChannelFilter?: () => void;
  onClearChannelFilter?: () => void;
  // Reddit-specific subreddits
  subreddits?: string[];
  activeSubreddit?: string;
  onSelectSubreddit?: (sub: string) => void;
  // Cinema & Book custom filters
  activeFilter?: string;
  onSelectFilter?: (filter: string) => void;
}

const FilterFunnelIcon: React.FC<{ color: string }> = ({ color }) => (
  <View style={localStyles.funnelIcon}>
    <View style={[localStyles.funnelBarTop, { backgroundColor: color }]} />
    <View style={[localStyles.funnelBarMid, { backgroundColor: color }]} />
    <View style={[localStyles.funnelBarBot, { backgroundColor: color }]} />
  </View>
);

const CINEMA_FILTERS = ['Trending Today', 'Netflix', 'Max', 'Prime Video', 'Top Rated', 'Saved'];
const BOOK_FILTERS = ['All Books', 'Psychology', 'Productivity', 'Wealth', 'Philosophy', 'Saved'];

export const HomeFilterBar: React.FC<HomeFilterBarProps> = React.memo(
  ({
    platform = 'YOUTUBE',
    space = 'YOUTUBE',
    activeTab,
    onSelectTab,
    savedCount,
    customCount,
    completedCount,
    styles,
    selectedChannel = null,
    onOpenChannelFilter,
    onClearChannelFilter,
    subreddits = ['technology', 'stocks', 'artificial'],
    activeSubreddit = 'all',
    onSelectSubreddit,
    activeFilter,
    onSelectFilter,
  }) => {
    const { colors, accentTheme } = useAppTheme();
    const currentSpace = space || (platform === 'REDDIT' ? 'REDDIT' : 'YOUTUBE');

    const renderTabItem = (
      key: string,
      label: string,
      isActive: boolean,
      onPress: () => void,
      count?: number
    ) => (
      <TouchableOpacity
        key={key}
        style={[
          styles.filterTab,
          isActive && styles.filterTabActive,
          isActive && { backgroundColor: accentTheme.primary },
        ]}
        onPress={onPress}
        activeOpacity={0.75}>
        {isActive && (
          <View
            style={[StyleSheet.absoluteFill, styles.filterTabGradientClip]}
            pointerEvents="none">
            <Image
              source={accentTheme.assets.button ?? undefined}
              style={styles.fullSizeImage}
              resizeMode="cover"
            />
          </View>
        )}
        <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
          {label}
        </Text>
        {typeof count === 'number' && count > 0 && (
          <View
            style={[
              styles.filterTabCount,
              isActive && styles.filterTabCountActive,
            ]}>
            <Text
              style={[
                styles.filterTabCountText,
                isActive && styles.filterTabCountTextActive,
              ]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );

    // ── Cinema & OTT Filters ──
    if (currentSpace === 'TMDB') {
      const selected = activeFilter || 'Trending Today';
      return (
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}>
            {CINEMA_FILTERS.map((f) =>
              renderTabItem(
                f,
                f,
                selected === f,
                () => onSelectFilter?.(f),
                f === 'Saved' ? savedCount : undefined
              )
            )}
          </ScrollView>
        </View>
      );
    }

    // ── Book Insights Filters ──
    if (currentSpace === 'OPEN_LIBRARY') {
      const selected = activeFilter || 'All Books';
      return (
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}>
            {BOOK_FILTERS.map((f) =>
              renderTabItem(
                f,
                f,
                selected === f,
                () => onSelectFilter?.(f),
                f === 'Saved' ? savedCount : undefined
              )
            )}
          </ScrollView>
        </View>
      );
    }

    // ── Reddit Discussions Filters ──
    if (currentSpace === 'REDDIT') {
      return (
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}>
            {/* All Subreddits */}
            {renderTabItem(
              'all',
              'All Subreddits',
              activeTab !== 'saved' && activeSubreddit === 'all',
              () => {
                onSelectTab('all');
                onSelectSubreddit?.('all');
              }
            )}

            {/* Individual Subreddits e.g. r/technology, r/stocks */}
            {subreddits.map((sub) => {
              const cleanSub = sub.replace(/^r\//i, '');
              const isSubActive =
                activeTab !== 'saved' &&
                activeSubreddit.toLowerCase() === cleanSub.toLowerCase();
              return renderTabItem(
                cleanSub,
                `r/${cleanSub}`,
                isSubActive,
                () => {
                  onSelectTab('all');
                  onSelectSubreddit?.(cleanSub);
                }
              );
            })}

            {/* Saved Reddit Debates */}
            {renderTabItem(
              'saved',
              'Saved',
              activeTab === 'saved',
              () => onSelectTab('saved'),
              savedCount
            )}
          </ScrollView>
        </View>
      );
    }

    // ── Default YouTube Filter Bar ──
    return (
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}>
          {onOpenChannelFilter && (
            <TouchableOpacity
              key="channel-filter"
              style={[
                styles.filterTab,
                localStyles.filterBtn,
                Boolean(selectedChannel) && styles.filterTabActive,
                Boolean(selectedChannel) && { backgroundColor: accentTheme.primary },
              ]}
              onPress={onOpenChannelFilter}
              activeOpacity={0.75}
              accessibilityLabel={
                selectedChannel
                  ? `Filtering by ${selectedChannel.channelName}`
                  : 'Filter feed by channel'
              }>
              {Boolean(selectedChannel) && (
                <View
                  style={[StyleSheet.absoluteFill, styles.filterTabGradientClip]}
                  pointerEvents="none">
                  <Image
                    source={accentTheme.assets.button ?? undefined}
                    style={styles.fullSizeImage}
                    resizeMode="cover"
                  />
                </View>
              )}
              <FilterFunnelIcon
                color={selectedChannel ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterTabText,
                  Boolean(selectedChannel) && styles.filterTabTextActive,
                  localStyles.filterBtnLabel,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {selectedChannel ? selectedChannel.channelName : 'Filter'}
              </Text>
              {selectedChannel && onClearChannelFilter && (
                <TouchableOpacity
                  onPress={onClearChannelFilter}
                  style={localStyles.clearChipBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
                  accessibilityLabel="Clear channel filter">
                  <Text style={localStyles.clearChipText}>✕</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}

          {renderTabItem(
            'all',
            'All Activity',
            activeTab === 'all',
            () => onSelectTab('all')
          )}

          {renderTabItem(
            'saved',
            'Saved',
            activeTab === 'saved',
            () => onSelectTab('saved'),
            savedCount
          )}

          {renderTabItem(
            'custom',
            'Custom Links',
            activeTab === 'custom',
            () => onSelectTab('custom'),
            customCount
          )}

          {renderTabItem(
            'favorites',
            'Priority',
            activeTab === 'favorites',
            () => onSelectTab('favorites')
          )}

          {completedCount > 0 &&
            renderTabItem(
              'completed',
              'Completed',
              activeTab === 'completed',
              () => onSelectTab('completed'),
              completedCount
            )}
        </ScrollView>
      </View>
    );
  }
);

const localStyles = StyleSheet.create({
  filterBtn: {
    gap: 6,
    paddingHorizontal: 14,
  },
  filterBtnLabel: {
    maxWidth: 120,
  },
  funnelIcon: {
    width: 14,
    height: 11,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2.5,
    zIndex: 1,
  },
  funnelBarTop: {
    width: 14,
    height: 1.8,
    borderRadius: 1,
  },
  funnelBarMid: {
    width: 9,
    height: 1.8,
    borderRadius: 1,
  },
  funnelBarBot: {
    width: 5,
    height: 1.8,
    borderRadius: 1,
  },
  clearChipBtn: {
    marginLeft: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  clearChipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
