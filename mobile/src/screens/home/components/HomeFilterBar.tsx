import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { createHomeStyles } from '../HomeScreen.styles';

export type FeedTab = 'all' | 'saved' | 'custom' | 'favorites' | 'completed';

export interface HomeFilterBarProps {
  activeTab: FeedTab;
  onSelectTab: (tab: FeedTab) => void;
  savedCount: number;
  customCount: number;
  completedCount: number;
  styles: ReturnType<typeof createHomeStyles>;
}

export const HomeFilterBar: React.FC<HomeFilterBarProps> = React.memo(
  ({
    activeTab,
    onSelectTab,
    savedCount,
    customCount,
    completedCount,
    styles,
  }) => {
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

