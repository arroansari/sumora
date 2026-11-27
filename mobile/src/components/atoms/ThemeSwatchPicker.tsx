// ─────────────────────────────────────────────────────────────────────────────
// ThemeSwatchPicker — Interactive Tactile Theme Selection
//
// Section 1 "Executive Palette"   — 6 gradient themes with live spectrum scrubber
// Section 2 "Luxury Color Combos" — 5 two-tone themes with dual-swatch scrubber
//
// Features:
//   • Tactile horizontal spectrum / split-tone scrubbers (like TextScaleSlider)
//   • Spring-animated swatch cards with auto-centering carousel & check badge
//   • Live mini UI surface preview showing how colors apply in context
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  PanResponder,
  Animated,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import { AppThemeOption } from '../../theme/appThemes';
import { ThemeColors } from '../../theme/colors';

const CARD_WIDTH = 124;
const CARD_GAP = 10;
const CARD_STEP = CARD_WIDTH + CARD_GAP;

const SCRUBBER_THUMB_SIZE = 28;
const SCRUBBER_TRACK_HEIGHT = 12;
const SCRUBBER_TOUCH_HEIGHT = 40;

interface ThemeSwatchPickerProps {
  themes: AppThemeOption[];
  activeThemeId: string;
  onSelectTheme: (id: AppThemeOption['id']) => void;
  colors: ThemeColors;
  isDark?: boolean;
  textScale?: number;
  onSlidingChange?: (isSliding: boolean) => void;
}

const getThemeAccent = (theme: AppThemeOption) =>
  theme.themeType === 'gradient' ? theme.primary : theme.tone1;

const getOnAccentText = (theme: AppThemeOption) =>
  theme.id === 'charcoal_gold' ? '#181818' : '#FFFFFF';

