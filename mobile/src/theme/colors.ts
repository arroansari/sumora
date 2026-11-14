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
// DARK THEME — Option 1: Dark Premium Editorial (Exact match to prototype screenshot)
// Pitch noir base, radiant purple/violet CTAs, smoky glass cards with white-to-black radiant borders
// ─────────────────────────────────────────────────────────────────────────────
export const darkColors = {
  // Foundations: Pitch noir charcoal
  background: '#0D0E12',
  surface: '#15161C',
  surfaceSubtle: '#1E1F26',
  surfaceHighlight: '#282932',

  // Text: Luminous white & crisp neutral gray
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',

  // Brand: Vibrant Radiant Purple / Violet from the screenshot (NO YELLOW CTAs!)
  primary: '#8B5CF6',       // Vibrant violet for all primary CTAs
  primaryDark: '#7C3AED',   // Pressed / deep violet
  primaryLight: '#A78BFA',  // Soft violet tint
  secondary: '#C084FC',     // Accent fuchsia / lavender
  accent: '#A855F7',        // Highlights / sparkles

  // UI: Radiant borders with white highlight on top
  border: 'rgba(255, 255, 255, 0.12)',
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  card: '#15161C',
  tint: '#8B5CF6',
  tabBar: '#0A0B0E',

  // Status
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.18)',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.18)',
  danger: '#EF4444',
  dangerBg: 'rgba(239, 68, 68, 0.18)',

  // Badge
  badgeBg: '#7C3AED',
  badgeText: '#FFFFFF',

  // Gradients
  gradientStart: '#8B5CF6',
  gradientEnd: '#C026D3',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.75)',
};

export type ThemeColors = typeof lightColors;

