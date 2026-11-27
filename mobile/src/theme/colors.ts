// ─────────────────────────────────────────────────────────────────────────────
// LIGHT MODE — Option 3: Vibrant Modern Intelligence
// Violet-to-indigo gradient identity, vivid electric-blue accents, clean whites
// ─────────────────────────────────────────────────────────────────────────────
export const palette = {
  // Light brand
  primaryVibrant: '#6C47FF',       // Deep violet – primary CTA
  primaryVibrantDark: '#4F28E8',   // Pressed state
  primaryVibrantLight: '#A78BFA',  // Soft tint / badge background
  accentElectric: '#00C2FF',       // Electric cyan accent
  accentPurple: '#8B5CF6',         // Supporting purple

  // Status
  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',

  // Neutrals (light)
  white: '#FFFFFF',
  offWhite: '#F7F6FF',   // Very subtle violet tint
  surface: '#FFFFFF',
  surfaceSubtle: '#F0EEFF',   // Slight violet wash
  surfaceHighlight: '#E9E5FF',
  border: '#DDD8FF',
  borderSubtle: '#EDE9FF',
  textPrimary: '#13004D',    // Deep violet-tinted dark
  textSecondary: '#5B5680',  // Muted violet-grey
  textMuted: '#9E9AB8',

  // Dark brand
  darkBase: '#070412',       // Near-black with violet undertone
  darkSurface: '#110C2A',    // Rich dark card
  darkSurfaceSubtle: '#1A1136',
  darkSurfaceHighlight: '#221845',
  darkBorder: '#2E2057',
  darkBorderSubtle: '#1E154A',
  darkTextPrimary: '#F0ECFF',
  darkTextSecondary: '#9B8FC0',
  darkTextMuted: '#5E5480',

  // Dark gold accent
  gold: '#D4AF37',
  goldSoft: '#F5E6A3',
  goldDim: '#7A6520',
};

// ─────────────────────────────────────────────────────────────────────────────
// LIGHT THEME — Vibrant Modern Intelligence
// ─────────────────────────────────────────────────────────────────────────────
export const lightColors = {
  // Foundations
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSubtle: '#F5F5F5',
  surfaceHighlight: '#EBEBEB',

  // Text
  textPrimary: '#13004D',
  textSecondary: '#5B5680',
  textMuted: '#9E9AB8',

  // Brand (overridden by buildLightColors)
  primary: '#6C47FF',
  primaryDark: '#4F28E8',
  primaryLight: '#A78BFA',
  secondary: '#8B5CF6',
  accent: '#00C2FF',

  // UI
  border: '#DDD8FF',
  borderSubtle: '#EDE9FF',
  card: '#FFFFFF',
  tint: '#6C47FF',
  tabBar: '#FFFFFF',

  // Status
  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  danger: '#EF4444',
  dangerBg: '#FEE2E2',

  // Badge
  badgeBg: '#EDE9FF',
  badgeText: '#6C47FF',

  // Gradients
  gradientStart: '#6C47FF',
  gradientEnd: '#4338CA',

  // Overlay
  overlay: 'rgba(0,0,0,0.45)',

  // ── Two-tone structural tokens (overridden by buildLightColors) ──
  tone1: '#6C47FF',       // Dark structural color (headers, sidebars, dark sections)
  tone2: '#FAF8FF',       // Light structural color (content bg, light cards)
  onTone1: '#FFFFFF',     // Text/icons on tone1 background
  onTone2: '#6C47FF',     // Text/icons on tone2 background
  sectionDark: '#6C47FF', // Use for dark-section backgrounds
  sectionLight: '#FAF8FF',// Use for light-section backgrounds
};