// ─────────────────────────────────────────────────────────────────────────────
// ThemeSpectrumScrubber — Tactile Drag Rail + Step Controls
// ─────────────────────────────────────────────────────────────────────────────
interface ThemeSpectrumScrubberProps {
  items: AppThemeOption[];
  activeIndex: number;
  isSectionActive: boolean;
  variant: 'gradient' | 'two-tone';
  onSelectIndex: (index: number) => void;
  onScrubStateChange: (isScrubbing: boolean) => void;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeSpectrumScrubber: React.FC<ThemeSpectrumScrubberProps> = React.memo(
  ({
    items,
    activeIndex,
    isSectionActive,
    variant,
    onSelectIndex,
    onScrubStateChange,
    colors,
    isDark,
  }) => {
    const [trackWidth, setTrackWidth] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const trackWidthRef = useRef(0);
    const startRatioRef = useRef(0);
    const lastEmittedIndexRef = useRef(isSectionActive ? activeIndex : -1);
    const itemsRef = useRef(items);
    itemsRef.current = items;
    const isSectionActiveRef = useRef(isSectionActive);
    isSectionActiveRef.current = isSectionActive;
    const onSelectIndexRef = useRef(onSelectIndex);
    onSelectIndexRef.current = onSelectIndex;
    const onScrubStateChangeRef = useRef(onScrubStateChange);
    onScrubStateChangeRef.current = onScrubStateChange;

    const safeIndex = Math.max(0, Math.min(items.length - 1, activeIndex));
    const currentTheme = items[safeIndex] ?? items[0];

    const isTwoTone = variant === 'two-tone';
    const thumbSize = isTwoTone ? 34 : SCRUBBER_THUMB_SIZE;
    const touchHeight = isTwoTone ? 46 : SCRUBBER_TOUCH_HEIGHT;

    const thumbTranslateX = useRef(new Animated.Value(0)).current;
    const thumbScale = useRef(new Animated.Value(1)).current;

    const getThumbXForIndex = useCallback(
      (idx: number, width: number) => {
        const count = itemsRef.current.length;
        if (width <= 0 || count <= 1) return 0;
        if (variant === 'two-tone') {
          const segW = width / count;
          return idx * segW + (segW - thumbSize) / 2;
        }
        const maxTravel = Math.max(0, width - thumbSize);
        const ratio = Math.max(0, Math.min(1, idx / (count - 1)));
        return ratio * maxTravel;
      },
      [variant, thumbSize]
    );

    useEffect(() => {
      if (trackWidth <= 0) return;
      const targetX = getThumbXForIndex(safeIndex, trackWidth);
      if (isDragging) {
        Animated.spring(thumbTranslateX, {
          toValue: targetX,
          tension: 340,
          friction: 26,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.spring(thumbTranslateX, {
          toValue: targetX,
          tension: 220,
          friction: 22,
          useNativeDriver: true,
        }).start();
      }
    }, [safeIndex, trackWidth, isDragging, getThumbXForIndex, thumbTranslateX]);

    useEffect(() => {
      Animated.spring(thumbScale, {
        toValue: isDragging ? 1.18 : 1,
        tension: 280,
        friction: 18,
        useNativeDriver: true,
      }).start();
    }, [isDragging, thumbScale]);

    const emitFromRatio = useCallback(
      (ratio: number, force = false) => {
        const list = itemsRef.current;
        if (list.length === 0) return;
        const clamped = Math.max(0, Math.min(0.9999, ratio));
        const idx =
          variant === 'two-tone'
            ? Math.min(list.length - 1, Math.floor(clamped * list.length))
            : Math.round(Math.max(0, Math.min(1, ratio)) * (list.length - 1));
        if (force || idx !== lastEmittedIndexRef.current) {
          lastEmittedIndexRef.current = idx;
          onSelectIndexRef.current(idx);
        }
      },
      [variant]
    );

    useEffect(() => {
      lastEmittedIndexRef.current = isSectionActive ? safeIndex : -1;
    }, [safeIndex, isSectionActive]);

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
          onMoveShouldSetPanResponderCapture: (_evt, gs) =>
            Math.abs(gs.dx) > Math.abs(gs.dy),
          onPanResponderTerminationRequest: () => false,
          onPanResponderGrant: (evt) => {
            setIsDragging(true);
            onScrubStateChangeRef.current(true);

            const w = trackWidthRef.current;
            if (w <= 0) return;
            const ratio = Math.max(0, Math.min(1, evt.nativeEvent.locationX / w));
            startRatioRef.current = ratio;
            emitFromRatio(ratio, !isSectionActiveRef.current);
          },
          onPanResponderMove: (_evt, gs) => {
            const w = trackWidthRef.current;
            if (w <= 0) return;
            const ratio = startRatioRef.current + gs.dx / w;
            emitFromRatio(ratio);
          },
          onPanResponderRelease: () => {
            setIsDragging(false);
            onScrubStateChangeRef.current(false);
          },
          onPanResponderTerminate: () => {
            setIsDragging(false);
            onScrubStateChangeRef.current(false);
          },
        }),
      [emitFromRatio]
    );

    const canPrev = isSectionActive ? safeIndex > 0 : true;
    const canNext = safeIndex < items.length - 1;

    const handleStep = (delta: number) => {
      if (!isSectionActive) {
        const target = delta > 0 ? Math.min(items.length - 1, 1) : 0;
        onSelectIndex(target);
        return;
      }
      const next = Math.max(0, Math.min(items.length - 1, safeIndex + delta));
      if (next !== safeIndex) {
        onSelectIndex(next);
      }
    };

    const accentColor = currentTheme
      ? isDark && currentTheme.themeType === 'two-tone'
        ? currentTheme.id === 'charcoal_gold'
          ? currentTheme.primary
          : currentTheme.tone2
        : getThemeAccent(currentTheme)
      : colors.primary;

    return (
      <View style={scrubberStyles.container}>
        <View style={scrubberStyles.row}>
          {/* Previous theme button */}
          <TouchableOpacity
            onPress={() => handleStep(-1)}
            disabled={!canPrev}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
            style={[
              scrubberStyles.stepBtn,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.border,
                opacity: canPrev ? 1 : 0.38,
              },
            ]}>
            <Text allowFontScaling={false} style={[scrubberStyles.stepIcon, { color: colors.textPrimary }]}>
              ‹
            </Text>
          </TouchableOpacity>

          {/* Interactive Spectrum Track */}
          <View
            collapsable={false}
            onLayout={handleTrackLayout}
            style={[scrubberStyles.trackTouchArea, { height: touchHeight }]}
            {...panResponder.panHandlers}>
            {/* Multi-stop segmented groove */}
            <View
              pointerEvents="none"
              style={[
                scrubberStyles.trackGroove,
                isTwoTone && scrubberStyles.twoToneTrackGroove,
                { borderColor: colors.border },
              ]}>
              {items.map((item, idx) => {
                const isSelectedStop = idx === safeIndex && isSectionActive;
                if (variant === 'gradient') {
                  return (
                    <View key={item.id} style={scrubberStyles.segment}>
                      {item.assets.swatch ? (
                        <Image
                          source={item.assets.swatch}
                          style={StyleSheet.absoluteFill}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            StyleSheet.absoluteFill,
                            { backgroundColor: item.gradientStart },
                          ]}
                        />
                      )}
                      {idx !== safeIndex && (
                        <View style={scrubberStyles.unselectedSegmentVeil} />
                      )}
                    </View>
                  );
                }

                return (
                  <View
                    key={item.id}
                    style={[
                      scrubberStyles.twoToneSegment,
                      idx > 0 && {
                        borderLeftWidth: 1.5,
                        borderLeftColor: colors.surface,
                      },
                    ]}>
                    <View style={{ flex: 1, backgroundColor: item.tone1 }} />
                    <View style={{ flex: 1, backgroundColor: item.tone2 }} />
                    {!isSelectedStop && (
                      <View
                        style={[
                          scrubberStyles.unselectedSegmentVeil,
                          {
                            backgroundColor: isDark
                              ? 'rgba(0,0,0,0.28)'
                              : 'rgba(255,255,255,0.22)',
                          },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>

            {/* Stop notch markers (gradient bar only; two-tone segments are self-delimited) */}
            {!isTwoTone &&
              trackWidth > 0 &&
              items.map((item, idx) => {
                const notchLeft =
                  getThumbXForIndex(idx, trackWidth) + thumbSize / 2 - 2;
                const isActiveStop = idx === safeIndex;
                return (
                  <View
                    key={`${item.id}_tick`}
                    pointerEvents="none"
                    style={[
                      scrubberStyles.stopTick,
                      {
                        left: notchLeft,
                        opacity: isActiveStop ? 0 : 0.75,
                      },
                    ]}
                  />
                );
              })}

            {/* Draggable Animated Thumb */}
            {trackWidth > 0 && currentTheme && (
              <Animated.View
                pointerEvents="none"
                style={[
                  scrubberStyles.thumb,
                  {
                    top: (touchHeight - thumbSize) / 2,
                    width: thumbSize,
                    height: thumbSize,
                    borderRadius: thumbSize / 2,
                    shadowColor: accentColor,
                    transform: [
                      { translateX: thumbTranslateX },
                      { scale: thumbScale },
                    ],
                  },
                ]}>
                {variant === 'gradient' ? (
                  <>
                    {currentTheme.assets.button ? (
                      <Image
                        source={currentTheme.assets.button}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          StyleSheet.absoluteFill,
                          { backgroundColor: currentTheme.primary },
                        ]}
                      />
                    )}
                    <View style={scrubberStyles.thumbCenterDot} />
                  </>
                ) : (
                  <View style={scrubberStyles.splitThumbInner}>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: currentTheme.tone1,
                      }}
                    />
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: currentTheme.tone2,
                      }}
                    />
                    <View style={scrubberStyles.splitThumbDivider} />
                    {isSectionActive && (
                      <View style={scrubberStyles.splitThumbCheck}>
                        <Text allowFontScaling={false} style={scrubberStyles.splitThumbCheckText}>
                          ✓
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </Animated.View>
            )}
          </View>

          {/* Next theme button */}
          <TouchableOpacity
            onPress={() => handleStep(1)}
            disabled={!canNext}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
            style={[
              scrubberStyles.stepBtn,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.border,
                opacity: canNext ? 1 : 0.38,
              },
            ]}>
            <Text allowFontScaling={false} style={[scrubberStyles.stepIcon, { color: colors.textPrimary }]}>
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live scrub feedback caption */}
        <View style={scrubberStyles.metaRow}>
          {isTwoTone && currentTheme ? (
            <View style={scrubberStyles.twoToneReadout}>
              <View style={scrubberStyles.readoutDots}>
                <View style={[scrubberStyles.readoutDot, { backgroundColor: currentTheme.tone1 }]} />
                <View
                  style={[
                    scrubberStyles.readoutDot,
                    {
                      backgroundColor: currentTheme.tone2,
                      borderWidth: 0.75,
                      borderColor: colors.border,
                    },
                  ]}
                />
              </View>
              <Text
                allowFontScaling={false}
                style={[scrubberStyles.readoutTitle, { color: colors.textPrimary }]}
                numberOfLines={1}>
                {currentTheme.label}
              </Text>
              <Text
                allowFontScaling={false}
                style={[scrubberStyles.readoutTag, { color: colors.textMuted }]}
                numberOfLines={1}>
                · {currentTheme.tagline}
              </Text>
            </View>
          ) : (
            <Text allowFontScaling={false} style={[scrubberStyles.metaHint, { color: colors.textMuted }]}>
              {isDragging ? 'Release to lock identity' : 'Slide or tap stops to preview live'}
            </Text>
          )}
          <View
            style={[
              scrubberStyles.counterPill,
              {
                backgroundColor: isDragging ? accentColor : colors.surfaceSubtle,
                borderColor: isDragging ? accentColor : colors.border,
              },
            ]}>
            <Text
              allowFontScaling={false}
              style={[
                scrubberStyles.counterText,
                {
                  color: isDragging
                    ? isDark && variant === 'two-tone'
                      ? currentTheme?.tone1 ?? '#181818'
                      : currentTheme?.id === 'charcoal_gold'
                      ? '#E5C78B'
                      : '#FFFFFF'
                    : colors.textSecondary,
                },
              ]}>
              {isSectionActive ? `${safeIndex + 1} / ${items.length}` : `Tap · ${items.length}`}
            </Text>
          </View>
        </View>
      </View>
    );
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// AnimatedSwatchCard — Spring Scale + Elevated Selection Feel
// ─────────────────────────────────────────────────────────────────────────────
interface AnimatedSwatchCardProps {
  theme: AppThemeOption;
  isActive: boolean;
  isScrubbing: boolean;
  onPress: () => void;
  colors: ThemeColors;
  isDark: boolean;
}

const AnimatedSwatchCard: React.FC<AnimatedSwatchCardProps> = React.memo(
  ({ theme, isActive, isScrubbing, onPress, colors, isDark }) => {
    const scaleAnim = useRef(new Animated.Value(isActive ? 1.03 : 0.96)).current;
    const badgeScaleAnim = useRef(new Animated.Value(isActive ? 1 : 0.01)).current;

    useEffect(() => {
      const targetScale = isActive ? (isScrubbing ? 1.06 : 1.02) : 0.96;
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: targetScale,
          tension: 250,
          friction: 18,
          useNativeDriver: true,
        }),
        Animated.spring(badgeScaleAnim, {
          toValue: isActive ? 1 : 0.01,
          tension: 280,
          friction: 16,
          useNativeDriver: true,
        }),
      ]).start();
    }, [isActive, isScrubbing, scaleAnim, badgeScaleAnim]);

