import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createFollowingStyles } from '../FollowingScreen.styles';

export interface FollowingHeaderProps {
  styles: ReturnType<typeof createFollowingStyles>;
  title: string;
  subtitle: string;
  count: number;
  isAddActive: boolean;
  onToggleAdd: () => void;
  badgeColor?: string;
  addButtonColor?: string;
}

export const FollowingHeader: React.FC<FollowingHeaderProps> = ({
  styles,
  title,
  subtitle,
  count,
  isAddActive,
  onToggleAdd,
  badgeColor,
  addButtonColor,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerTopRow}>
        <View style={[styles.headerTitleGroup, { marginRight: 10 }]}>
          <Text style={[styles.headerTitle, { flexShrink: 1 }]} numberOfLines={1}>
            {title}
          </Text>
          <View style={[styles.countBadge, badgeColor ? { backgroundColor: badgeColor } : undefined]}>
            <Text style={styles.countBadgeText}>{count}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.toggleAddButton,
            addButtonColor && !isAddActive ? { backgroundColor: addButtonColor } : undefined,
            isAddActive && styles.toggleAddButtonActive,
          ]}
          onPress={onToggleAdd}>
          <Text
            style={[
              styles.toggleAddButtonText,
              isAddActive && styles.toggleAddButtonTextActive,
            ]}>
            {isAddActive ? '✕ Close' : '+ Add'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.headerSubtitle}>{subtitle}</Text>
    </View>
  );
};
