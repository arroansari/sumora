// ─────────────────────────────────────────────────────────────────────────────
// SUMORA — Luxury Psychology-Driven Multi-Theme System
// Each theme defines true 3-stop diagonal gradient assets, psychological framing,
// and complete WCAG-compliant UI color tokens for high customer retention.
// ─────────────────────────────────────────────────────────────────────────────

import { ImageSourcePropType } from 'react-native';

import headerRoyalAmethyst from '../assets/images/themes/header_royal_amethyst.png';
import buttonRoyalAmethyst from '../assets/images/themes/button_royal_amethyst.png';
import swatchRoyalAmethyst from '../assets/images/themes/swatch_royal_amethyst.png';

import headerChampagneGold from '../assets/images/themes/header_champagne_gold.png';
import buttonChampagneGold from '../assets/images/themes/button_champagne_gold.png';
import swatchChampagneGold from '../assets/images/themes/swatch_champagne_gold.png';

import headerEmeraldPrestige from '../assets/images/themes/header_emerald_prestige.png';
import buttonEmeraldPrestige from '../assets/images/themes/button_emerald_prestige.png';
import swatchEmeraldPrestige from '../assets/images/themes/swatch_emerald_prestige.png';

import headerSunsetCashmere from '../assets/images/themes/header_sunset_cashmere.png';
import buttonSunsetCashmere from '../assets/images/themes/button_sunset_cashmere.png';
import swatchSunsetCashmere from '../assets/images/themes/swatch_sunset_cashmere.png';

import headerSapphireCelestial from '../assets/images/themes/header_sapphire_celestial.png';
import buttonSapphireCelestial from '../assets/images/themes/button_sapphire_celestial.png';
import swatchSapphireCelestial from '../assets/images/themes/swatch_sapphire_celestial.png';

import headerVelvetOrchid from '../assets/images/themes/header_velvet_orchid.png';
import buttonVelvetOrchid from '../assets/images/themes/button_velvet_orchid.png';
import swatchVelvetOrchid from '../assets/images/themes/swatch_velvet_orchid.png';

export type AppThemeId =
  | 'royal_amethyst'
  | 'champagne_gold'
  | 'emerald_prestige'
  | 'sunset_cashmere'
  | 'sapphire_celestial'
  | 'velvet_orchid'
  // Backwards compatibility legacy aliases
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
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  assets: {
    header: ImageSourcePropType;
    button: ImageSourcePropType;
    swatch: ImageSourcePropType;
  };
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
  tint: string;
}

