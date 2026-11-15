import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../context/ThemeContext';
import { createHomeStyles } from '../HomeScreen.styles';
import { SpaceType } from '../../../types/models.types';

export interface HomeHeaderProps {
  insets: EdgeInsets;
  styles: ReturnType<typeof createHomeStyles>;
  onSummarizePress: () => void;
  title?: string;
  subtitle?: string;
  activeSpace?: SpaceType;
  onSpacePillPress?: () => void;
}

const SPACE_DISPLAY_CONFIG: Record<SpaceType, { label: string; icon: string }> = {
  YOUTUBE: { label: 'YouTube Videos', icon: '▶️' },
  REDDIT: { label: 'Reddit Discussions', icon: '💬' },
  TMDB: { label: 'Cinema & OTT', icon: '🎬' },
  OPEN_LIBRARY: { label: 'Book Insights', icon: '📚' },
};

export const HomeHeader: React.FC<HomeHeaderProps> = React.memo(
  ({
    insets,
    styles,
    onSummarizePress,
    title = 'Video Activity Feed',
    subtitle = 'Distilled summaries from followed channels & links',
    activeSpace = 'YOUTUBE',
    onSpacePillPress,
  }) => {
    const { accentTheme } = useAppTheme();
    const currentConfig = SPACE_DISPLAY_CONFIG[activeSpace] || SPACE_DISPLAY_CONFIG.YOUTUBE;

    return (
      <View style={[styles.headerGradientWrapper, { paddingTop: insets.top + 6 }]}>
        {/* Real 3-stop diagonal gradient from active theme asset */}
        <Image
          source={accentTheme.assets.header}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        <View style={styles.headerContent}>
          <View style={styles.headerLeftCol}>
            {/* Universal Space Switcher Dropdown Pill */}
            {onSpacePillPress && (
              <TouchableOpacity
                onPress={onSpacePillPress}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.22)',
                  borderRadius: 16,
                  paddingHorizontal: 11,
                  paddingVertical: 4.5,
                  marginBottom: 6,
                  alignSelf: 'flex-start',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.35)',
                }}>
                <Text style={{ fontSize: 12, marginRight: 5 }}>{currentConfig.icon}</Text>
                <Text
                  style={{
                    fontSize: 11.5,
                    fontWeight: '800',
                    color: '#FFFFFF',
                    marginRight: 4,
                  }}>
                  {currentConfig.label}
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: '900',
                    color: 'rgba(255, 255, 255, 0.85)',
                    marginTop: 1,
                  }}>
                  ▼
                </Text>
              </TouchableOpacity>
            )}

            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerSummarizeBtn}
            onPress={onSummarizePress}
            activeOpacity={0.85}>
            <View
              style={[StyleSheet.absoluteFill, styles.headerSummarizeInnerClip]}
              pointerEvents="none">
              <Image
                source={accentTheme.assets.button}
                style={styles.fullSizeImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.headerSparkleIcon}>✦</Text>
            <Text style={styles.headerSummarizeBtnText}>Summarize</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);
