import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createHomeStyles } from '../HomeScreen.styles';

export interface DomainEmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  actionText: string;
  actionColor?: string;
  onAction: () => void;
  styles: ReturnType<typeof createHomeStyles>;
}

export const DomainEmptyState: React.FC<DomainEmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionText,
  actionColor,
  onAction,
  styles,
}) => {
  return (
    <View style={[styles.centerContainer, styles.redditEmptyContainer]}>
      <Text style={styles.redditEmptyIcon}>{icon}</Text>
      <Text style={styles.redditEmptyTitle}>{title}</Text>
      <Text style={styles.redditEmptySubtitle}>{subtitle}</Text>
      <TouchableOpacity
        style={[styles.manageSubredditsBtn, actionColor ? { backgroundColor: actionColor } : undefined]}
        onPress={onAction}
        activeOpacity={0.8}>
        <Text style={styles.manageSubredditsBtnText}>{actionText}</Text>
      </TouchableOpacity>
    </View>
  );
};

