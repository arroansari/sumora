export const palette = {
  primary: '#4F46E5', // Indigo primary
  primaryDark: '#3730A3',
  primaryLight: '#818CF8',
  secondary: '#0EA5E9', // Sky blue secondary
  secondaryDark: '#0284C7',
  accent: '#8B5CF6', // Purple accent
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  neutral100: '#FFFFFF',
  neutral200: '#F8FAFC', // Off-white
  neutral300: '#F1F5F9',
  neutral400: '#E2E8F0',
  neutral500: '#94A3B8',
  neutral600: '#64748B',
  neutral700: '#334155',
  neutral800: '#1E293B',
  neutral900: '#0F172A', // Dark charcoal
};

export const lightColors = {
  background: palette.neutral200,
  surface: palette.neutral100,
  surfaceSubtle: palette.neutral300,
  surfaceHighlight: palette.neutral300,
  textPrimary: palette.neutral900,
  textSecondary: palette.neutral600,
  textMuted: palette.neutral500,
  primary: palette.primary,
  secondary: palette.secondary,
  border: palette.neutral400,
  card: palette.neutral100,
  tint: palette.primary,
  tabBar: palette.neutral100,
  badgeBg: '#EEF2FF',
  badgeText: palette.primary,
};

export const darkColors = {
  background: palette.neutral900,
  surface: palette.neutral800,
  surfaceSubtle: '#182234',
  surfaceHighlight: '#1E293B',
  textPrimary: palette.neutral200,
  textSecondary: palette.neutral500,
  textMuted: palette.neutral600,
  primary: palette.primaryLight,
  secondary: palette.secondary,
  border: '#334155',
  card: palette.neutral800,
  tint: palette.primaryLight,
  tabBar: palette.neutral800,
  badgeBg: '#312E81',
  badgeText: palette.primaryLight,
};

export type ThemeColors = typeof lightColors;

