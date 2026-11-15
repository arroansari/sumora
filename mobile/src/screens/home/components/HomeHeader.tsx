import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../context/ThemeContext';
import { createHomeStyles } from '../HomeScreen.styles';

export interface HomeHeaderProps {
  insets: EdgeInsets;
  styles: ReturnType<typeof createHomeStyles>;
  onSummarizePress: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = React.memo(
  ({ insets, styles, onSummarizePress }) => {
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
            <Text style={styles.headerTitle}>Video Activity Feed</Text>
            <Text style={styles.headerSubtitle} numberOfLines={2}>
              Distilled summaries from followed channels & links
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
