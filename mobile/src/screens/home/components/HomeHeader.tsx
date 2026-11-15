import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
        {/* Dynamic gradient via two-layer View simulation */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: accentTheme.gradientStart },
          ]}
          pointerEvents="none"
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: accentTheme.gradientEnd,
              opacity: 0.42,
            },
          ]}
          pointerEvents="none"
        />

        <View style={styles.headerContent}>
          <View style={styles.headerLeftCol}>
            <Text style={styles.headerTitle}>Video Activity Feed</Text>
            <Text style={styles.headerSubtitle} numberOfLines={2}>
              Distilled summaries from followed channels & links
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.headerSummarizeBtn,
              {
                backgroundColor: 'rgba(255,255,255,0.18)',
                borderColor: 'rgba(255,255,255,0.35)',
                borderWidth: 1,
              },
            ]}
            onPress={onSummarizePress}
            activeOpacity={0.85}>
            <Text style={styles.headerSparkleIcon}>✦</Text>
            <Text style={styles.headerSummarizeBtnText}>Summarize</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);