    const isGradient = theme.themeType === 'gradient';
    const borderHighlight = isGradient
      ? isDark
        ? theme.primaryLight
        : theme.primary
      : isDark
      ? theme.id === 'charcoal_gold'
        ? theme.primary
        : theme.tone2
      : theme.tone1;
    const labelColor = isActive
      ? isGradient
        ? isDark
          ? theme.primaryLight
          : theme.primary
        : isDark
        ? theme.id === 'charcoal_gold'
          ? theme.primary
          : theme.tone2
        : theme.tone1
      : colors.textPrimary;

    return (
      <Animated.View
        style={[
          cardStyles.cardMotionWrap,
          {
            opacity: isActive ? 1 : 0.86,
            transform: [{ scale: scaleAnim }],
          },
        ]}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.84}
          style={[
            cardStyles.cardBase,
            { backgroundColor: colors.surface },
            isActive
              ? {
                  borderColor: borderHighlight,
                  borderWidth: 2.5,
                  shadowColor: borderHighlight,
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: 0.24,
                  shadowRadius: 8,
                  elevation: 6,
                }
              : {
                  borderColor: colors.border,
                  borderWidth: 1,
                },
          ]}>
          {isGradient ? (
            <View style={cardStyles.swatchArea}>
              {theme.assets.swatch ? (
                <Image
                  source={theme.assets.swatch}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: theme.gradientStart },
                  ]}
                />
              )}

              {/* Subtle color-stop DNA chips */}
              <View style={cardStyles.dnaChipRow}>
                <View style={[cardStyles.dnaDot, { backgroundColor: theme.gradientStart }]} />
                <View style={[cardStyles.dnaDot, { backgroundColor: theme.accent }]} />
              </View>

              {isActive && (
                <Animated.View
                  style={[
                    cardStyles.checkBadge,
                    { transform: [{ scale: badgeScaleAnim }] },
                  ]}>
                  <Text style={cardStyles.checkMark}>✓</Text>
                </Animated.View>
              )}
            </View>
          ) : (
            <View style={cardStyles.twoToneSwatchArea}>
              <View style={[cardStyles.swatchHalf, { backgroundColor: theme.tone1 }]} />
              <View
                style={[
                  cardStyles.swatchHalf,
                  {
                    backgroundColor: theme.tone2,
                    borderLeftWidth: 1,
                    borderLeftColor: 'rgba(0,0,0,0.08)',
                  },
                ]}
              />
              {isActive && (
                <Animated.View
                  style={[
                    cardStyles.splitCenterCheck,
                    { transform: [{ scale: badgeScaleAnim }] },
                  ]}>
                  <Text style={cardStyles.checkMark}>✓</Text>
                </Animated.View>
              )}
            </View>
          )}

          {/* Card Footer */}
          <View style={cardStyles.cardInfo}>
            <Text
              style={[cardStyles.cardLabel, { color: labelColor }]}
              numberOfLines={1}>
              {theme.label}
            </Text>
            <View style={cardStyles.taglineRow}>
              {!isGradient && (
                <View style={cardStyles.dualDotPair}>
                  <View style={[cardStyles.miniToneDot, { backgroundColor: theme.tone1 }]} />
                  <View
                    style={[
                      cardStyles.miniToneDot,
                      {
                        backgroundColor: theme.tone2,
                        borderColor: colors.border,
                        borderWidth: 0.75,
                      },
                    ]}
                  />
                </View>
              )}
              <Text
                style={[cardStyles.cardTagline, { color: colors.textMuted }]}
                numberOfLines={1}>
                {theme.tagline}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Main ThemeSwatchPicker