export const APP_THEMES: AppThemeOption[] = [
  {
    id: 'royal_amethyst',
    label: 'Royal Amethyst',
    tagline: 'Nobility & Intellect',
    psychology: 'Deep imperial violet with cobalt sheen. Inspires intellectual curiosity and premium editorial authority.',
    gradientStart: '#3B0764',
    gradientMid: '#6D28D9',
    gradientEnd: '#2563EB',
    assets: {
      header: headerRoyalAmethyst,
      button: buttonRoyalAmethyst,
      swatch: swatchRoyalAmethyst,
    },
    primary: '#7C3AED',
    primaryDark: '#5B21B6',
    primaryLight: '#DDD6FE',
    secondary: '#2563EB',
    accent: '#8B5CF6',
    badgeBg: '#EDE9FF',
    badgeText: '#7C3AED',
    tint: '#7C3AED',
  },
  {
    id: 'champagne_gold',
    label: 'Champagne Gold',
    tagline: 'Opulence & Prestige',
    psychology: 'Obsidian bronze into lustrous Tuscan gold. Evokes timeless wealth, confidence, and high executive value.',
    gradientStart: '#451A03',
    gradientMid: '#B45309',
    gradientEnd: '#F59E0B',
    assets: {
      header: headerChampagneGold,
      button: buttonChampagneGold,
      swatch: swatchChampagneGold,
    },
    primary: '#D97706',
    primaryDark: '#92400E',
    primaryLight: '#FDE68A',
    secondary: '#F59E0B',
    accent: '#FBBF24',
    badgeBg: '#FEF3C7',
    badgeText: '#B45309',
    tint: '#D97706',
  },
  {
    id: 'emerald_prestige',
    label: 'Emerald Prestige',
    tagline: 'Abundance & Serenity',
    psychology: 'British racing emerald into radiant jade mint. Minimizes optical fatigue and induces parasympathetic calm for long reading sessions.',
    gradientStart: '#022C22',
    gradientMid: '#047857',
    gradientEnd: '#10B981',
    assets: {
      header: headerEmeraldPrestige,
      button: buttonEmeraldPrestige,
      swatch: swatchEmeraldPrestige,
    },
    primary: '#059669',
    primaryDark: '#064E3B',
    primaryLight: '#A7F3D0',
    secondary: '#10B981',
    accent: '#34D399',
    badgeBg: '#D1FAE5',
    badgeText: '#065F46',
    tint: '#059669',
  },
  {
    id: 'sunset_cashmere',
    label: 'Sunset Cashmere',
    tagline: 'Passion & Vitality',
    psychology: 'Venetian crimson into warm Tuscan amber. Stimulates dopamine-led engagement and emotional connection.',
    gradientStart: '#881337',
    gradientMid: '#E11D48',
    gradientEnd: '#F97316',
    assets: {
      header: headerSunsetCashmere,
      button: buttonSunsetCashmere,
      swatch: swatchSunsetCashmere,
    },
    primary: '#E11D48',
    primaryDark: '#BE123C',
    primaryLight: '#FECDD3',
    secondary: '#F97316',
    accent: '#FB7185',
    badgeBg: '#FFE4E6',
    badgeText: '#BE123C',
    tint: '#E11D48',
  },
  {
    id: 'sapphire_celestial',
    label: 'Sapphire Celestial',
    tagline: 'Trust & Clarity',
    psychology: 'Midnight executive abyss into luminous cobalt. Establishes deep cognitive trust, stability, and peaceful focus.',
    gradientStart: '#0B1329',
    gradientMid: '#1D4ED8',
    gradientEnd: '#0EA5E9',
    assets: {
      header: headerSapphireCelestial,
      button: buttonSapphireCelestial,
      swatch: swatchSapphireCelestial,
    },
    primary: '#0284C7',
    primaryDark: '#0369A1',
    primaryLight: '#BAE6FD',
    secondary: '#2563EB',
    accent: '#38BDF8',
    badgeBg: '#E0F2FE',
    badgeText: '#0369A1',
    tint: '#0284C7',
  },
  {
    id: 'velvet_orchid',
    label: 'Velvet Orchid',
    tagline: 'Haute Couture & Spark',
    psychology: 'Byzantine royal plum with radiant coral-orchid glow. Exudes modern luxury, style, and charismatic creative energy.',
    gradientStart: '#4A044E',
    gradientMid: '#9333EA',
    gradientEnd: '#F43F5E',
    assets: {
      header: headerVelvetOrchid,
      button: buttonVelvetOrchid,
      swatch: swatchVelvetOrchid,
    },
    primary: '#9333EA',
    primaryDark: '#7E22CE',
    primaryLight: '#F5D0FE',
    secondary: '#F43F5E',
    accent: '#EC4899',
    badgeBg: '#FAE8FF',
    badgeText: '#86198F',
    tint: '#9333EA',
  },
];

export const DEFAULT_THEME_ID: AppThemeId = 'royal_amethyst';

const LEGACY_MAP: Record<string, AppThemeId> = {
  royal_violet: 'royal_amethyst',
  sunset_glow: 'sunset_cashmere',
  cyber_teal: 'emerald_prestige',
  midnight_ocean: 'sapphire_celestial',
  neon_magenta: 'velvet_orchid',
  onyx_slate: 'champagne_gold',
};

export function getThemeById(id: AppThemeId | string): AppThemeOption {
  const normalizedId = LEGACY_MAP[id] || id;
  return APP_THEMES.find((t) => t.id === normalizedId) ?? APP_THEMES[0];
}
