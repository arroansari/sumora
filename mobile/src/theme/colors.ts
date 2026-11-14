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
  background: palette.offWhite,
  surface: palette.surface,
  surfaceSubtle: palette.surfaceSubtle,
  surfaceHighlight: palette.surfaceHighlight,

  // Text
  textPrimary: palette.textPrimary,
  textSecondary: palette.textSecondary,
  textMuted: palette.textMuted,

  // Brand
  primary: palette.primaryVibrant,
  primaryDark: palette.primaryVibrantDark,
  primaryLight: palette.primaryVibrantLight,
  secondary: palette.accentElectric,
  accent: palette.accentPurple,

  // UI
  border: palette.border,
  borderSubtle: palette.borderSubtle,
  card: palette.surface,
  tint: palette.primaryVibrant,
  tabBar: palette.surface,

  // Status
  success: palette.success,
  successBg: palette.successBg,
  warning: palette.warning,
  warningBg: palette.warningBg,
  danger: palette.danger,
  dangerBg: palette.dangerBg,

  // Badge
  badgeBg: '#EDE9FF',
  badgeText: palette.primaryVibrant,

  // Gradients (used as reference by components)
  gradientStart: '#6C47FF',
  gradientEnd: '#00C2FF',

  // Overlay
  overlay: 'rgba(13, 4, 77, 0.45)',
};

// ─────────────────────────────────────────────────────────────────────────────
// DARK THEME — Option 1: Dark Premium Editorial
// Near-black base, gold accents, luminous white typography, editorial luxury
// ─────────────────────────────────────────────────────────────────────────────
export const darkColors = {
  // Foundations
  background: palette.darkBase,
  surface: palette.darkSurface,
  surfaceSubtle: palette.darkSurfaceSubtle,
  surfaceHighlight: palette.darkSurfaceHighlight,

  // Text
  textPrimary: palette.darkTextPrimary,
  textSecondary: palette.darkTextSecondary,
  textMuted: palette.darkTextMuted,

  // Brand (gold for dark premium)
  primary: palette.gold,
  primaryDark: palette.goldDim,
  primaryLight: palette.goldSoft,
  secondary: palette.accentElectric,
  accent: palette.accentPurple,

  // UI
  border: palette.darkBorder,
  borderSubtle: palette.darkBorderSubtle,
  card: palette.darkSurface,
  tint: palette.gold,
  tabBar: palette.darkSurface,

  // Status
  success: '#34D399',
  successBg: '#064E3B',
  warning: '#FBBF24',
  warningBg: '#451A03',
  danger: '#F87171',
  dangerBg: '#7F1D1D',

  // Badge
  badgeBg: '#2E1A47',
  badgeText: palette.gold,

  // Gradients
  gradientStart: '#D4AF37',
  gradientEnd: '#A07820',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.65)',
};

export type ThemeColors = typeof lightColors;

