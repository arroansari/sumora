// ─────────────────────────────────────────────────────────────────────────────
// TextScaleSlider — Interactive Horizontal Font Scale Progress Bar
//
// Tactile progress slider (80% – 140%, 5% steps) with theme-aware fill,
// draggable thumb, A-/A+ quick taps, 100% default snap marker, and live preview.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  Image,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import { AppThemeOption } from '../../theme/appThemes';
import { ThemeColors } from '../../theme/colors';
import {
  MIN_TEXT_SCALE,
  MAX_TEXT_SCALE,
  DEFAULT_TEXT_SCALE,
} from '../../context/ThemeContext';

const STEP = 0.05;
const THUMB_SIZE = 24;
const TRACK_HEIGHT = 8;
const TOUCH_HEIGHT = 36;

interface TextScaleSliderProps {
  textScale: number;
  onChangeScale: (scale: number | ((prev: number) => number)) => void;
  onResetScale: () => void;
  accentTheme: AppThemeOption;
  colors: ThemeColors;
  onSlidingChange?: (isSliding: boolean) => void;
}

const snapToStep = (raw: number): number => {
  const clamped = Math.max(MIN_TEXT_SCALE, Math.min(MAX_TEXT_SCALE, raw));
  const stepped = Math.round(clamped / STEP) * STEP;
  return Math.round(stepped * 100) / 100;
};

