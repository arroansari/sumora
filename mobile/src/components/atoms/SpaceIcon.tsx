import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Text } from 'react-native';
import { SpaceType } from '../../types/models.types';

export interface SpaceIconProps {
  space: SpaceType;
  size?: number;
  style?: StyleProp<ViewStyle>;
  containerOnly?: boolean;
}

export const SPACE_CONTAINER_COLORS: Record<
  SpaceType,
  {
    bg: string;
    border: string;
    accent: string;
  }
> = {
  YOUTUBE: {
    bg: '#ECE9FE', // Soft pastel lavender
    border: '#DDD6FE',
    accent: '#7C3AED',
  },
  REDDIT: {
    bg: '#FFE8D6', // Soft pastel peach
    border: '#FFD7B8',
    accent: '#FF4500',
  },
  TMDB: {
    bg: '#FEF3C7', // Soft warm sand / gold
    border: '#FDE68A',
    accent: '#D97706',
  },
  OPEN_LIBRARY: {
    bg: '#D1FAE5', // Soft pastel mint green
    border: '#A7F3D0',
    accent: '#10B981',
  },
};

/**
 * 1. YouTube Squircle Glyph
 * Purple rounded pill with centered crisp white play triangle.
 */
const YouTubeGlyph: React.FC<{ size: number }> = ({ size }) => {
  const boxW = Math.round(size * 0.54);
  const boxH = Math.round(size * 0.40);
  const boxRadius = Math.round(size * 0.12);
  const triH = Math.round(size * 0.14);
  const triW = Math.round(size * 0.11);

  return (
    <View
      style={[
        styles.ytBox,
        {
          width: boxW,
          height: boxH,
          borderRadius: boxRadius,
        },
      ]}>
      <View
        style={[
          styles.playTriangle,
          {
            borderLeftWidth: triH,
            borderTopWidth: triW,
            borderBottomWidth: triW,
            marginLeft: Math.round(size * 0.02),
          },
        ]}
      />
    </View>
  );
};

/**
 * 2. Reddit Community Squircle Glyph
 * Clean, policy-compliant orange rounded circle with crisp white "r/" community typographic badge.
 */
