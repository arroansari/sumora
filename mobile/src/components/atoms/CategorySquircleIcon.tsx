import React from 'react';
import { View, StyleSheet, Text, StyleProp, ViewStyle } from 'react-native';

export type AppCategoryId =
  | 'all'
  | 'favorites'
  | 'tech'
  | 'business'
  | 'news'
  | 'design'
  | 'games'
  | 'food'
  | 'faith'
  | 'education'
  | 'lifestyle'
  | 'entertainment'
  | 'other';

export interface CategorySquircleIconProps {
  category: AppCategoryId | string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

interface CategoryStyleConfig {
  bg: string;
  border: string;
  accent: string;
  glyph: string;
}

export const CATEGORY_ICON_CONFIGS: Record<string, CategoryStyleConfig> = {
  favorites: {
    bg: '#FEF3C7', // Soft pastel gold
    border: '#FDE68A',
    accent: '#D97706',
    glyph: '★',
  },
  faith: {
    bg: '#CCFBF1', // Soft pastel teal
    border: '#99F6E4',
    accent: '#0D9488',
    glyph: '🕌',
  },
  tech: {
    bg: '#E0F2FE', // Soft pastel sky blue
    border: '#BAE6FD',
    accent: '#0284C7',
    glyph: '💻',
  },
  design: {
    bg: '#FCE7F3', // Soft pastel pink/fuchsia
    border: '#FBCFE8',
    accent: '#DB2777',
    glyph: '🎨',
  },
  games: {
    bg: '#EDE9FE', // Soft pastel purple/indigo
    border: '#DDD6FE',
    accent: '#7C3AED',
    glyph: '🎮',
  },
  food: {
    bg: '#FFEDD5', // Soft pastel warm peach
    border: '#FED7AA',
    accent: '#EA580C',
    glyph: '🍔',
  },
  news: {
    bg: '#F1F5F9', // Soft pastel slate
    border: '#E2E8F0',
    accent: '#475569',
    glyph: '📰',
  },
  business: {
    bg: '#DCFCE7', // Soft pastel green
    border: '#BBF7D0',
    accent: '#059669',
    glyph: '💼',
  },
  education: {
    bg: '#D1FAE5', // Soft pastel mint
    border: '#A7F3D0',
    accent: '#10B981',
    glyph: '📚',
  },
  lifestyle: {
    bg: '#ECFCCB', // Soft pastel lime
    border: '#D9F99D',
    accent: '#65A30D',
    glyph: '🏃',
  },
  entertainment: {
    bg: '#FFE4E6', // Soft pastel rose
    border: '#FECDD3',
    accent: '#E11D48',
    glyph: '🎬',
  },
  other: {
    bg: '#F4F4F5', // Soft pastel zinc
    border: '#E4E4E7',
    accent: '#71717A',
    glyph: '📺',
  },
  all: {
    bg: '#EEF2FF', // Soft pastel violet
    border: '#DDD6FE',
    accent: '#6366F1',
    glyph: '✦',
  },
};

export const CategorySquircleIcon: React.FC<CategorySquircleIconProps> = ({
  category,
  size = 20,
  style,
}) => {
  const config =
    CATEGORY_ICON_CONFIGS[category] || CATEGORY_ICON_CONFIGS.all;
  const radius = Math.round(size * 0.28);
  const glyphSize = Math.round(size * 0.58);

  return (
    <View
      style={[
        styles.squircleContainer,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: config.bg,
          borderColor: config.border,
        },
        style,
      ]}>
      {category === 'favorites' ? (
        <Text
          style={[
            styles.starGlyph,
            { fontSize: Math.round(size * 0.62), color: config.accent },
          ]}>
          ★
        </Text>
      ) : (
        <Text style={{ fontSize: glyphSize, lineHeight: glyphSize + 2 }}>
          {config.glyph}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  squircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.8,
    shadowColor: 'rgba(0, 0, 0, 0.04)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  starGlyph: {
    fontWeight: '900',
    textAlign: 'center',
  },
});