// ─────────────────────────────────────────────────────────────────────────────
export const ThemeSwatchPicker: React.FC<ThemeSwatchPickerProps> = React.memo(
  ({
    themes,
    activeThemeId,
    onSelectTheme,
    colors,
    isDark = false,
    textScale = 1.0,
    onSlidingChange,
  }) => {
    const fs = (n: number) => Math.round(n * textScale);

    const [scrubbingSection, setScrubbingSection] = useState<'gradient' | 'two-tone' | null>(null);
    const [gradientScrollW, setGradientScrollW] = useState(0);

    const gradientScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

    const activeTheme = useMemo(
      () => themes.find((t) => t.id === activeThemeId) || themes[0],
      [themes, activeThemeId]
    );

    const gradientThemes = useMemo(
      () => themes.filter((t) => t.themeType === 'gradient'),
      [themes]
    );
    const twoToneThemes = useMemo(
      () => themes.filter((t) => t.themeType === 'two-tone'),
      [themes]
    );

    const activeGradientIndex = useMemo(() => {
      const idx = gradientThemes.findIndex((t) => t.id === activeThemeId);
      return idx >= 0 ? idx : 0;
    }, [gradientThemes, activeThemeId]);

    const activeTwoToneIndex = useMemo(() => {
      const idx = twoToneThemes.findIndex((t) => t.id === activeThemeId);
      return idx >= 0 ? idx : 0;
    }, [twoToneThemes, activeThemeId]);

    // Auto-center active card in the gradient carousel whenever selection changes
    useEffect(() => {
      if (activeTheme.themeType === 'gradient' && gradientScrollW > 0) {
        const idx = gradientThemes.findIndex((t) => t.id === activeTheme.id);
        if (idx >= 0) {
          const offset = Math.max(0, idx * CARD_STEP - (gradientScrollW - CARD_WIDTH) / 2);
          gradientScrollRef.current?.scrollTo({ x: offset, animated: true });
        }
      }
    }, [activeTheme, gradientThemes, gradientScrollW]);

    const handleScrubState = useCallback(
      (section: 'gradient' | 'two-tone', active: boolean) => {
        setScrubbingSection(active ? section : null);
        onSlidingChange?.(active);
      },
      [onSlidingChange]
    );

    // Live UI Surface Preview + Psychology Insight Card
    const renderLivePreviewCard = (theme: AppThemeOption) => {
      const isGradient = theme.themeType === 'gradient';
      const pillBg =
        theme.id === 'charcoal_gold'
          ? theme.primary
          : isGradient
          ? theme.primary
          : isDark
          ? theme.tone2
          : theme.tone1;
      const pillText =
        theme.id === 'charcoal_gold'
          ? '#181818'
          : !isGradient && isDark
          ? theme.tone1
          : '#FFFFFF';
      const insightBg = isGradient
        ? isDark
          ? theme.primary + '22'
          : theme.badgeBg
        : isDark
        ? theme.tone1 + '55'
        : theme.tone1 + '12';
      const insightBorder = isGradient
        ? theme.primary + '45'
        : isDark
        ? theme.tone2 + '40'
        : theme.tone1 + '35';
      const insightTitleColor = isGradient
        ? isDark
          ? theme.primaryLight
          : theme.primary
        : isDark
        ? theme.id === 'charcoal_gold'
          ? theme.primary
          : theme.tone2
        : theme.tone1;

      return (
        <View
          style={[
            pickerStyles.insightCard,
            {
              backgroundColor: insightBg,
              borderColor: insightBorder,
            },
          ]}>
          {/* Mini Live Surface Preview */}
          {isGradient ? (
            <View
              style={[
                previewStyles.miniStage,
                {
                  backgroundColor: colors.surface,
                  borderColor: theme.primary + '30',
                },
              ]}>
              <View style={previewStyles.miniHeader}>
                <View style={[previewStyles.miniDot, { backgroundColor: theme.gradientStart }]} />
                <Text
                  style={[previewStyles.miniTitle, { color: colors.textPrimary, fontSize: fs(11.5) }]}
                  numberOfLines={1}>
                  {theme.label} · Live Preview
                </Text>
                <View style={[previewStyles.miniTag, { backgroundColor: theme.badgeBg }]}>
                  <Text style={[previewStyles.miniTagText, { color: theme.badgeText }]}>
                    AI Ready
                  </Text>
                </View>
              </View>

              <View style={previewStyles.miniBodyRow}>
                <View style={previewStyles.miniBarGroup}>
                  <View style={[previewStyles.miniAccentBar, { backgroundColor: theme.primary }]} />
                  <View style={[previewStyles.miniSubBar, { backgroundColor: theme.accent + '65' }]} />
                </View>

                <View style={[previewStyles.miniCta, { backgroundColor: theme.primary }]}>
                  {theme.assets.button ? (
                    <Image
                      source={theme.assets.button}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                  ) : null}
                  <Text style={previewStyles.miniCtaText}>Summarize</Text>
                </View>
              </View>
            </View>
          ) : (
            <View
              style={[
                previewStyles.twoToneStage,
                { borderColor: theme.tone1 + '35' },
              ]}>
              {/* Dark Tone 1 Top Band */}
              <View style={[previewStyles.twoToneHeader, { backgroundColor: theme.tone1 }]}>
                <Text style={previewStyles.twoToneHeaderLabel}>
                  {theme.label}
                </Text>
                <View
                  style={[
                    previewStyles.twoToneBadge,
                    { backgroundColor: theme.tone2 },
                  ]}>
                  <Text style={[previewStyles.twoToneBadgeText, { color: theme.tone1 }]}>
                    Dual Tone
                  </Text>
                </View>
              </View>

              {/* Light Tone 2 Surface */}
              <View style={[previewStyles.twoToneBody, { backgroundColor: theme.tone2 }]}>
                <Text
                  style={[previewStyles.twoToneSampleTitle, { color: theme.tone1, fontSize: fs(11.5) }]}
                  numberOfLines={1}>
                  Primary Ink on Secondary Surface
                </Text>
                <View style={[previewStyles.twoToneBtn, { backgroundColor: theme.tone1 }]}>
                  <Text style={[previewStyles.twoToneBtnText, { color: theme.tone2 }]}>
                    Action
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Psychology Copy */}
          <Text
            style={[
              pickerStyles.insightTitle,
              {
                color: insightTitleColor,
                fontSize: fs(12),
              },
            ]}>
            ✦ {theme.tagline}
          </Text>
          <Text
            style={[
              pickerStyles.insightBody,
              { color: colors.textSecondary, fontSize: fs(11) },
            ]}>
            {theme.psychology}
          </Text>
          <View style={pickerStyles.tokenStrip}>
            <View style={[pickerStyles.tokenPill, { backgroundColor: pillBg }]}>
              <Text style={[pickerStyles.tokenPillText, { color: pillText }]}>
                Active Identity
              </Text>
            </View>
            <Text style={[pickerStyles.tokenHex, { color: colors.textMuted }]}>
              {isGradient
                ? `${theme.gradientStart} → ${theme.accent}`
                : `${theme.tone1} + ${theme.tone2}`}
            </Text>
          </View>
        </View>
      );
    };

    const headerPillBg =
      activeTheme.id === 'charcoal_gold'
        ? activeTheme.primary
        : activeTheme.themeType === 'gradient'
        ? activeTheme.primary
        : isDark
        ? activeTheme.tone2
        : activeTheme.tone1;
    const headerPillText =
      activeTheme.id === 'charcoal_gold'
        ? '#181818'
        : activeTheme.themeType === 'two-tone' && isDark
        ? activeTheme.tone1
        : getOnAccentText(activeTheme);

    return (
      <View style={pickerStyles.wrapper}>
        {/* ── Header ──────────────────────────────────────────────── */}
        <View style={pickerStyles.header}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                pickerStyles.mainTitle,
                { color: colors.textPrimary, fontSize: fs(16) },
              ]}>
              Theme & Color Identity
            </Text>
            <Text
              style={[
                pickerStyles.mainSub,
                { color: colors.textMuted, fontSize: fs(12) },
              ]}>
              Scrub the spectrum or tap cards — updates live
            </Text>
          </View>
          <View
            style={[
              pickerStyles.activePill,
              {
                backgroundColor: headerPillBg,
                transform: [{ scale: scrubbingSection ? 1.05 : 1 }],
              },
            ]}>
            <Text
              style={[
                pickerStyles.activePillText,
                { fontSize: fs(10), color: headerPillText },
              ]}>
              {activeTheme.label}
            </Text>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 1 — EXECUTIVE PALETTE (Gradient themes)
        ═══════════════════════════════════════════════════════════ */}
        <View style={pickerStyles.sectionTitleRow}>
          <Text style={[pickerStyles.sectionLabel, { color: colors.textMuted }]}>
            EXECUTIVE PALETTE
          </Text>
          {activeTheme.themeType === 'gradient' && (
            <View style={[pickerStyles.modeTag, { backgroundColor: activeTheme.badgeBg }]}>
              <Text style={[pickerStyles.modeTagText, { color: activeTheme.badgeText }]}>
                Active
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[
            pickerStyles.sectionDesc,
            { color: colors.textMuted, fontSize: fs(11) },
          ]}>
          Psychology-tailored luxury gradients crafted for reading endurance & deep focus
        </Text>

        {/* Tactile Gradient Spectrum Scrubber */}
        <ThemeSpectrumScrubber
          items={gradientThemes}
          activeIndex={activeGradientIndex}
          isSectionActive={activeTheme.themeType === 'gradient'}
          variant="gradient"
          onSelectIndex={(idx) => onSelectTheme(gradientThemes[idx].id)}
          onScrubStateChange={(active) => handleScrubState('gradient', active)}
          colors={colors}
          isDark={isDark}
        />

        <ScrollView
          ref={gradientScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onLayout={(e) => setGradientScrollW(e.nativeEvent.layout.width)}
          contentContainerStyle={pickerStyles.carouselRow}>
          {gradientThemes.map((t) => (
            <AnimatedSwatchCard
              key={t.id}
              theme={t}
              isActive={t.id === activeThemeId}
              isScrubbing={scrubbingSection === 'gradient'}
              onPress={() => onSelectTheme(t.id)}
              colors={colors}
              isDark={isDark}
            />
          ))}
        </ScrollView>

        {activeTheme.themeType === 'gradient' && renderLivePreviewCard(activeTheme)}

        {/* ═══════════════════════════════════════════════════════════
            SECTION 2 — LUXURY COLOR COMBOS (Two-tone themes)
        ═══════════════════════════════════════════════════════════ */}
        <View style={[pickerStyles.sectionSep, { backgroundColor: colors.borderSubtle }]} />

        <View style={pickerStyles.sectionTitleRow}>
          <Text style={[pickerStyles.sectionLabel, { color: colors.textMuted }]}>
            LUXURY COLOR COMBOS
          </Text>
          {activeTheme.themeType === 'two-tone' && (
            <View
              style={[
                pickerStyles.modeTag,
                {
                  backgroundColor:
                    activeTheme.id === 'charcoal_gold'
                      ? activeTheme.primary
                      : isDark
                      ? activeTheme.tone2
                      : activeTheme.tone1 + '18',
                },
              ]}>
              <Text
                style={[
                  pickerStyles.modeTagText,
                  {
                    color:
                      activeTheme.id === 'charcoal_gold'
                        ? '#181818'
                        : activeTheme.tone1,
                  },
                ]}>
                Active
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[
            pickerStyles.sectionDesc,
            { color: colors.textMuted, fontSize: fs(11) },
          ]}>
          Curated two-tone pairings — both colors appear on every screen
        </Text>

        {/* Tactile Split-Tone Scrubber (standalone selector without redundant cards below) */}
        <ThemeSpectrumScrubber
          items={twoToneThemes}
          activeIndex={activeTwoToneIndex}
          isSectionActive={activeTheme.themeType === 'two-tone'}
          variant="two-tone"
          onSelectIndex={(idx) => onSelectTheme(twoToneThemes[idx].id)}
          onScrubStateChange={(active) => handleScrubState('two-tone', active)}
          colors={colors}
          isDark={isDark}
        />

        {activeTheme.themeType === 'two-tone' && renderLivePreviewCard(activeTheme)}
      </View>
    );
  }
);

// ─── Scrubber styles ──────────────────────────────────────────────────────────
const scrubberStyles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIcon: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: -1,
  },
  trackTouchArea: {
    flex: 1,
    height: SCRUBBER_TOUCH_HEIGHT,
    justifyContent: 'center',
  },
  trackGroove: {
    flexDirection: 'row',
    height: SCRUBBER_TRACK_HEIGHT,
    borderRadius: SCRUBBER_TRACK_HEIGHT / 2,
    borderWidth: 0.75,
    overflow: 'hidden',
  },
  twoToneTrackGroove: {
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    overflow: 'hidden',
  },
  twoToneSegment: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  unselectedSegmentVeil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  stopTick: {
    position: 'absolute',
    top: (SCRUBBER_TOUCH_HEIGHT - 4) / 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  thumb: {
    position: 'absolute',
    left: 0,
    top: (SCRUBBER_TOUCH_HEIGHT - SCRUBBER_THUMB_SIZE) / 2,
    width: SCRUBBER_THUMB_SIZE,
    height: SCRUBBER_THUMB_SIZE,
    borderRadius: SCRUBBER_THUMB_SIZE / 2,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.34,
    shadowRadius: 5,
    elevation: 6,
  },
  thumbCenterDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  splitThumbInner: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
  },
  splitThumbDivider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  splitThumbCheck: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 16,
    height: 16,
    marginTop: -8,
    marginLeft: -8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitThumbCheckText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#0B0B0C',
    lineHeight: 11,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 36,
    marginTop: 4,
    gap: 8,
  },
  twoToneReadout: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  readoutDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  readoutDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  readoutTitle: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
  },
  readoutTag: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  metaHint: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  counterPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0.75,
  },
  counterText: {
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
  },
});

