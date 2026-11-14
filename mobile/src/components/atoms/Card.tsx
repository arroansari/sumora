import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { borderRadius, spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  const { colors, isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.20)' : colors.border,
          borderLeftColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
          borderRightColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.03)' : colors.border,
          shadowColor: isDark ? '#000000' : '#0F172A',
        },
        style,
      ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1.2,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
});

