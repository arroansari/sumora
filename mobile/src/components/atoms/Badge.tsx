import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { borderRadius, spacing, typography } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'accent';
}

export const Badge: React.FC<BadgeProps> = ({ label }) => {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.badge, { backgroundColor: colors.badgeBg }]}>
      <Text style={[typography.badge, { color: colors.badgeText }]}>{label.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
});

