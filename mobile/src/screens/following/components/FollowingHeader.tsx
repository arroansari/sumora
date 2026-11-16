import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createFollowingStyles } from '../FollowingScreen.styles';

export interface FollowingHeaderProps {
  styles: ReturnType<typeof createFollowingStyles>;
  platformSection: 'channels' | 'subreddits';
  count: number;
  isAddActive: boolean;
  onToggleAdd: () => void;
}

export const FollowingHeader: React.FC<FollowingHeaderProps> = ({
  styles,
  platformSection,
  count,
  isAddActive,
  onToggleAdd,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerTopRow}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>
            {platformSection === 'channels' ? 'Tracked Channels' : 'Tracked Subreddits'}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{count}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.toggleAddButton, isAddActive && styles.toggleAddButtonActive]}
          onPress={onToggleAdd}>
          <Text
            style={[
              styles.toggleAddButtonText,
              isAddActive && styles.toggleAddButtonTextActive,
            ]}>
            {platformSection === 'channels' ? (isAddActive ? '✕ Close' : '+ Add') : '+ Add'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.headerSubtitle}>
        {platformSection === 'channels'
          ? 'Manage subscribed channels for automatic summarization'
          : 'Track high-upvote debates and community consensus across Reddit'}
      </Text>
    </View>
  );
};

