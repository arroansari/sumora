// ─────────────────────────────────────────────────────────────────────────────
// SUMORA — Premium Theme System
//
// Section 1: 6 Executive Gradient themes (images, default = royal_amethyst)
// Section 2: 5 Luxury Two-Tone themes (solid tone1 + tone2)
//
// Design rules:
//   gradient themes  → header/button/swatch images, textPrimary = palette.textPrimary
//   two-tone themes  → NULL_ASSETS, textPrimary = tone1
// ─────────────────────────────────────────────────────────────────────────────

import { ImageSourcePropType } from 'react-native';

// ── Gradient image imports ───────────────────────────────────────────────────
import headerRoyalAmethyst    from '../assets/images/themes/header_royal_amethyst.png';
import buttonRoyalAmethyst    from '../assets/images/themes/button_royal_amethyst.png';
import swatchRoyalAmethyst    from '../assets/images/themes/swatch_royal_amethyst.png';
import headerEmeraldPrestige  from '../assets/images/themes/header_emerald_prestige.png';
import buttonEmeraldPrestige  from '../assets/images/themes/button_emerald_prestige.png';
import swatchEmeraldPrestige  from '../assets/images/themes/swatch_emerald_prestige.png';
import headerSunsetCashmere   from '../assets/images/themes/header_sunset_cashmere.png';
import buttonSunsetCashmere   from '../assets/images/themes/button_sunset_cashmere.png';
import swatchSunsetCashmere   from '../assets/images/themes/swatch_sunset_cashmere.png';
import headerSapphireCelestial from '../assets/images/themes/header_sapphire_celestial.png';
import buttonSapphireCelestial from '../assets/images/themes/button_sapphire_celestial.png';
import swatchSapphireCelestial from '../assets/images/themes/swatch_sapphire_celestial.png';
import headerVelvetOrchid     from '../assets/images/themes/header_velvet_orchid.png';
import buttonVelvetOrchid     from '../assets/images/themes/button_velvet_orchid.png';
import swatchVelvetOrchid     from '../assets/images/themes/swatch_velvet_orchid.png';
import headerChampagneGold    from '../assets/images/themes/header_champagne_gold.png';
import buttonChampagneGold    from '../assets/images/themes/button_champagne_gold.png';
import swatchChampagneGold    from '../assets/images/themes/swatch_champagne_gold.png';

// ── Type definitions ─────────────────────────────────────────────────────────
export type AppThemeId =
  // ── Gradient themes ──────────────────────────────────────────────────
  | 'royal_amethyst'
  | 'emerald_prestige'
  | 'sunset_cashmere'
  | 'sapphire_celestial'
  | 'velvet_orchid'
  | 'champagne_gold'
  // ── Two-tone themes (5 luxury picks) ─────────────────────────────────
  | 'midnight_classic'
  | 'royal_contrast'
  | 'charcoal_gold'
  | 'burgundy_elegance'
  | 'modern_graphite'
  // ── Legacy aliases ────────────────────────────────────────────────────
  | 'mossgrove'
  | 'tidewell'
  | 'blackridge'
  | 'royal_violet'
  | 'sunset_glow'
  | 'cyber_teal'
  | 'midnight_ocean'
  | 'neon_magenta'
  | 'onyx_slate';

export interface AppThemeOption {
  id: AppThemeId;
  label: string;
  tagline: string;
  psychology: string;

  /** 'gradient' = uses image assets; 'two-tone' = solid tone1+tone2 surfaces */
  themeType: 'gradient' | 'two-tone';

  // ── Structural colors ────────────────────────────────────────────────
  tone1: string;   // Dark structural (headers, dark sections)
  tone2: string;   // Light structural (content bg, light sections)

  // ── Gradient references ──────────────────────────────────────────────
  gradientStart: string;
  gradientMid:   string;
  gradientEnd:   string;

  // ── Image assets (null for two-tone) ───────────────────────────────
  assets: {
    header: ImageSourcePropType | null;
    button: ImageSourcePropType | null;
    swatch: ImageSourcePropType | null;
  };

