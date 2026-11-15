import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { AppThemeOption } from '../../theme/appThemes';
import { ThemeColors } from '../../theme/colors';

interface ThemeSwatchPickerProps {
  themes: AppThemeOption[];
  activeThemeId: string;
  onSelectTheme: (id: AppThemeOption['id']) => void;
  colors: ThemeColors;
}

export const ThemeSwatchPicker: React.FC<ThemeSwatchPickerProps> = React.memo(
  ({ themes, activeThemeId, onSelectTheme, colors }) => {
    return (
      <View style={styles.wrapper}>
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
          Colour Theme
        </Text>
        <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
          Applies instantly across the entire app
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
                  styles.swatchWrap,
                  isActive && {
                    borderColor: theme.primary,
                    borderWidth: 2.5,
                    shadowColor: theme.primary,
                    shadowOpacity: 0.5,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 6,
                  },
                ]}>
                {/* Gradient swatch: two-layer approach */}
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: theme.gradientStart },
                  ]}>
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: theme.gradientEnd,
                        opacity: 0.55,
                        borderRadius: 12,
                      },
                    ]}
                  />
                  {isActive && (
                    <View style={styles.checkCircle}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.swatchLabel,
                    { color: isActive ? theme.primary : colors.textSecondary },
                    isActive && styles.swatchLabelActive,
                  ]}
                  numberOfLines={2}>
                  {theme.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 4,
    paddingBottom: 2,
  },
  sectionLabel: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 12,
    marginBottom: 14,
    lineHeight: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 4,
  },
  swatchWrap: {
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 2,
  },
  swatch: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111',
    lineHeight: 16,
  },
  swatchLabel: {
    fontSize: 10.5,
    textAlign: 'center',
    maxWidth: 60,
    lineHeight: 13,
  },
  swatchLabelActive: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
  },
});
