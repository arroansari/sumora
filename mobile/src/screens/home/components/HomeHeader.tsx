import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { createHomeStyles } from '../HomeScreen.styles';

export interface HomeHeaderProps {
  insets: EdgeInsets;
  styles: ReturnType<typeof createHomeStyles>;
  onSummarizePress: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = React.memo(
  ({ insets, styles, onSummarizePress }) => {
    return (
      <View style={[styles.headerGradientWrapper, { paddingTop: insets.top + 6 }]}>
        <Image
          source={require('../../../assets/images/header_gradient.png')}
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
                source={require('../../../assets/images/button_gradient.png')}
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