  // ── CTA / interactive tokens ─────────────────────────────────────────
  primary:      string;
  primaryDark:  string;
  primaryLight: string;
  secondary:    string;
  accent:       string;
  badgeBg:      string;
  badgeText:    string;
  tint:         string;

  // ── Dark-mode surface tokens ─────────────────────────────────────────
  darkBackground:    string;
  darkSurface:       string;
  darkSurfaceSubtle: string;
  darkBorder:        string;

  // ── Light-mode surface tokens ────────────────────────────────────────
  lightBackground:    string;
  lightSurfaceSubtle: string;
  lightBorder:        string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const NULL_ASSETS = { header: null, button: null, swatch: null } as const;

// ─────────────────────────────────────────────────────────────────────────────
// APP_THEMES — Gradient themes FIRST, then two-tone
// ─────────────────────────────────────────────────────────────────────────────
export const APP_THEMES: AppThemeOption[] = [

  // ═══════════════════════════════════════════════════════════════
  // GRADIENT THEMES  (1 — 6)
  // ═══════════════════════════════════════════════════════════════

  // 1. ROYAL AMETHYST
  {
    id: 'royal_amethyst',
    label: 'Royal Amethyst',
    tagline: 'Nobility & Deep Intellect',
    psychology: 'Rich royal violet into radiant cobalt azure. Inspires intellectual curiosity and premium editorial authority.',
    themeType: 'gradient',
    tone1: '#6D28D9',
    tone2: '#FAF8FF',
    gradientStart: '#6D28D9', gradientMid: '#5B3FD0', gradientEnd: '#4338CA',
    assets: { header: headerRoyalAmethyst, button: buttonRoyalAmethyst, swatch: swatchRoyalAmethyst },
    primary:      '#6C47FF',
    primaryDark:  '#4F28E8',
    primaryLight: '#A78BFA',
    secondary:    '#8B5CF6',
    accent:       '#00C2FF',
    badgeBg:      '#EDE9FF',
    badgeText:    '#6C47FF',
    tint:         '#6C47FF',
    darkBackground:    '#070412',
    darkSurface:       '#110C2A',
    darkSurfaceSubtle: '#1A1136',
    darkBorder:        '#2E2057',
    lightBackground:    '#F7F6FF',
    lightSurfaceSubtle: '#F0EEFF',
    lightBorder:        '#DDD8FF',
  },

  // 2. EMERALD PRESTIGE
  {
    id: 'emerald_prestige',
    label: 'Emerald Prestige',
    tagline: 'Abundance & Calm Authority',
    psychology: 'Deep emerald green signals growth, stability and premium taste. Calm yet commanding — the colour of financial confidence.',
    themeType: 'gradient',
    tone1: '#059669',
    tone2: '#F5FAF7',
    gradientStart: '#059669', gradientMid: '#047857', gradientEnd: '#065F46',
    assets: { header: headerEmeraldPrestige, button: buttonEmeraldPrestige, swatch: swatchEmeraldPrestige },
    primary:      '#059669',
    primaryDark:  '#047857',
    primaryLight: '#34D399',
    secondary:    '#10B981',
    accent:       '#34D399',
    badgeBg:      '#D1FAE5',
    badgeText:    '#059669',
    tint:         '#059669',
    darkBackground:    '#011F14',
    darkSurface:       '#042E1F',
    darkSurfaceSubtle: '#073D2A',
    darkBorder:        '#0A5438',
    lightBackground:    '#F5FAF7',
    lightSurfaceSubtle: '#E8F5EE',
    lightBorder:        '#B6E7D1',
  },

  // 3. SUNSET CASHMERE
  {
    id: 'sunset_cashmere',
    label: 'Sunset Cashmere',
    tagline: 'Passion & Vital Energy',
    psychology: 'Warm rose-to-crimson gradient. Energising and emotionally resonant — perfect for content that sparks action and emotion.',
    themeType: 'gradient',
    tone1: '#E11D48',
    tone2: '#FFF8F9',
    gradientStart: '#E11D48', gradientMid: '#BE185D', gradientEnd: '#9D174D',
    assets: { header: headerSunsetCashmere, button: buttonSunsetCashmere, swatch: swatchSunsetCashmere },
    primary:      '#E11D48',
    primaryDark:  '#BE185D',
    primaryLight: '#FB7185',
    secondary:    '#F43F5E',
    accent:       '#FF6B8A',
    badgeBg:      '#FFE4E8',
    badgeText:    '#E11D48',
    tint:         '#E11D48',
    darkBackground:    '#1A010A',
    darkSurface:       '#280110',
    darkSurfaceSubtle: '#350218',
    darkBorder:        '#5C0427',
    lightBackground:    '#FFF8F9',
    lightSurfaceSubtle: '#FFECEF',
    lightBorder:        '#FFCCD5',
  },

  // 4. SAPPHIRE CELESTIAL
  {
    id: 'sapphire_celestial',
    label: 'Sapphire Celestial',
    tagline: 'Clarity & Cosmic Intelligence',
    psychology: 'Electric cobalt to deep navy. Projects trust, clarity and technological precision — the most credible of all palettes.',
    themeType: 'gradient',
    tone1: '#1D4ED8',
    tone2: '#F5F9FF',
    gradientStart: '#1D4ED8', gradientMid: '#1E40AF', gradientEnd: '#1E3A8A',
    assets: { header: headerSapphireCelestial, button: buttonSapphireCelestial, swatch: swatchSapphireCelestial },
    primary:      '#1D4ED8',
    primaryDark:  '#1E40AF',
    primaryLight: '#60A5FA',
    secondary:    '#3B82F6',
    accent:       '#7DD3FC',
    badgeBg:      '#DBEAFE',
    badgeText:    '#1D4ED8',
    tint:         '#1D4ED8',
    darkBackground:    '#010818',
    darkSurface:       '#020D27',
    darkSurfaceSubtle: '#041436',
    darkBorder:        '#0A2060',
    lightBackground:    '#F5F9FF',
    lightSurfaceSubtle: '#EBF3FF',
    lightBorder:        '#BFDBFE',
  },

  // 5. VELVET ORCHID
  {
    id: 'velvet_orchid',
    label: 'Velvet Orchid',
    tagline: 'Creative Mystique & Luxury',
    psychology: 'Deep purple orchid to magenta. Creative, exclusive and deeply evocative — signals originality and artistic premium.',
    themeType: 'gradient',
    tone1: '#9333EA',
    tone2: '#FAF5FF',
    gradientStart: '#9333EA', gradientMid: '#7C3AED', gradientEnd: '#6D28D9',
    assets: { header: headerVelvetOrchid, button: buttonVelvetOrchid, swatch: swatchVelvetOrchid },
    primary:      '#9333EA',
    primaryDark:  '#7C3AED',
    primaryLight: '#C084FC',
    secondary:    '#A855F7',
    accent:       '#E879F9',
    badgeBg:      '#F3E8FF',
    badgeText:    '#9333EA',
    tint:         '#9333EA',
    darkBackground:    '#0E0118',
    darkSurface:       '#170228',
    darkSurfaceSubtle: '#210336',
    darkBorder:        '#3D085E',
    lightBackground:    '#FAF5FF',
    lightSurfaceSubtle: '#F3E8FF',
    lightBorder:        '#DDD6FE',
  },

  // 6. CHAMPAGNE GOLD
  {
    id: 'champagne_gold',
    label: 'Champagne Gold',
    tagline: 'Luxe & Established Excellence',
    psychology: 'Warm amber to cognac gold. Timeless luxury — the colour of achievement, craftsmanship and tasteful excess.',
    themeType: 'gradient',
    tone1: '#D97706',
    tone2: '#FAF8F5',
    gradientStart: '#D97706', gradientMid: '#B45309', gradientEnd: '#92400E',
    assets: { header: headerChampagneGold, button: buttonChampagneGold, swatch: swatchChampagneGold },
    primary:      '#D97706',
    primaryDark:  '#B45309',
    primaryLight: '#FCD34D',
    secondary:    '#F59E0B',
    accent:       '#FDE68A',
    badgeBg:      '#FEF3C7',
    badgeText:    '#D97706',
    tint:         '#D97706',
    darkBackground:    '#1A0F00',
    darkSurface:       '#261700',
    darkSurfaceSubtle: '#321F00',
    darkBorder:        '#5C3A00',
    lightBackground:    '#FAF8F5',
    lightSurfaceSubtle: '#F5F0E5',
    lightBorder:        '#E8D9C0',
  },

  // ═══════════════════════════════════════════════════════════════
  // TWO-TONE THEMES  (7 — 20)
  // ═══════════════════════════════════════════════════════════════

  // 7. MIDNIGHT CLASSIC
  {
    id: 'midnight_classic',
    label: 'Midnight Classic',
    tagline: 'Timeless, premium',
    psychology: 'The original premium pairing. Jet black creates authority and drama; pure white brings clarity and breathing room. Zero ambiguity, maximum sophistication.',
    themeType: 'two-tone',
    tone1: '#0B0B0C',
    tone2: '#FFFFFF',
    gradientStart: '#0B0B0C', gradientMid: '#1A1A1B', gradientEnd: '#2A2A2B',
    assets: NULL_ASSETS,
    primary:      '#0B0B0C',
    primaryDark:  '#000000',
    primaryLight: '#3A3A3B',
    secondary:    '#333334',
    accent:       '#0B0B0C',
    badgeBg:      '#F0F0F0',
    badgeText:    '#0B0B0C',
    tint:         '#0B0B0C',
    darkBackground:    '#000000',
    darkSurface:       '#111111',
    darkSurfaceSubtle: '#1A1A1A',
    darkBorder:        'rgba(255,255,255,0.10)',
    lightBackground:    '#FFFFFF',
    lightSurfaceSubtle: '#F5F5F5',
    lightBorder:        '#E0E0E0',
  },

  // 8. ROYAL CONTRAST
  {
    id: 'royal_contrast',
    label: 'Royal Contrast',
    tagline: 'Professional, elegant',
    psychology: 'Ink navy projects institutional authority and calm expertise. Ivory softens the composition with warmth and approachability — the palette of old money and established brands.',
    themeType: 'two-tone',
    tone1: '#14213D',
    tone2: '#F8F5EC',
    gradientStart: '#14213D', gradientMid: '#1D2F56', gradientEnd: '#263D6E',
    assets: NULL_ASSETS,
    primary:      '#14213D',
    primaryDark:  '#0D1628',
    primaryLight: '#3A6090',
    secondary:    '#1D2F56',
    accent:       '#14213D',
    badgeBg:      '#E8E4D6',
    badgeText:    '#14213D',
    tint:         '#14213D',
    darkBackground:    '#070C18',
    darkSurface:       '#0E1526',
    darkSurfaceSubtle: '#151E34',
    darkBorder:        'rgba(248,245,236,0.10)',
    lightBackground:    '#F8F5EC',
    lightSurfaceSubtle: '#EEE9DC',
    lightBorder:        '#D8D0BC',
  },

  // 9. CHARCOAL & GOLD
  {
    id: 'charcoal_gold',
    label: 'Charcoal & Gold',
    tagline: 'Luxury, established',
    psychology: 'Jet charcoal with champagne gold accents is the definitive luxury combination. It reads as a premium brand regardless of context — polished, authoritative and exclusive.',
    themeType: 'two-tone',
    tone1: '#181818',
    tone2: '#E5C78B',
    gradientStart: '#181818', gradientMid: '#242424', gradientEnd: '#303030',
    assets: NULL_ASSETS,
    primary:      '#E5C78B',
    primaryDark:  '#C9A85A',
    primaryLight: '#F0D9A8',
    secondary:    '#D4AF37',
    accent:       '#E5C78B',
    badgeBg:      '#3A3310',
    badgeText:    '#E5C78B',
    tint:         '#E5C78B',
    darkBackground:    '#0A0A0A',
    darkSurface:       '#141414',
    darkSurfaceSubtle: '#1E1E1E',
    darkBorder:        'rgba(229,199,139,0.15)',
    lightBackground:    '#F5EDD8',
    lightSurfaceSubtle: '#EEE2C5',
    lightBorder:        '#D4AF6A',
  },

  // 11. MODERN GRAPHITE
  {
    id: 'modern_graphite',
    label: 'Modern Graphite',
    tagline: 'Sophisticated, balanced',
    psychology: 'Warm charcoal and pearl sit at the intersection of modern minimalism and understated luxury. It is the most versatile premium palette — never flashy, always polished.',
    themeType: 'two-tone',
    tone1: '#242424',
    tone2: '#F4F1EA',
    gradientStart: '#242424', gradientMid: '#323232', gradientEnd: '#404040',
    assets: NULL_ASSETS,
    primary:      '#242424',
    primaryDark:  '#141414',
    primaryLight: '#484848',
    secondary:    '#323232',
    accent:       '#242424',
    badgeBg:      '#E8E4DC',
    badgeText:    '#242424',
    tint:         '#242424',
    darkBackground:    '#0A0A0A',
    darkSurface:       '#141414',
    darkSurfaceSubtle: '#1E1E1E',
    darkBorder:        'rgba(244,241,234,0.10)',
    lightBackground:    '#F4F1EA',
    lightSurfaceSubtle: '#EAE6DC',
    lightBorder:        '#D0CBBF',
  },

  // 12. BURGUNDY ELEGANCE
  {
    id: 'burgundy_elegance',
    label: 'Burgundy Elegance',
    tagline: 'Rich, luxurious',
    psychology: 'Deep burgundy is viniculture and heritage — associated with ceremony, fine dining and established luxury. Cream softens the drama with warmth, creating a palette of quiet confidence.',
    themeType: 'two-tone',
    tone1: '#701C35',
    tone2: '#FFF4E8',
    gradientStart: '#701C35', gradientMid: '#882244', gradientEnd: '#A02852',
    assets: NULL_ASSETS,
    primary:      '#701C35',
    primaryDark:  '#501228',
    primaryLight: '#9E3055',
    secondary:    '#882244',
    accent:       '#701C35',
    badgeBg:      '#F4D8E0',
    badgeText:    '#701C35',
    tint:         '#701C35',
    darkBackground:    '#190007',
    darkSurface:       '#270010',
    darkSurfaceSubtle: '#350018',
    darkBorder:        'rgba(255,244,232,0.10)',
    lightBackground:    '#FFF4E8',
    lightSurfaceSubtle: '#FDE8D5',
    lightBorder:        '#F0CCBC',
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT — Royal Amethyst (the original default)
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_THEME_ID: AppThemeId = 'royal_amethyst';

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY ALIAS MAP  —  maps old IDs back to real IDs
// ─────────────────────────────────────────────────────────────────────────────
const LEGACY_MAP: Partial<Record<string, AppThemeId>> = {
  // Old gradient themes → their real gradient equivalents
  royal_violet:       'royal_amethyst',
  sunset_glow:        'sunset_cashmere',
  cyber_teal:         'emerald_prestige',
  midnight_ocean:     'sapphire_celestial',
  neon_magenta:       'velvet_orchid',
  onyx_slate:         'champagne_gold',
  // Old two-tone IDs → closest remaining luxury match
  mossgrove:          'midnight_classic',
  tidewell:           'royal_contrast',
  blackridge:         'midnight_classic',
  forest_luxury:      'royal_contrast',
  ocean_prestige:     'royal_contrast',
  royal_purple:       'burgundy_elegance',
  chocolate_luxury:   'burgundy_elegance',
  slate_cloud:        'modern_graphite',
  cobalt_white:       'royal_contrast',
  olive_linen:        'modern_graphite',
  deep_blue_sand:     'royal_contrast',
  wine_pearl:         'burgundy_elegance',
};

export function getThemeById(id: AppThemeId | string): AppThemeOption {
  const resolved = LEGACY_MAP[id] ?? id;
  return APP_THEMES.find((t) => t.id === resolved) ?? APP_THEMES[0];
}
