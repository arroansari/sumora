import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createHomeStyles } from '../HomeScreen.styles';
import { FeedTab } from './HomeFilterBar';

export interface FeedEmptyStateProps {
  activeTab: FeedTab;
  styles: ReturnType<typeof createHomeStyles>;
  onBrowseAll: () => void;
  onPasteLink: () => void;
  onExploreChannels: () => void;
  completedCount: number;
}

export const FeedEmptyState: React.FC<FeedEmptyStateProps> = React.memo(
  ({
    activeTab,
    styles,
    onBrowseAll,
    onPasteLink,
    onExploreChannels,
    completedCount,
  }) => {
    return (
      <View style={styles.centerContainer}>
        {activeTab === 'completed' ? (
          <>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyTitle}>No Completed Summaries</Text>
            <Text style={styles.emptySubtitle}>
              When you finish reading a summary and mark it as completed, it will be automatically stored in this archive.
            </Text>
          </>
        ) : activeTab === 'saved' ? (
          <>
            <Text style={styles.emptyIcon}>🔖</Text>
            <Text style={styles.emptyTitle}>No Saved Summaries Yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the bookmark icon on any video summary card in your feed to save it here for fast reference anytime.
            </Text>
            <TouchableOpacity
              style={styles.connectButton}
              onPress={onBrowseAll}
              activeOpacity={0.8}>
              <Text style={styles.connectButtonText}>Browse All Summaries</Text>
            </TouchableOpacity>
          </>
        ) : activeTab === 'custom' ? (
          <>
            <Text style={styles.emptyIcon}>🔗</Text>
            <Text style={styles.emptyTitle}>No Custom Links Yet</Text>
            <Text style={styles.emptySubtitle}>
              Paste any YouTube video or Shorts link using '✦ Summarize' to get instant video summaries kept right here in your feed.
            </Text>
            <TouchableOpacity
              style={styles.connectButton}
              onPress={onPasteLink}
              activeOpacity={0.8}>
              <Text style={styles.connectButtonText}>+ Paste YouTube Link</Text>
            </TouchableOpacity>
          </>
        ) : activeTab === 'favorites' ? (
          <>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyTitle}>No Priority Channels Starred</Text>
            <Text style={styles.emptySubtitle}>
              Head to the Following tab and star your favorite channels so their summaries are highlighted here.
            </Text>
            <TouchableOpacity
              style={styles.connectButton}
              onPress={onExploreChannels}
              activeOpacity={0.8}>
              <Text style={styles.connectButtonText}>Explore Followed Channels</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.emptyIconLarge}>📺</Text>
            <Text style={styles.emptyTitle}>
              {completedCount > 0 ? 'All Caught Up!' : 'No Video Summaries Yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {completedCount > 0
                ? 'You have completed all video summaries in your active feed.'
                : 'Follow channels in the Following tab to distill video summaries into your feed.'}
            </Text>
            {completedCount > 0 ? (
              <TouchableOpacity
                style={styles.connectButton}
                onPress={() => onBrowseAll()}
                activeOpacity={0.8}>
                <Text style={styles.connectButtonText}>View Completed Archive ({completedCount})</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.connectButton}
                onPress={onExploreChannels}
                activeOpacity={0.8}>
                <Text style={styles.connectButtonText}>Explore Followed Channels</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    );
  }
);

