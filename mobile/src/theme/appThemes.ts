// ─────────────────────────────────────────────────────────────────────────────
// SUMORA — Multi-Theme System
// Each theme defines a gradient pair (start → end) and derives all UI tokens.
// ─────────────────────────────────────────────────────────────────────────────

export type AppThemeId =
  | 'royal_violet'
  | 'sunset_glow'
  | 'cyber_teal'
  | 'midnight_ocean'
  | 'neon_magenta'
  | 'onyx_slate';

export interface AppThemeOption {
  id: AppThemeId;
  label: string;
  gradientStart: string;
  gradientEnd: string;
  /** Derived UI tokens (same shape as lightColors / darkColors) */
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
  tint: string;
  /** Header gradient colours as CSS-compatible strings */
  headerGradientStart: string;
  headerGradientEnd: string;
}

export const APP_THEMES: AppThemeOption[] = [
  {
    id: 'royal_violet',
    label: 'Royal Violet',
    gradientStart: '#5B21B6',
    gradientEnd: '#2563EB',
    primary: '#6C47FF',
    primaryDark: '#4F28E8',
    primaryLight: '#A78BFA',
    secondary: '#2563EB',
    accent: '#8B5CF6',
    badgeBg: '#EDE9FF',
    badgeText: '#6C47FF',
    tint: '#6C47FF',
    headerGradientStart: '#5B21B6',
    headerGradientEnd: '#2563EB',
  },
  {
    id: 'sunset_glow',
    label: 'Sunset Glow',
    gradientStart: '#E11D48',
    gradientEnd: '#F97316',
    primary: '#E11D48',
    primaryDark: '#BE123C',
    primaryLight: '#FDA4AF',
    secondary: '#F97316',
    accent: '#FB7185',
    badgeBg: '#FFE4E6',
    badgeText: '#E11D48',
    tint: '#E11D48',
    headerGradientStart: '#E11D48',
    headerGradientEnd: '#F97316',
  },
  {
    id: 'cyber_teal',
    label: 'Cyber Teal',
    gradientStart: '#0D9488',
    gradientEnd: '#0284C7',
    primary: '#0D9488',
    primaryDark: '#0F766E',
    primaryLight: '#5EEAD4',
    secondary: '#0284C7',
    accent: '#06B6D4',
    badgeBg: '#CCFBF1',
    badgeText: '#0D9488',
    tint: '#0D9488',
    headerGradientStart: '#0D9488',
    headerGradientEnd: '#0284C7',
  },
  {
    id: 'midnight_ocean',
    label: 'Midnight Ocean',
    gradientStart: '#1E1B4B',
    gradientEnd: '#3B82F6',
    primary: '#3B82F6',
    primaryDark: '#1D4ED8',
    primaryLight: '#93C5FD',
    secondary: '#6366F1',
    accent: '#818CF8',
    badgeBg: '#EEF2FF',
    badgeText: '#3B82F6',
    tint: '#3B82F6',
    headerGradientStart: '#1E1B4B',
    headerGradientEnd: '#3B82F6',
  },
  {
    id: 'neon_magenta',
    label: 'Neon Magenta',
    gradientStart: '#9333EA',
    gradientEnd: '#EC4899',
    primary: '#9333EA',
    primaryDark: '#7E22CE',
    primaryLight: '#D8B4FE',
    secondary: '#EC4899',
    accent: '#C026D3',
    badgeBg: '#FAE8FF',
    badgeText: '#9333EA',
    tint: '#9333EA',
    headerGradientStart: '#9333EA',
    headerGradientEnd: '#EC4899',
  },
  {
    id: 'onyx_slate',
    label: 'Onyx Slate',
    gradientStart: '#1E293B',
    gradientEnd: '#475569',
    primary: '#475569',
    primaryDark: '#334155',
    primaryLight: '#94A3B8',
    secondary: '#64748B',
    accent: '#6B7280',
    badgeBg: '#F1F5F9',
    badgeText: '#475569',
    tint: '#475569',
    headerGradientStart: '#1E293B',
    headerGradientEnd: '#475569',
  },
];

export const DEFAULT_THEME_ID: AppThemeId = 'royal_violet';

export function getThemeById(id: AppThemeId): AppThemeOption {
  return APP_THEMES.find((t) => t.id === id) ?? APP_THEMES[0];
}

