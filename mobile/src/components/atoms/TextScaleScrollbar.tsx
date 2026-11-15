import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  Image,
  StyleSheet,
  Animated,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { AppThemeOption } from '../../theme/appThemes';
import { ThemeColors } from '../../theme/colors';
import { MIN_TEXT_SCALE, MAX_TEXT_SCALE, DEFAULT_TEXT_SCALE } from '../../context/ThemeContext';

const TRACK_HEIGHT = 140;
const THUMB_HEIGHT = 30;
const SLIDER_RANGE = TRACK_HEIGHT - THUMB_HEIGHT;

interface TextScaleScrollbarProps {
  textScale: number;
  onChangeScale: (scale: number | ((prev: number) => number)) => void;
  onResetScale?: () => void;
  accentTheme: AppThemeOption;
  colors: ThemeColors;
  style?: StyleProp<ViewStyle>;
  initialExpanded?: boolean;
}

export const TextScaleScrollbar: React.FC<TextScaleScrollbarProps> = ({
  textScale,
  onChangeScale,
  onResetScale,
  accentTheme,
  colors,
  style,
  initialExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(initialExpanded);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const tooltipFadeAnim = useRef(new Animated.Value(0)).current;
  const hideTooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute thumb position: top is MAX_TEXT_SCALE (1.4), bottom is MIN_TEXT_SCALE (0.8)
  const normalized = (textScale - MIN_TEXT_SCALE) / (MAX_TEXT_SCALE - MIN_TEXT_SCALE);
  const thumbTop = (1 - normalized) * SLIDER_RANGE;

  const showTooltip = useCallback(() => {
    if (hideTooltipTimer.current) {
      clearTimeout(hideTooltipTimer.current);
      hideTooltipTimer.current = null;
    }
    Animated.timing(tooltipFadeAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [tooltipFadeAnim]);

  const scheduleHideTooltip = useCallback((delay = 1800) => {
    if (hideTooltipTimer.current) clearTimeout(hideTooltipTimer.current);
    hideTooltipTimer.current = setTimeout(() => {
      Animated.timing(tooltipFadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }, delay);
  }, [tooltipFadeAnim]);

  const updateScaleFromY = useCallback((y: number) => {
    const clampedY = Math.max(0, Math.min(SLIDER_RANGE, y));
    const ratio = 1 - clampedY / SLIDER_RANGE;
    const newScale = MIN_TEXT_SCALE + ratio * (MAX_TEXT_SCALE - MIN_TEXT_SCALE);
    onChangeScale(Math.round(newScale * 100) / 100);
  }, [onChangeScale]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          setIsDragging(true);
          showTooltip();
          const locationY = evt.nativeEvent.locationY;
          updateScaleFromY(locationY - THUMB_HEIGHT / 2);
        },
        onPanResponderMove: (evt) => {
          const locationY = evt.nativeEvent.locationY;
          updateScaleFromY(locationY - THUMB_HEIGHT / 2);
        },
        onPanResponderRelease: () => {
          setIsDragging(false);
          scheduleHideTooltip(1200);
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
          scheduleHideTooltip(1000);
        },
      }),
    [showTooltip, scheduleHideTooltip, updateScaleFromY]
  );

  const handleStepUp = () => {
    showTooltip();
    onChangeScale((prev) => Math.min(MAX_TEXT_SCALE, Math.round((prev + 0.05) * 100) / 100));
    scheduleHideTooltip();
  };

  const handleStepDown = () => {
    showTooltip();
    onChangeScale((prev) => Math.max(MIN_TEXT_SCALE, Math.round((prev - 0.05) * 100) / 100));
    scheduleHideTooltip();
  };

  const handleReset = () => {
    showTooltip();
    if (onResetScale) {
      onResetScale();
    } else {
      onChangeScale(DEFAULT_TEXT_SCALE);
    }
    scheduleHideTooltip();
  };

  useEffect(() => {
    return () => {
      if (hideTooltipTimer.current) clearTimeout(hideTooltipTimer.current);
    };
  }, []);

  const percentage = Math.round(textScale * 100);

  // If collapsed: display sleek floating pill
  if (!isExpanded) {
    return (
      <View style={[styles.floatingContainer, style]} pointerEvents="box-none">
        <TouchableOpacity
          style={[
            styles.collapsedPill,
            {
              backgroundColor: colors.surface,
              borderColor: accentTheme.primary,
              shadowColor: accentTheme.primaryDark,
            },
          ]}
          onPress={() => {
            setIsExpanded(true);
            showTooltip();
            scheduleHideTooltip(2500);
          }}
          activeOpacity={0.85}>
          <View style={[styles.pillIconBox, { backgroundColor: accentTheme.badgeBg }]}>
            <Text style={[styles.pillIconText, { color: accentTheme.badgeText }]}>Aa</Text>
          </View>
          <Text style={[styles.collapsedPillText, { color: colors.textPrimary }]}>
            {percentage}%
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If expanded: display full vertical text scaling scrollbar
  return (
    <View style={[styles.floatingContainer, style]} pointerEvents="box-none">
      <View
        style={[
          styles.expandedCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: accentTheme.primaryDark,
          },
        ]}>
        {/* Header / Close Row */}
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setIsExpanded(false)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.closeBtnText, { color: colors.textMuted }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Step UP Button (A+) */}
        <TouchableOpacity
          style={[
            styles.stepButton,
            {
              backgroundColor: accentTheme.badgeBg,
            },
          ]}
          onPress={handleStepUp}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Text style={[styles.stepButtonText, { color: accentTheme.badgeText }]}>A+</Text>
        </TouchableOpacity>

        {/* Vertical Track Area */}
        <View style={styles.trackContainer} {...panResponder.panHandlers}>
          {/* Background Groove */}
          <View
            style={[
              styles.groove,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.borderSubtle,
              },
            ]}>
            {/* Active filled line tinted with theme primary */}
            <View
              style={[
                styles.grooveFill,
                {
                  top: thumbTop + THUMB_HEIGHT / 2,
                  bottom: 0,
                  backgroundColor: accentTheme.primaryLight,
                },
              ]}
            />
          </View>

          {/* Tick mark at 100% (Default) */}
          <View
            style={[
              styles.tickMarkDefault,
              {
                top: (1 - (1.0 - MIN_TEXT_SCALE) / (MAX_TEXT_SCALE - MIN_TEXT_SCALE)) * SLIDER_RANGE +
                  THUMB_HEIGHT / 2 -
                  1,
                backgroundColor: accentTheme.primary,
              },
            ]}
          />

          {/* Draggable Dynamic Gradient Thumb */}
          <View
            style={[
              styles.thumbWrapper,
              {
                top: thumbTop,
                shadowColor: accentTheme.primaryDark,
              },
            ]}>
            <Image
              source={accentTheme.assets.button}
              style={styles.thumbGradientImage}
              resizeMode="cover"
            />
            {/* White grip dot / line */}
            <View style={styles.thumbGripIndicator} />
          </View>

          {/* Live Floating Tooltip Bubble next to thumb */}
          <Animated.View
            style={[
              styles.tooltipBubble,
              {
                top: thumbTop - 4,
                opacity: tooltipFadeAnim,
                backgroundColor: colors.textPrimary,
              },
            ]}
            pointerEvents={isDragging ? 'none' : 'auto'}>
            <TouchableOpacity onPress={handleReset} activeOpacity={0.8}>
              <Text style={[styles.tooltipText, { color: colors.background }]}>
                {percentage}%
              </Text>
              {percentage !== 100 && (
                <Text style={[styles.tooltipResetSub, { color: accentTheme.primaryLight }]}>
                  tap to reset
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Step DOWN Button (A-) */}
        <TouchableOpacity
          style={[
            styles.stepButton,
            {
              backgroundColor: accentTheme.badgeBg,
            },
          ]}
          onPress={handleStepDown}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Text style={[styles.stepButtonText, { color: accentTheme.badgeText }]}>A-</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    right: 12,
    top: 140,
    zIndex: 999,
  },
  collapsedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
    gap: 6,
  },
  pillIconBox: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillIconText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  collapsedPillText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  expandedCard: {
    width: 48,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
  cardHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 6,
  },
  closeBtn: {
    padding: 2,
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
  trackContainer: {
    width: 44,
    height: TRACK_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginVertical: 8,
  },
  groove: {
    position: 'absolute',
    top: THUMB_HEIGHT / 2,
    bottom: THUMB_HEIGHT / 2,
    width: 6,
    borderRadius: 3,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  grooveFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 3,
  },
  tickMarkDefault: {
    position: 'absolute',
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  thumbWrapper: {
    position: 'absolute',
    width: 34,
    height: THUMB_HEIGHT,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  thumbGradientImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  thumbGripIndicator: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  tooltipBubble: {
    position: 'absolute',
    right: 48,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    minWidth: 54,
  },
  tooltipText: {
    fontSize: 12.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  tooltipResetSub: {
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: 1,
    textAlign: 'center',
  },
});