// ─────────────────────────────────────────────────────────────────────────────
// DARK THEME — Option 1: Dark Premium Editorial
// Pitch noir base, radiant purple/violet CTAs, smoky glass cards
// ─────────────────────────────────────────────────────────────────────────────
export const darkColors = {
  // Foundations
  background: '#0B0B0C',
  surface: '#161617',
  surfaceSubtle: '#202021',
  surfaceHighlight: '#2A2A2B',

  // Text
  textPrimary: '#F5F5F5',
  textSecondary: '#9A9A9B',
  textMuted: '#606061',

  // Brand (overridden by buildDarkColors)
  primary: '#E0E0E0',
  primaryDark: '#C0C0C0',
  primaryLight: '#F0F0F0',
  secondary: '#A0A0A0',
  accent: '#E0E0E0',

  // UI
  border: 'rgba(255,255,255,0.12)',
  borderSubtle: 'rgba(255,255,255,0.06)',
  card: '#161617',
  tint: '#E0E0E0',
  tabBar: '#0B0B0C',

  // Status
  success: '#10B981',
  successBg: 'rgba(16,185,129,0.18)',
  warning: '#F59E0B',
  warningBg: 'rgba(245,158,11,0.18)',
  danger: '#EF4444',
  dangerBg: 'rgba(239,68,68,0.18)',

  // Badge
  badgeBg: '#2A2A2B',
  badgeText: '#E0E0E0',

  // Gradients
  gradientStart: '#161617',
  gradientEnd: '#2A2A2B',

  // Overlay
  overlay: 'rgba(0,0,0,0.75)',

  // ── Two-tone structural tokens ──
  tone1: '#0B0B0C',
  tone2: '#FFFFFF',
  onTone1: '#FFFFFF',
  onTone2: '#0B0B0C',
  sectionDark: '#0B0B0C',
  sectionLight: '#161617',
};

export type ThemeColors = typeof lightColors;

// ─────────────────────────────────────────────────────────────────────────────
// THEME-AWARE COLOR FACTORY
// ─────────────────────────────────────────────────────────────────────────────
import type { AppThemeOption } from './appThemes';

export function buildLightColors(theme: AppThemeOption): ThemeColors {
  // gradient themes keep the original palette text colors (violet-tinted)
  // two-tone themes override text to use their dark tone1 color
  const textOverrides = theme.themeType === 'two-tone'
    ? {
        textPrimary:   theme.tone1,
        textSecondary: theme.tone1 + 'AA',
        textMuted:     theme.tone1 + '66',
      }
    : {
        // Keep the original vivid violet palette text for gradient themes
        textPrimary:   palette.textPrimary,
        textSecondary: palette.textSecondary,
        textMuted:     palette.textMuted,
      };

  return {
    ...lightColors,
    background:    theme.lightBackground || theme.tone2 || lightColors.background,
    surfaceSubtle: theme.lightSurfaceSubtle || lightColors.surfaceSubtle,
    border:        theme.lightBorder || lightColors.border,
    borderSubtle:  theme.lightBorder ? theme.lightBorder + '80' : lightColors.borderSubtle,
    primary:      theme.primary,
    primaryDark:  theme.primaryDark,
    primaryLight: theme.primaryLight,
    secondary:    theme.secondary,
    accent:       theme.accent,
    tint:         theme.primary,
    badgeBg:      theme.badgeBg,
    badgeText:    theme.badgeText,
    gradientStart: theme.gradientStart,
    gradientEnd:   theme.gradientEnd,
    // ── Two-tone structural tokens ──────────────────────────
    tone1:        theme.tone1,
    tone2:        theme.tone2,
    onTone1:      '#FFFFFF',
    onTone2:      theme.tone1,
    sectionDark:  theme.tone1,
    sectionLight: theme.tone2 || theme.lightBackground || '#FFFFFF',
    ...textOverrides,
  };
}

export function buildDarkColors(theme: AppThemeOption): ThemeColors {
  return {
    ...darkColors,
    background:    theme.darkBackground || darkColors.background,
    surface:       theme.darkSurface || darkColors.surface,
    surfaceSubtle: theme.darkSurfaceSubtle || darkColors.surfaceSubtle,
    card:          theme.darkSurface || darkColors.card,
    border:        theme.darkBorder || darkColors.border,
    borderSubtle:  theme.darkBorder ? theme.darkBorder + '80' : darkColors.borderSubtle,
    tabBar:        theme.darkBackground || darkColors.tabBar,
    primary:       theme.id === 'charcoal_gold' ? theme.primary : (theme.primaryLight || theme.primary),
    primaryDark:   theme.primaryDark,
    primaryLight:  theme.primaryLight,
    secondary:     theme.secondary,
    accent:        theme.accent,
    tint:          theme.primary,
    badgeBg:       theme.tone1 + '44',
    badgeText:     theme.id === 'charcoal_gold' ? theme.primary : (theme.primaryLight || '#FFFFFF'),
    gradientStart: theme.gradientStart,
    gradientEnd:   theme.gradientEnd,
    // ── Two-tone structural tokens ──────────────────────────
    tone1:        theme.tone1,
    tone2:        theme.tone2,
    onTone1:      '#FFFFFF',
    onTone2:      theme.tone1,
    sectionDark:  theme.darkBackground || theme.tone1,
    sectionLight: theme.darkSurface || '#161617',
  };
}
