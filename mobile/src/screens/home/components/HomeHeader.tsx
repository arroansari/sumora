import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../context/ThemeContext';
import { createHomeStyles } from '../HomeScreen.styles';

export interface HomeHeaderProps {
  insets: EdgeInsets;
  styles: ReturnType<typeof createHomeStyles>;
  onSummarizePress: () => void;
  title?: string;
  subtitle?: string;
  activePlatform?: 'YOUTUBE' | 'REDDIT';
  onPlatformSwitch?: (platform: 'YOUTUBE' | 'REDDIT') => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = React.memo(
  ({
    insets,
    styles,
    onSummarizePress,
    title = 'Video Activity Feed',
    subtitle = 'Distilled summaries from followed channels & links',
    activePlatform = 'YOUTUBE',
    onPlatformSwitch,
  }) => {
    const { accentTheme } = useAppTheme();

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
            {/* Platform Horizon Switcher Tabs */}
            {onPlatformSwitch && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.16)',
                  borderRadius: 16,
                  padding: 2,
                  marginBottom: 6,
                  alignSelf: 'flex-start',
                }}>
                <TouchableOpacity
                  onPress={() => onPlatformSwitch('YOUTUBE')}
                  activeOpacity={0.8}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 14,
                    backgroundColor: activePlatform === 'YOUTUBE' ? '#FFFFFF' : 'transparent',
                  }}>
                  <Text
                    style={{
                      fontSize: 11.5,
                      fontWeight: '800',
                      color: activePlatform === 'YOUTUBE' ? '#4F46E5' : 'rgba(255, 255, 255, 0.85)',
                    }}>
                    ▶ YouTube
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onPlatformSwitch('REDDIT')}
                  activeOpacity={0.8}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 14,
                    backgroundColor: activePlatform === 'REDDIT' ? '#FFFFFF' : 'transparent',
                  }}>
                  <Text
                    style={{
                      fontSize: 11.5,
                      fontWeight: '800',
                      color: activePlatform === 'REDDIT' ? '#FF4500' : 'rgba(255, 255, 255, 0.85)',
                    }}>
                    💬 Reddit
                  </Text>
                </TouchableOpacity>
              </View>
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