export const TextScaleSlider: React.FC<TextScaleSliderProps> = React.memo(
  ({
    textScale,
    onChangeScale,
    onResetScale,
    accentTheme,
    colors,
    onSlidingChange,
  }) => {
    const [trackWidth, setTrackWidth] = useState<number>(0);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const trackWidthRef = useRef(0);
    const startRatioRef = useRef(0);
    const currentRatioRef = useRef(0);

    const normalized = Math.max(
      0,
      Math.min(1, (textScale - MIN_TEXT_SCALE) / (MAX_TEXT_SCALE - MIN_TEXT_SCALE))
    );
    currentRatioRef.current = normalized;

    const percentage = Math.round(textScale * 100);
    const isDefault = percentage === Math.round(DEFAULT_TEXT_SCALE * 100);
    const fs = (n: number) => Math.round(n * textScale);

    const updateFromRatio = useCallback(
      (ratio: number) => {
        const clamped = Math.max(0, Math.min(1, ratio));
        const rawScale = MIN_TEXT_SCALE + clamped * (MAX_TEXT_SCALE - MIN_TEXT_SCALE);
        onChangeScale(snapToStep(rawScale));
      },
      [onChangeScale]
    );

    const handleTrackLayout = useCallback((e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width;
      trackWidthRef.current = w;
      setTrackWidth(w);
    }, []);

    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onStartShouldSetPanResponderCapture: () => true,
          onMoveShouldSetPanResponder: (_evt, gs) => Math.abs(gs.dx) > 2,
          onMoveShouldSetPanResponderCapture: (_evt, gs) => Math.abs(gs.dx) > Math.abs(gs.dy),
          onPanResponderTerminationRequest: () => false,
          onPanResponderGrant: (evt) => {
            setIsDragging(true);
            onSlidingChange?.(true);

            const w = trackWidthRef.current;
            if (w <= 0) return;

            const tapX = evt.nativeEvent.locationX;
            const ratio = Math.max(0, Math.min(1, tapX / w));
            startRatioRef.current = ratio;
            updateFromRatio(ratio);
          },
          onPanResponderMove: (_evt, gs) => {
            const w = trackWidthRef.current;
            if (w <= 0) return;
            const ratio = startRatioRef.current + gs.dx / w;
            updateFromRatio(ratio);
          },
          onPanResponderRelease: () => {
            setIsDragging(false);
            onSlidingChange?.(false);
          },
          onPanResponderTerminate: () => {
            setIsDragging(false);
            onSlidingChange?.(false);
          },
        }),
      [onSlidingChange, updateFromRatio]
    );

    const handleStepDown = () => {
      onChangeScale((prev) => snapToStep(prev - STEP));
    };

    const handleStepUp = () => {
      onChangeScale((prev) => snapToStep(prev + STEP));
    };

    // Position math
    const fillWidth = trackWidth * normalized;
    const thumbLeft = Math.max(
      0,
      Math.min(trackWidth - THUMB_SIZE, fillWidth - THUMB_SIZE / 2)
    );
    const defaultRatio = (DEFAULT_TEXT_SCALE - MIN_TEXT_SCALE) / (MAX_TEXT_SCALE - MIN_TEXT_SCALE);
    const defaultTickLeft = trackWidth * defaultRatio;

    const accentColor =
      accentTheme.id === 'charcoal_gold'
        ? accentTheme.primary
        : accentTheme.themeType === 'gradient'
        ? accentTheme.primary
        : accentTheme.tone1;
    const onAccentColor = accentTheme.id === 'charcoal_gold' ? '#181818' : '#FFFFFF';

    return (
      <View style={styles.container}>
        {/* ── Header row ─────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.textPrimary, fontSize: fs(15) }]}>
              Text Scale
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: fs(11.5) }]}>
              Drag bar to adjust reading size
            </Text>
          </View>

          <View style={styles.badgeGroup}>
            {!isDefault && (
              <TouchableOpacity
                onPress={onResetScale}
                activeOpacity={0.75}
                style={[styles.resetPill, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}>
                <Text style={[styles.resetText, { color: colors.textSecondary }]}>Reset</Text>
              </TouchableOpacity>
            )}
            <View
              style={[
                styles.percentBadge,
                {
                  backgroundColor: isDragging ? accentColor : accentTheme.badgeBg,
                },
              ]}>
              <Text
                style={[
                  styles.percentText,
                  {
                    color: isDragging ? onAccentColor : accentTheme.badgeText,
                  },
                ]}>
                {percentage}%
              </Text>
            </View>
          </View>
        </View>

        {/* ── Progress bar + flanking A- / A+ controls ───────────── */}
        <View style={styles.sliderRow}>
          <TouchableOpacity
            onPress={handleStepDown}
            activeOpacity={0.65}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
            style={styles.stepTarget}>
            <Text allowFontScaling={false} style={[styles.smallA, { color: colors.textSecondary }]}>
              A
            </Text>
          </TouchableOpacity>

          {/* Interactive Track */}
          <View
            collapsable={false}
            onLayout={handleTrackLayout}
            style={styles.trackTouchArea}
            {...panResponder.panHandlers}>
            {/* Background groove */}
            <View
              pointerEvents="none"
              style={[
                styles.trackGroove,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                },
              ]}>
              {/* Active fill */}
              <View
                style={[
                  styles.trackFill,
                  {
                    width: fillWidth,
                    backgroundColor: accentColor,
                  },
                ]}>
                {accentTheme.assets.button ? (
                  <Image
                    source={accentTheme.assets.button}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                ) : null}
              </View>
            </View>

            {/* 100% default snap indicator dot */}
            {trackWidth > 0 && (
              <View
                pointerEvents="none"
                style={[
                  styles.defaultMarker,
                  {
                    left: defaultTickLeft - 1.5,
                    backgroundColor: normalized >= defaultRatio ? 'rgba(255,255,255,0.75)' : colors.textMuted,
                  },
                ]}
              />
            )}

            {/* Draggable thumb */}
            {trackWidth > 0 && (
              <View
                pointerEvents="none"
                style={[
                  styles.thumb,
                  {
                    left: thumbLeft,
                    backgroundColor: accentColor,
                    shadowColor: accentTheme.primaryDark,
                    transform: [{ scale: isDragging ? 1.12 : 1 }],
                  },
                ]}>
                {accentTheme.assets.button ? (
                  <Image
                    source={accentTheme.assets.button}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                ) : null}
                <View style={styles.thumbInnerDot} />
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleStepUp}
            activeOpacity={0.65}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
            style={styles.stepTarget}>
            <Text allowFontScaling={false} style={[styles.largeA, { color: colors.textPrimary }]}>
              A
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Scale endpoints ────────────────────────────────────── */}
        <View style={styles.scaleLabelsRow}>
          <Text allowFontScaling={false} style={[styles.scaleLabel, { color: colors.textMuted }]}>
            80%
          </Text>
          <TouchableOpacity onPress={onResetScale} activeOpacity={0.7}>
            <Text
              allowFontScaling={false}
              style={[
                styles.scaleLabel,
                {
                  color: isDefault ? accentColor : colors.textMuted,
                  fontFamily: isDefault ? 'PlusJakartaSans-Bold' : 'PlusJakartaSans-Regular',
                },
              ]}>
              100% Default
            </Text>
          </TouchableOpacity>
          <Text allowFontScaling={false} style={[styles.scaleLabel, { color: colors.textMuted }]}>
            140%
          </Text>
        </View>

        {/* ── Live preview strip ─────────────────────────────────── */}
        <View
          style={[
            styles.previewBox,
            {
              backgroundColor: colors.surfaceSubtle,
              borderColor: colors.borderSubtle,
            },
          ]}>
          <Text
            style={[
              styles.previewText,
              {
                color: colors.textPrimary,
                fontSize: fs(13),
                lineHeight: fs(19),
              },
            ]}
            numberOfLines={2}>
            AI summaries and takeaways preview cleanly at {percentage}% scale.
          </Text>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontWeight: '600',
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans-Regular',
    marginTop: 2,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resetPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  resetText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontWeight: '600',
  },
  percentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 48,
    alignItems: 'center',
  },
  percentText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontWeight: '800',
  },

  // Slider Row
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepTarget: {
    width: 28,
    height: TOUCH_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallA: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
  },
  largeA: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontWeight: '800',
  },

  trackTouchArea: {
    flex: 1,
    height: TOUCH_HEIGHT,
    justifyContent: 'center',
  },
  trackGroove: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    borderWidth: 0.75,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
  },
  defaultMarker: {
    position: 'absolute',
    top: (TOUCH_HEIGHT - 10) / 2,
    width: 3,
    height: 10,
    borderRadius: 1.5,
  },
  thumb: {
    position: 'absolute',
    top: (TOUCH_HEIGHT - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 4,
  },
  thumbInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },

  // Labels below bar
  scaleLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 34,
    marginTop: 2,
    marginBottom: 12,
  },
  scaleLabel: {
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans-Regular',
  },

  // Live preview strip
  previewBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  previewText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontWeight: '500',
  },
});