// ─── Card styles ──────────────────────────────────────────────────────────────
const cardStyles = StyleSheet.create({
  cardMotionWrap: {
    width: CARD_WIDTH,
    marginRight: CARD_GAP,
    paddingVertical: 4,
  },
  cardBase: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  swatchArea: {
    height: 74,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  twoToneSwatchArea: {
    flexDirection: 'row',
    height: 74,
    position: 'relative',
  },
  swatchHalf: {
    flex: 1,
  },
  dnaChipRow: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.28)',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dnaDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 0.75,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  splitCenterCheck: {
    position: 'absolute',
    top: (74 - 22) / 2,
    left: (CARD_WIDTH - 22) / 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.24,
    shadowRadius: 3,
    elevation: 4,
  },
  checkMark: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0B0B0C',
    lineHeight: 13,
  },
  cardInfo: {
    padding: 8,
  },
  cardLabel: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontWeight: '800',
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  dualDotPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  miniToneDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  cardTagline: {
    flex: 1,
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans-Regular',
  },
});

// ─── Live mini-preview styles ─────────────────────────────────────────────────
const previewStyles = StyleSheet.create({
  miniStage: {
    borderRadius: 11,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  miniHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  miniTitle: {
    flex: 1,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
  },
  miniTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniTagText: {
    fontSize: 9,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontWeight: '800',
  },
  miniBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  miniBarGroup: {
    flex: 1,
    gap: 4,
  },
  miniAccentBar: {
    height: 6,
    width: '82%',
    borderRadius: 3,
  },
  miniSubBar: {
    height: 5,
    width: '58%',
    borderRadius: 2.5,
  },
  miniCta: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
  },
  miniCtaText: {
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Two-tone architectural mini preview
  twoToneStage: {
    borderRadius: 11,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  twoToneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  twoToneHeaderLabel: {
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontWeight: '800',
    color: '#FFFFFF',
  },
  twoToneBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  twoToneBadgeText: {
    fontSize: 8.5,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontWeight: '800',
  },
  twoToneBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  twoToneSampleTitle: {
    flex: 1,
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontWeight: '600',
  },
  twoToneBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  twoToneBtnText: {
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontWeight: '800',
  },
});

// ─── Picker container styles ──────────────────────────────────────────────────
const pickerStyles = StyleSheet.create({
  wrapper: {
    paddingTop: 2,
    paddingBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  mainTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  mainSub: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
    fontFamily: 'PlusJakartaSans-Regular',
    maxWidth: 210,
  },
  activePill: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 118,
    alignSelf: 'flex-start',
  },
  activePillText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontWeight: '800',
    textAlign: 'center',
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontWeight: '800',
    letterSpacing: 1.0,
  },
  modeTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modeTagText: {
    fontSize: 9,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontWeight: '800',
  },
  sectionDesc: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Regular',
    lineHeight: 16,
    marginBottom: 10,
  },
  sectionSep: {
    height: 1,
    marginVertical: 18,
  },

  carouselRow: {
    flexDirection: 'row',
    paddingHorizontal: 2,
    paddingBottom: 6,
    marginBottom: 10,
  },

  insightCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 4,
  },
  insightTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    marginBottom: 4,
  },
  insightBody: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Regular',
    lineHeight: 16,
  },
  tokenStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  tokenPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
  },
  tokenPillText: {
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
  },
  tokenHex: {
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans-Regular',
  },
});
