import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
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
    const fs = (size: number) => Math.round(size * textScale);
    const lh = (height: number) => Math.round(height * textScale);

    const activeTheme = useMemo(
      () => themes.find((t) => t.id === activeThemeId) || themes[0],
      [themes, activeThemeId]
    );

    return (
      <View style={styles.wrapper}>
        <View style={styles.headerRow}>
          <Text style={[styles.sectionLabel, { color: colors.textPrimary, fontSize: fs(16) }]}>
            Executive Palette
          </Text>
          <View style={[styles.activePill, { backgroundColor: activeTheme.primary + '18' }]}>
            <Text style={[styles.activePillText, { color: activeTheme.primary, fontSize: fs(11.5) }]}>
              {activeTheme.label}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionSub, { color: colors.textMuted, fontSize: fs(12), lineHeight: lh(17) }]}>
          Psychology-tailored luxury gradients crafted for reading endurance & deep focus
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}>
          {themes.map((theme) => {
            const isActive = theme.id === activeThemeId;
            return (
              <TouchableOpacity
                key={theme.id}
                onPress={() => onSelectTheme(theme.id)}
                activeOpacity={0.8}
                style={[
                  styles.swatchCard,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: isActive ? theme.primary : colors.border,
                  },
                  isActive && {
                    borderWidth: 2,
                    shadowColor: theme.primary,
                    shadowOpacity: 0.35,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 5,
                  },
                ]}>
                {/* Real 3-stop diagonal gradient from theme asset */}
                <View style={styles.swatch}>
                  <Image
                    source={theme.assets.swatch}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                  {isActive && (
                    <View style={styles.checkCircle}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardInfo}>
                  <Text
                    style={[
                      styles.swatchTitle,
                      { color: isActive ? theme.primary : colors.textPrimary, fontSize: fs(11.5) },
                      isActive && styles.swatchTitleActive,
                    ]}
                    numberOfLines={1}>
                    {theme.label}
                  </Text>
                  <Text
                    style={[styles.swatchTagline, { color: colors.textMuted, fontSize: fs(9.5) }]}
                    numberOfLines={1}>
                    {theme.tagline}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Psychological Insight Card for Active Selection */}
        {activeTheme && (
          <View
            style={[
              styles.psychologyBox,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.border,
                borderLeftColor: activeTheme.primary,
              },
            ]}>
            <View style={styles.psychologyHeader}>
              <Text style={styles.psychologyIcon}>✦</Text>
              <Text style={[styles.psychologyTitle, { color: activeTheme.primary, fontSize: fs(12.5) }]}>
                {activeTheme.tagline}
              </Text>
            </View>
            <Text style={[styles.psychologyDesc, { color: colors.textSecondary, fontSize: fs(11.5), lineHeight: lh(17) }]}>
              {activeTheme.psychology}
            </Text>
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 2,
    paddingBottom: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
  },
  activePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activePillText: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
  },
  sectionSub: {
    fontSize: 12,
    marginBottom: 14,
    lineHeight: 17,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 6,
    paddingBottom: 4,
  },
  swatchCard: {
    width: 108,
    borderRadius: 16,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1.2,
  },
  swatch: {
    width: 90,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  checkMark: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 14,
  },
  cardInfo: {
    alignItems: 'center',
    width: '100%',
  },
  swatchTitle: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  swatchTitleActive: {
    fontWeight: '800',
  },
  swatchTagline: {
    fontSize: 9.5,
    fontFamily: 'PlusJakartaSans-Medium',
    textAlign: 'center',
  },
  psychologyBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 3.5,
  },
  psychologyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  psychologyIcon: {
    fontSize: 12,
    color: '#F59E0B',
  },
  psychologyTitle: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  psychologyDesc: {
    fontSize: 11.5,
    lineHeight: 17,
    fontFamily: 'PlusJakartaSans-Regular',
  },
});
