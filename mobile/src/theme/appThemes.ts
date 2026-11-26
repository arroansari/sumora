// ─────────────────────────────────────────────────────────────────────────────
// SUMORA — Premium Theme System
//
// Section 1: 6 Executive Gradient themes (images, default = royal_amethyst)
// Section 2: 14 Premium Two-Tone themes (solid tone1 + tone2)
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
  // ── Two-tone themes ───────────────────────────────────────────────────
  | 'midnight_classic'
  | 'royal_contrast'
  | 'forest_luxury'
  | 'charcoal_gold'
  | 'modern_graphite'
  | 'burgundy_elegance'
  | 'ocean_prestige'
  | 'royal_purple'
  | 'chocolate_luxury'
  | 'slate_cloud'
  | 'cobalt_white'
  | 'olive_linen'
  | 'deep_blue_sand'
  | 'wine_pearl'
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

  // 9. FOREST LUXURY
  {
    id: 'forest_luxury',
    label: 'Forest Luxury',
    tagline: 'Fresh, trustworthy',
    psychology: 'Deep forest emerald is the colour of nature, growth and reliability. White amplifies it with clarity and freshness — a premium palette that feels alive yet professional.',
    themeType: 'two-tone',
    tone1: '#0F5C45',
    tone2: '#FFFFFF',
    gradientStart: '#0F5C45', gradientMid: '#187055', gradientEnd: '#228566',
    assets: NULL_ASSETS,
    primary:      '#0F5C45',
    primaryDark:  '#093D2E',
    primaryLight: '#1A8060',
    secondary:    '#187055',
    accent:       '#0F5C45',
    badgeBg:      '#D6EDE6',
    badgeText:    '#0F5C45',
    tint:         '#0F5C45',
    darkBackground:    '#040F0B',
    darkSurface:       '#081810',
    darkSurfaceSubtle: '#0C2118',
    darkBorder:        'rgba(255,255,255,0.10)',
    lightBackground:    '#FFFFFF',
    lightSurfaceSubtle: '#F0FAF6',
    lightBorder:        '#C0DFD4',
  },

  // 10. CHARCOAL & GOLD
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

  // 13. OCEAN PRESTIGE
  {
    id: 'ocean_prestige',
    label: 'Ocean Prestige',
    tagline: 'Calm, premium',
    psychology: 'Deep teal carries the expansive calm of deep ocean water — trustworthy, premium and composed. Snow white gives it air and elegance. This combination feels both authoritative and serene.',
    themeType: 'two-tone',
    tone1: '#123C46',
    tone2: '#FFFFFF',
    gradientStart: '#123C46', gradientMid: '#1A5060', gradientEnd: '#22647A',
    assets: NULL_ASSETS,
    primary:      '#123C46',
    primaryDark:  '#0A262E',
    primaryLight: '#20627A',
    secondary:    '#1A5060',
    accent:       '#123C46',
    badgeBg:      '#CBE0E6',
    badgeText:    '#123C46',
    tint:         '#123C46',
    darkBackground:    '#040E11',
    darkSurface:       '#08181C',
    darkSurfaceSubtle: '#0C2228',
    darkBorder:        'rgba(255,255,255,0.10)',
    lightBackground:    '#FFFFFF',
    lightSurfaceSubtle: '#EDF5F7',
    lightBorder:        '#B0D4DC',
  },

  // 14. ROYAL PURPLE
  {
    id: 'royal_purple',
    label: 'Royal Purple',
    tagline: 'Creative, exclusive',
    psychology: 'Deep purple has historically been reserved for royalty — it signals rarity, creativity and exclusivity. Soft white balances the drama, keeping the palette elevated rather than heavy.',
    themeType: 'two-tone',
    tone1: '#40245F',
    tone2: '#FAF8FF',
    gradientStart: '#40245F', gradientMid: '#542E7E', gradientEnd: '#6A3A9C',
    assets: NULL_ASSETS,
    primary:      '#40245F',
    primaryDark:  '#2C1842',
    primaryLight: '#7E5CA6',
    secondary:    '#542E7E',
    accent:       '#40245F',
    badgeBg:      '#E8D8F8',
    badgeText:    '#40245F',
    tint:         '#40245F',
    darkBackground:    '#0D0618',
    darkSurface:       '#160A28',
    darkSurfaceSubtle: '#200F38',
    darkBorder:        'rgba(250,248,255,0.10)',
    lightBackground:    '#FAF8FF',
    lightSurfaceSubtle: '#F0EAFF',
    lightBorder:        '#D8CBEE',
  },

  // 15. CHOCOLATE LUXURY
  {
    id: 'chocolate_luxury',
    label: 'Chocolate Luxury',
    tagline: 'Warm, elegant',
    psychology: 'Dark chocolate brown evokes craftsmanship, artisanal quality and timeless comfort. Warm cream completes the picture with dessert-like indulgence — rich, inviting and premium.',
    themeType: 'two-tone',
    tone1: '#392820',
    tone2: '#F5EBDD',
    gradientStart: '#392820', gradientMid: '#4E372C', gradientEnd: '#634638',
    assets: NULL_ASSETS,
    primary:      '#392820',
    primaryDark:  '#241910',
    primaryLight: '#6E4A38',
    secondary:    '#4E372C',
    accent:       '#392820',
    badgeBg:      '#E8D8C8',
    badgeText:    '#392820',
    tint:         '#392820',
    darkBackground:    '#0E0A07',
    darkSurface:       '#180F0A',
    darkSurfaceSubtle: '#22150F',
    darkBorder:        'rgba(245,235,221,0.10)',
    lightBackground:    '#F5EBDD',
    lightSurfaceSubtle: '#EADECF',
    lightBorder:        '#D4C0A8',
  },

  // 16. SLATE & CLOUD
  {
    id: 'slate_cloud',
    label: 'Slate & Cloud',
    tagline: 'Minimal, modern',
    psychology: 'Slate blue-grey is the colour of digital sophistication — calm, focused and intelligent. Cloud white gives it lightness and openness. The pairing is clean enough for tech, warm enough for lifestyle.',
    themeType: 'two-tone',
    tone1: '#334155',
    tone2: '#F8FAFC',
    gradientStart: '#334155', gradientMid: '#475569', gradientEnd: '#5A6E84',
    assets: NULL_ASSETS,
    primary:      '#334155',
    primaryDark:  '#1E293B',
    primaryLight: '#64748B',
    secondary:    '#475569',
    accent:       '#334155',
    badgeBg:      '#E0E8F0',
    badgeText:    '#334155',
    tint:         '#334155',
    darkBackground:    '#0A0D12',
    darkSurface:       '#111620',
    darkSurfaceSubtle: '#181F2E',
    darkBorder:        'rgba(248,250,252,0.10)',
    lightBackground:    '#F8FAFC',
    lightSurfaceSubtle: '#EEF2F7',
    lightBorder:        '#CBD5E1',
  },

  // 17. COBALT & WHITE
  {
    id: 'cobalt_white',
    label: 'Cobalt & White',
    tagline: 'Confident, energetic',
    psychology: 'Cobalt blue is the colour of confidence, digital trust and global brands. Pure white gives it the clarity and energy of open sky. This combination is bold without being aggressive.',
    themeType: 'two-tone',
    tone1: '#1646A0',
    tone2: '#FFFFFF',
    gradientStart: '#1646A0', gradientMid: '#1D58C8', gradientEnd: '#246AF0',
    assets: NULL_ASSETS,
    primary:      '#1646A0',
    primaryDark:  '#0E2E6A',
    primaryLight: '#3A70D4',
    secondary:    '#1D58C8',
    accent:       '#1646A0',
    badgeBg:      '#D4E2F8',
    badgeText:    '#1646A0',
    tint:         '#1646A0',
    darkBackground:    '#040C22',
    darkSurface:       '#081436',
    darkSurfaceSubtle: '#0D1D4A',
    darkBorder:        'rgba(255,255,255,0.10)',
    lightBackground:    '#FFFFFF',
    lightSurfaceSubtle: '#EBF0FB',
    lightBorder:        '#B8CCEE',
  },

  // 18. OLIVE & LINEN
  {
    id: 'olive_linen',
    label: 'Olive & Linen',
    tagline: 'Natural, refined',
    psychology: 'Warm olive draws from nature, art and Mediterranean lifestyle — it is the most sophisticated earthy tone. Linen is the textile of quiet luxury. Together they project refined taste and calm confidence.',
    themeType: 'two-tone',
    tone1: '#596B35',
    tone2: '#F5F0E4',
    gradientStart: '#596B35', gradientMid: '#6E8542', gradientEnd: '#839F50',
    assets: NULL_ASSETS,
    primary:      '#596B35',
    primaryDark:  '#3E4C24',
    primaryLight: '#758E48',
    secondary:    '#6E8542',
    accent:       '#596B35',
    badgeBg:      '#E8EDD6',
    badgeText:    '#596B35',
    tint:         '#596B35',
    darkBackground:    '#0E1109',
    darkSurface:       '#171C0E',
    darkSurfaceSubtle: '#202814',
    darkBorder:        'rgba(245,240,228,0.10)',
    lightBackground:    '#F5F0E4',
    lightSurfaceSubtle: '#ECE6D6',
    lightBorder:        '#D4CCBA',
  },

  // 19. DEEP BLUE & SAND
  {
    id: 'deep_blue_sand',
    label: 'Deep Blue & Sand',
    tagline: 'Trustworthy, grounded, premium',
    psychology: 'Deep maritime blue anchors the composition with institutional trust. Sand recalls beach houses, fine linen and coastal elegance — it brings warmth and approachability to a potentially cold palette.',
    themeType: 'two-tone',
    tone1: '#19324D',
    tone2: '#EDE2CF',
    gradientStart: '#19324D', gradientMid: '#224468', gradientEnd: '#2B5880',
    assets: NULL_ASSETS,
    primary:      '#19324D',
    primaryDark:  '#102030',
    primaryLight: '#264870',
    secondary:    '#224468',
    accent:       '#19324D',
    badgeBg:      '#DDD4BF',
    badgeText:    '#19324D',
    tint:         '#19324D',
    darkBackground:    '#080F18',
    darkSurface:       '#101E2E',
    darkSurfaceSubtle: '#182B42',
    darkBorder:        'rgba(237,226,207,0.10)',
    lightBackground:    '#EDE2CF',
    lightSurfaceSubtle: '#E2D5BC',
    lightBorder:        '#C8BBA0',
  },

  // 20. WINE & PEARL
  {
    id: 'wine_pearl',
    label: 'Wine & Pearl',
    tagline: 'Elegant, distinctive, refined',
    psychology: 'Wine red carries the heritage of viniculture and high culture — deeper and more serious than burgundy. Pearl is the most luxurious of neutrals with subtle iridescent warmth. This combination projects cultivated taste.',
    themeType: 'two-tone',
    tone1: '#672A3B',
    tone2: '#F5F0F0',
    gradientStart: '#672A3B', gradientMid: '#803550', gradientEnd: '#994060',
    assets: NULL_ASSETS,
    primary:      '#672A3B',
    primaryDark:  '#481E28',
    primaryLight: '#8C4058',
    secondary:    '#803550',
    accent:       '#672A3B',
    badgeBg:      '#F0E0E4',
    badgeText:    '#672A3B',
    tint:         '#672A3B',
    darkBackground:    '#160A0E',
    darkSurface:       '#201018',
    darkSurfaceSubtle: '#2A1620',
    darkBorder:        'rgba(245,240,240,0.10)',
    lightBackground:    '#F5F0F0',
    lightSurfaceSubtle: '#EDE6E6',
    lightBorder:        '#D8CCCC',
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
  // Brand combos → closest two-tone match
  mossgrove:          'forest_luxury',
  tidewell:           'ocean_prestige',
  blackridge:         'midnight_classic',
};

export function getThemeById(id: AppThemeId | string): AppThemeOption {
  const resolved = LEGACY_MAP[id] ?? id;
  return APP_THEMES.find((t) => t.id === resolved) ?? APP_THEMES[0];
}
