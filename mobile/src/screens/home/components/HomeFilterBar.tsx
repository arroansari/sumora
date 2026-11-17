import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useAppTheme } from '../../../context/ThemeContext';
import { createHomeStyles } from '../HomeScreen.styles';
import { SpaceType } from '../../../types/models.types';

export type FeedTab = 'all' | 'saved' | 'custom' | 'favorites' | 'completed';

export interface HomeFilterBarProps {
  platform?: 'YOUTUBE' | 'REDDIT';
  space?: SpaceType;
  activeTab: FeedTab;
  onSelectTab: (tab: FeedTab) => void;
  savedCount: number;
  customCount: number;
  completedCount: number;
  styles: ReturnType<typeof createHomeStyles>;
  // Reddit-specific subreddits
  subreddits?: string[];
  activeSubreddit?: string;
  onSelectSubreddit?: (sub: string) => void;
  // Cinema & Book custom filters
  activeFilter?: string;
  onSelectFilter?: (filter: string) => void;
}

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
    subreddits = ['technology', 'stocks', 'artificial'],
    activeSubreddit = 'all',
    onSelectSubreddit,
    activeFilter,
    onSelectFilter,
  }) => {
    const { accentTheme } = useAppTheme();
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
              source={accentTheme.assets.button}
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
