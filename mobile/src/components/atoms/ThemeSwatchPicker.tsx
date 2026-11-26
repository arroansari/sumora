// ─────────────────────────────────────────────────────────────────────────────
// ThemeSwatchPicker — Premium Theme Selection
//
// Section 1 "Executive Palette"  — 6 gradient themes (image swatches)
// Section 2 "Brand Color Combos" — 14 two-tone themes (split-color views)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { AppThemeOption } from '../../theme/appThemes';
import { ThemeColors } from '../../theme/colors';

interface ThemeSwatchPickerProps {
  themes: AppThemeOption[];
  activeThemeId: string;
  onSelectTheme: (id: AppThemeOption['id']) => void;
  colors: ThemeColors;
  textScale?: number;
}

export const ThemeSwatchPicker: React.FC<ThemeSwatchPickerProps> = React.memo(
  ({ themes, activeThemeId, onSelectTheme, colors, textScale = 1.0 }) => {
    const fs = (n: number) => Math.round(n * textScale);

    const activeTheme = useMemo(
      () => themes.find((t) => t.id === activeThemeId) || themes[0],
      [themes, activeThemeId]
    );

    // Split by themeType
    const gradientThemes = useMemo(
      () => themes.filter((t) => t.themeType === 'gradient'),
      [themes]
    );
    const twoToneThemes = useMemo(
      () => themes.filter((t) => t.themeType === 'two-tone'),
      [themes]
    );

    // ── Gradient swatch card ───────────────────────────────────────────────
    const renderGradientCard = (theme: AppThemeOption) => {
      const isActive = theme.id === activeThemeId;
      return (
        <TouchableOpacity
          key={theme.id}
          onPress={() => onSelectTheme(theme.id)}
          activeOpacity={0.82}
          style={[
            cardStyles.gradientCard,
            isActive
              ? { borderColor: theme.primary, borderWidth: 2.5 }
              : { borderColor: colors.border, borderWidth: 1 },
          ]}>
          {/* Swatch image */}
          <View style={cardStyles.gradientSwatchWrap}>
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
            {isActive && (
              <View style={cardStyles.checkBadge}>
                <Text style={cardStyles.checkMark}>✓</Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={cardStyles.gradientInfo}>
            <Text
              style={[
                cardStyles.gradientLabel,
                { color: isActive ? theme.primary : colors.textPrimary },
              ]}
              numberOfLines={1}>
              {theme.label}
            </Text>
            <Text
              style={[cardStyles.gradientTagline, { color: colors.textMuted }]}
              numberOfLines={1}>
              {theme.tagline}
            </Text>
          </View>
        </TouchableOpacity>
      );
    };

    // ── Two-tone split card ────────────────────────────────────────────────
    const renderTwoToneCard = (theme: AppThemeOption, size: 'featured' | 'compact') => {
      const isActive = theme.id === activeThemeId;
      const isFeatured = size === 'featured';

      return (
        <TouchableOpacity
          key={theme.id}
          onPress={() => onSelectTheme(theme.id)}
          activeOpacity={0.82}
          style={[
            isFeatured ? cardStyles.featuredCard : cardStyles.compactCard,
            isActive
              ? { borderColor: theme.tone1, borderWidth: 2.5 }
              : { borderColor: colors.border, borderWidth: 1 },
          ]}>
          {/* Split swatch */}
          <View style={isFeatured ? cardStyles.featuredSwatch : cardStyles.compactSwatch}>
            <View style={[cardStyles.swatchHalf, { backgroundColor: theme.tone1 }]}>
              {isActive && (
                <View style={cardStyles.checkBadge}>
                  <Text style={cardStyles.checkMark}>✓</Text>
                </View>
              )}
            </View>
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
          </View>

          {/* Info */}
          <View style={isFeatured ? cardStyles.featuredInfo : cardStyles.compactInfo}>
            <Text
              style={[
                isFeatured ? cardStyles.featuredLabel : cardStyles.compactLabel,
                { color: isActive ? theme.tone1 : colors.textPrimary },
              ]}
              numberOfLines={1}>
              {theme.label}
            </Text>
            {isFeatured && (
              <Text
                style={[cardStyles.featuredTagline2, { color: colors.textMuted }]}
                numberOfLines={1}>
                {theme.tagline}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );
    };

    // Featured two-tone = all 5 in one scrollable row; no extended grid needed
    const featuredTwoTone = useMemo(() => twoToneThemes, [twoToneThemes]);

    // Active insight card
    const renderInsightCard = (theme: AppThemeOption) => (
      <View
        style={[
          pickerStyles.insightCard,
          {
            backgroundColor:
              theme.themeType === 'gradient'
                ? theme.badgeBg
                : theme.tone1 + '12',
            borderColor:
              theme.themeType === 'gradient'
                ? theme.primary + '40'
                : theme.tone1 + '30',
          },
        ]}>
        <Text
          style={[
            pickerStyles.insightTitle,
            {
              color: theme.themeType === 'gradient' ? theme.primary : theme.tone1,
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
      </View>
    );

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
              Select your visual identity — applies app-wide
            </Text>
          </View>
          <View
            style={[
              pickerStyles.activePill,
              {
                backgroundColor:
                  activeTheme.themeType === 'gradient'
                    ? activeTheme.primary
                    : activeTheme.tone1,
              },
            ]}>
            <Text
              style={[pickerStyles.activePillText, { fontSize: fs(10) }]}>
              {activeTheme.label}
            </Text>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 1 — EXECUTIVE PALETTE (Gradient themes)
        ═══════════════════════════════════════════════════════════ */}
        <Text style={[pickerStyles.sectionLabel, { color: colors.textMuted }]}>
          EXECUTIVE PALETTE
        </Text>
        <Text
          style={[
            pickerStyles.sectionDesc,
            { color: colors.textMuted, fontSize: fs(11) },
          ]}>
          Psychology-tailored luxury gradients crafted for reading endurance & deep focus
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={pickerStyles.gradientRow}>
          {gradientThemes.map((t) => renderGradientCard(t))}
        </ScrollView>

        {/* Active gradient insight */}
        {activeTheme.themeType === 'gradient' && renderInsightCard(activeTheme)}

        {/* ═══════════════════════════════════════════════════════════
            SECTION 2 — LUXURY COLOR COMBOS (Two-tone themes)
        ═══════════════════════════════════════════════════════════ */}
        <View style={pickerStyles.sectionSep} />
        <Text
          style={[
            pickerStyles.sectionLabel,
            { color: colors.textMuted, marginTop: 4 },
          ]}>
          LUXURY COLOR COMBOS
        </Text>
        <Text
          style={[
            pickerStyles.sectionDesc,
            { color: colors.textMuted, fontSize: fs(11) },
          ]}>
          Curated two-tone pairings — both colors appear on every screen
        </Text>

        {/* All 5 two-tone themes in one scrollable row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={pickerStyles.featuredRow}>
          {featuredTwoTone.map((t) => renderTwoToneCard(t, 'featured'))}
        </ScrollView>

        {/* Active two-tone insight */}
        {activeTheme.themeType === 'two-tone' && renderInsightCard(activeTheme)}

      </View>
    );
  }
);

// ─── Card styles ──────────────────────────────────────────────────────────────
const cardStyles = StyleSheet.create({
  // Gradient cards
  gradientCard: {
    width: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 10,
  },
  gradientSwatchWrap: {
    height: 72,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientInfo: {
    padding: 8,
  },
  gradientLabel: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontWeight: '800',
  },
  gradientTagline: {
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans-Regular',
    marginTop: 2,
  },

  // Two-tone featured cards
  featuredCard: {
    width: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 10,
  },
  featuredSwatch: {
    flexDirection: 'row',
    height: 72,
  },
  featuredInfo: {
    padding: 8,
  },
  featuredLabel: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontWeight: '800',
  },
  featuredTagline2: {
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans-Regular',
    marginTop: 2,
  },

  // Two-tone compact cards
  compactCard: {
    width: '48%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
  },
  compactSwatch: {
    flexDirection: 'row',
    height: 48,
  },
  compactInfo: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  compactLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
  },

  // Shared
  swatchHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0B0B0C',
    lineHeight: 13,
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
    maxWidth: 200,
  },
  activePill: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: 110,
    alignSelf: 'flex-start',
  },
  activePillText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Section headers
  sectionLabel: {
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontWeight: '800',
    letterSpacing: 1.0,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Regular',
    lineHeight: 16,
    marginBottom: 12,
  },
  sectionSep: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 20,
  },

  // Rows / grids
  gradientRow: {
    flexDirection: 'row',
    paddingRight: 4,
    paddingBottom: 4,
    marginBottom: 12,
  },
  featuredRow: {
    flexDirection: 'row',
    paddingRight: 4,
    paddingBottom: 4,
    marginBottom: 12,
  },
  compactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },

  // Insight card
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
});