const RedditGlyph: React.FC<{ size: number }> = ({ size }) => {
  const bubbleSize = Math.round(size * 0.56);
  const fontSize = Math.round(bubbleSize * 0.54);

  return (
    <View
      style={[
        styles.redditBubble,
        {
          width: bubbleSize,
          height: bubbleSize,
          borderRadius: Math.round(bubbleSize * 0.35),
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}>
      <Text
        allowFontScaling={false}
        style={{
          color: '#FFFFFF',
          fontWeight: '900',
          fontSize,
          letterSpacing: -0.5,
          textAlign: 'center',
          includeFontPadding: false,
        }}>
        r/
      </Text>
    </View>
  );
};

/**
 * 3. Cinema Clapperboard Glyph
 * Clapperboard with angled black/white chevrons on top and golden star on body.
 */
const CinemaGlyph: React.FC<{ size: number }> = ({ size }) => {
  const clapperW = Math.round(size * 0.54);
  const clapperH = Math.round(size * 0.50);
  const topBarH = Math.round(clapperH * 0.32);
  const bodyH = clapperH - topBarH;

  return (
    <View
      style={[
        styles.clapperContainer,
        {
          width: clapperW,
          height: clapperH,
        },
      ]}>
      {/* Top Clapper Bar with diagonal stripes */}
      <View
        style={[
          styles.clapperTopBar,
          {
            height: topBarH,
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
          },
        ]}>
        <View style={styles.stripeSlash} />
        <View style={styles.stripeSlash} />
        <View style={styles.stripeSlash} />
        <View style={styles.stripeSlash} />
      </View>

      {/* Clapper Body with Star */}
      <View
        style={[
          styles.clapperBody,
          {
            height: bodyH,
            borderBottomLeftRadius: 5,
            borderBottomRightRadius: 5,
          },
        ]}>
        <Text
          style={[
            styles.clapperStar,
            {
              fontSize: Math.round(size * 0.22),
            },
          ]}>
          ★
        </Text>
      </View>
    </View>
  );
};

/**
 * 4. Books Glyph
 * Two 3D stacked books with green covers and white pages.
 */
const BooksGlyph: React.FC<{ size: number }> = ({ size }) => {
  const containerW = Math.round(size * 0.54);
  const containerH = Math.round(size * 0.50);
  const bookW = Math.round(containerW * 0.58);
  const bookH = Math.round(containerH * 0.90);

  return (
    <View
      style={[
        styles.booksContainer,
        {
          width: containerW,
          height: containerH,
        },
      ]}>
      {/* Back Book (Darker Green) */}
      <View
        style={[
          styles.bookBack,
          {
            width: bookW,
            height: bookH * 0.94,
            left: 0,
            bottom: 2,
            borderTopLeftRadius: 3,
            borderBottomLeftRadius: 3,
            borderTopRightRadius: 2,
            borderBottomRightRadius: 2,
          },
        ]}>
        {/* White page top */}
        <View style={styles.bookBackPagesTop} />
      </View>

      {/* Front Book (Vibrant Emerald) */}
      <View
        style={[
          styles.bookFront,
          {
            width: bookW,
            height: bookH,
            right: 0,
            bottom: 0,
            borderTopLeftRadius: 4,
            borderBottomLeftRadius: 4,
            borderTopRightRadius: 3,
            borderBottomRightRadius: 3,
          },
        ]}>
        {/* Embossed Title Lines on Cover */}
        <View style={styles.bookCoverLines}>
          <View style={[styles.bookLine, { width: '60%' }]} />
          <View style={[styles.bookLine, { width: '40%' }]} />
        </View>

        {/* White page trim on right */}
        <View style={styles.bookPageTrim} />
      </View>
    </View>
  );
};

export const SpaceIcon: React.FC<SpaceIconProps> = ({
  space,
  size = 36,
  style,
}) => {
  const colors = SPACE_CONTAINER_COLORS[space] || SPACE_CONTAINER_COLORS.YOUTUBE;
  const radius = Math.round(size * 0.28);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.bg,
        },
        style,
      ]}>
      {space === 'YOUTUBE' && <YouTubeGlyph size={size} />}
      {space === 'REDDIT' && <RedditGlyph size={size} />}
      {space === 'TMDB' && <CinemaGlyph size={size} />}
      {space === 'OPEN_LIBRARY' && <BooksGlyph size={size} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },

  /* ── YouTube Styles ── */
  ytBox: {
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderLeftColor: '#FFFFFF',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },

  /* ── Reddit Styles ── */
  redditBubble: {
    backgroundColor: '#FF4500',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  redditTail: {
    position: 'absolute',
    bottom: -1,
    left: 2,
    width: 0,
    height: 0,
    borderRightColor: 'transparent',
    borderBottomColor: '#FF4500',
    transform: [{ rotate: '45deg' }],
  },
  redditAntenna: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  redditAntennaStem: {
    width: 1.5,
    height: 6,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '25deg' }],
  },
  redditAntennaBall: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginTop: -2,
    marginLeft: 3,
  },
  redditFaceContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snooEar: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    top: '20%',
  },
  snooFaceOval: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  redditEyesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 1,
  },
  snooEye: {
    backgroundColor: '#FF4500',
  },
  snooSmile: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#FF4500',
  },

  /* ── Cinema Styles ── */
  clapperContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#78350F',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  clapperTopBar: {
    width: '100%',
    backgroundColor: '#1E140A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    overflow: 'hidden',
  },
  stripeSlash: {
    width: 4,
    height: '160%',
    backgroundColor: '#F8FAFC',
    transform: [{ rotate: '35deg' }],
  },
  clapperBody: {
    width: '100%',
    backgroundColor: '#2A1B0E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clapperStar: {
    color: '#FBBF24',
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 18,
  },

  /* ── Books Styles ── */
  booksContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBack: {
    position: 'absolute',
    backgroundColor: '#047857',
    borderWidth: 0.5,
    borderColor: '#065F46',
  },
  bookBackPagesTop: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 3,
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  bookFront: {
    position: 'absolute',
    backgroundColor: '#10B981',
    justifyContent: 'center',
    paddingLeft: 4,
    borderWidth: 0.5,
    borderColor: '#059669',
    shadowColor: '#064E3B',
    shadowOpacity: 0.3,
    shadowOffset: { width: 1, height: 2 },
    shadowRadius: 2,
  },
  bookCoverLines: {
    gap: 2.5,
  },
  bookLine: {
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 1,
  },
  bookPageTrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 2.5,
    height: '100%',
    backgroundColor: '#F1F5F9',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
});
