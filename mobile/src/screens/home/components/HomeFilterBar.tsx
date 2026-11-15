import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
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
    const currentSpace = space || (platform === 'REDDIT' ? 'REDDIT' : 'YOUTUBE');

    // ── Cinema & OTT Filters ──
    if (currentSpace === 'TMDB') {
      const selected = activeFilter || 'Trending Today';
      return (
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}>
            {CINEMA_FILTERS.map((f) => {
              const isSelected = selected === f;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterTab, isSelected && styles.filterTabActive]}
                  onPress={() => onSelectFilter?.(f)}
                  activeOpacity={0.75}>
                  <Text style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}>
                    {f}
                  </Text>
                  {f === 'Saved' && savedCount > 0 && (
                    <View
                      style={[
                        styles.filterTabCount,
                        isSelected && styles.filterTabCountActive,
                      ]}>
                      <Text
                        style={[
                          styles.filterTabCountText,
                          isSelected && styles.filterTabCountTextActive,
                        ]}>
                        {savedCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
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
            {BOOK_FILTERS.map((f) => {
              const isSelected = selected === f;
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterTab, isSelected && styles.filterTabActive]}
                  onPress={() => onSelectFilter?.(f)}
                  activeOpacity={0.75}>
                  <Text style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}>
                    {f}
                  </Text>
                  {f === 'Saved' && savedCount > 0 && (
                    <View
                      style={[
                        styles.filterTabCount,
                        isSelected && styles.filterTabCountActive,
                      ]}>
                      <Text
                        style={[
                          styles.filterTabCountText,
                          isSelected && styles.filterTabCountTextActive,
                        ]}>
                        {savedCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
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
            <TouchableOpacity
              style={[
                styles.filterTab,
                activeTab !== 'saved' && activeSubreddit === 'all' && styles.filterTabActive,
              ]}
              onPress={() => {
                onSelectTab('all');
                onSelectSubreddit?.('all');
              }}
              activeOpacity={0.75}>
              <Text
                style={[
                  styles.filterTabText,
                  activeTab !== 'saved' && activeSubreddit === 'all' && styles.filterTabTextActive,
                ]}>
                All Subreddits
              </Text>
            </TouchableOpacity>

            {/* Individual Subreddits e.g. r/technology, r/stocks */}
            {subreddits.map((sub) => {
              const cleanSub = sub.replace(/^r\//i, '');
              const isSubActive = activeTab !== 'saved' && activeSubreddit.toLowerCase() === cleanSub.toLowerCase();
              return (
                <TouchableOpacity
                  key={cleanSub}
                  style={[styles.filterTab, isSubActive && styles.filterTabActive]}
                  onPress={() => {
                    onSelectTab('all');
                    onSelectSubreddit?.(cleanSub);
                  }}
                  activeOpacity={0.75}>
                  <Text style={[styles.filterTabText, isSubActive && styles.filterTabTextActive]}>
                    r/{cleanSub}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Saved Reddit Debates */}
            <TouchableOpacity
              style={[styles.filterTab, activeTab === 'saved' && styles.filterTabActive]}
              onPress={() => onSelectTab('saved')}
              activeOpacity={0.75}>
              <Text style={[styles.filterTabText, activeTab === 'saved' && styles.filterTabTextActive]}>
                Saved
              </Text>
              {savedCount > 0 && (
                <View
                  style={[
                    styles.filterTabCount,
                    activeTab === 'saved' && styles.filterTabCountActive,
                  ]}>
                  <Text
                    style={[
                      styles.filterTabCountText,
                      activeTab === 'saved' && styles.filterTabCountTextActive,
                    ]}>
                    {savedCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
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
          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'all' && styles.filterTabActive]}
            onPress={() => onSelectTab('all')}
            activeOpacity={0.75}>
            <Text style={[styles.filterTabText, activeTab === 'all' && styles.filterTabTextActive]}>
              All Activity
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'saved' && styles.filterTabActive]}
            onPress={() => onSelectTab('saved')}
            activeOpacity={0.75}>
            <Text style={[styles.filterTabText, activeTab === 'saved' && styles.filterTabTextActive]}>
              Saved
            </Text>
            {savedCount > 0 && (
              <View
                style={[
                  styles.filterTabCount,
                  activeTab === 'saved' && styles.filterTabCountActive,
                ]}>
                <Text
                  style={[
                    styles.filterTabCountText,
                    activeTab === 'saved' && styles.filterTabCountTextActive,
                  ]}>
                  {savedCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'custom' && styles.filterTabActive]}
            onPress={() => onSelectTab('custom')}
            activeOpacity={0.75}>
            <Text style={[styles.filterTabText, activeTab === 'custom' && styles.filterTabTextActive]}>
              Custom Links
            </Text>
            {customCount > 0 && (
              <View
                style={[
                  styles.filterTabCount,
                  activeTab === 'custom' && styles.filterTabCountActive,
                ]}>
                <Text
                  style={[
                    styles.filterTabCountText,
                    activeTab === 'custom' && styles.filterTabCountTextActive,
                  ]}>
                  {customCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'favorites' && styles.filterTabActive]}
            onPress={() => onSelectTab('favorites')}
            activeOpacity={0.75}>
            <Text style={[styles.filterTabText, activeTab === 'favorites' && styles.filterTabTextActive]}>
              Priority
            </Text>
          </TouchableOpacity>

          {completedCount > 0 && (
            <TouchableOpacity
              style={[styles.filterTab, activeTab === 'completed' && styles.filterTabActive]}
              onPress={() => onSelectTab('completed')}
              activeOpacity={0.75}>
              <Text style={[styles.filterTabText, activeTab === 'completed' && styles.filterTabTextActive]}>
                Completed
              </Text>
              <View
                style={[
                  styles.filterTabCount,
                  activeTab === 'completed' && styles.filterTabCountActive,
                ]}>
                <Text
                  style={[
                    styles.filterTabCountText,
                    activeTab === 'completed' && styles.filterTabCountTextActive,
                  ]}>
                  {completedCount}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }
);
