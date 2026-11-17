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
  | 'emerald_prestige'
  | 'sunset_cashmere'
  | 'sapphire_celestial'
  | 'velvet_orchid'
  | 'champagne_gold'
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
  // Immersive luxury palette tokens
  darkBackground: string;
  darkSurface: string;
  darkSurfaceSubtle: string;
  darkBorder: string;
  lightBackground: string;
  lightSurfaceSubtle: string;
  lightBorder: string;
}

export const APP_THEMES: AppThemeOption[] = [
  {
    id: 'royal_amethyst',
    label: 'Royal Amethyst',
    tagline: 'Nobility & Deep Intellect',
    psychology: 'Deep imperial plum with cobalt sheen. Inspires intellectual curiosity and premium editorial authority.',
    gradientStart: '#581C87',
    gradientMid: '#8B5CF6',
    gradientEnd: '#3B82F6',
    assets: {
      header: headerRoyalAmethyst,
      button: buttonRoyalAmethyst,
      swatch: swatchRoyalAmethyst,
    },
    primary: '#8B5CF6',
    primaryDark: '#6D28D9',
    primaryLight: '#DDD6FE',
    secondary: '#2563EB',
    accent: '#C084FC',
    badgeBg: '#EDE9FF',
    badgeText: '#7C3AED',
    tint: '#8B5CF6',
    darkBackground: '#090412',
    darkSurface: '#130924',
    darkSurfaceSubtle: '#1C0F35',
    darkBorder: 'rgba(167, 139, 250, 0.16)',
    lightBackground: '#FAF8FF',
    lightSurfaceSubtle: '#F3EFFF',
    lightBorder: '#E4DCFF',
  },
  {
    id: 'emerald_prestige',
    label: 'Emerald Prestige',
    tagline: 'Abundance & Calm Endurance',
    psychology: 'British racing emerald into radiant jade mint. Minimizes optical fatigue and induces parasympathetic calm for long reading sessions.',
    gradientStart: '#065F46',
    gradientMid: '#059669',
    gradientEnd: '#34D399',
    assets: {
      header: headerEmeraldPrestige,
      button: buttonEmeraldPrestige,
      swatch: swatchEmeraldPrestige,
    },
    primary: '#10B981',
    primaryDark: '#047857',
    primaryLight: '#A7F3D0',
    secondary: '#059669',
    accent: '#34D399',
    badgeBg: '#D1FAE5',
    badgeText: '#065F46',
    tint: '#10B981',
    darkBackground: '#050D0A',
    darkSurface: '#0C1813',
    darkSurfaceSubtle: '#13251E',
    darkBorder: 'rgba(16, 185, 129, 0.16)',
    lightBackground: '#F5FAF7',
    lightSurfaceSubtle: '#EBF5F0',
    lightBorder: '#D4EAE0',
  },
  {
    id: 'sunset_cashmere',
    label: 'Sunset Cashmere',
    tagline: 'Passion & Vital Engagement',
    psychology: 'Venetian crimson into warm Tuscan amber. Stimulates dopamine-led engagement and emotional connection.',
    gradientStart: '#9F1239',
    gradientMid: '#F43F5E',
    gradientEnd: '#FB923C',
    assets: {
      header: headerSunsetCashmere,
      button: buttonSunsetCashmere,
      swatch: swatchSunsetCashmere,
    },
    primary: '#F43F5E',
    primaryDark: '#BE123C',
    primaryLight: '#FECDD3',
    secondary: '#F97316',
    accent: '#FB7185',
    badgeBg: '#FFE4E6',
    badgeText: '#BE123C',
    tint: '#F43F5E',
    darkBackground: '#0D0608',
    darkSurface: '#1A0D12',
    darkSurfaceSubtle: '#26141A',
    darkBorder: 'rgba(244, 63, 94, 0.18)',
    lightBackground: '#FFF8F9',
    lightSurfaceSubtle: '#FFF0F3',
    lightBorder: '#FFE0E6',
  },
  {
    id: 'sapphire_celestial',
    label: 'Sapphire Celestial',
    tagline: 'Executive Trust & Clarity',
    psychology: 'Midnight executive abyss into luminous cobalt. Establishes deep cognitive trust, stability, and peaceful focus.',
    gradientStart: '#1E3A8A',
    gradientMid: '#2563EB',
    gradientEnd: '#38BDF8',
    assets: {
      header: headerSapphireCelestial,
      button: buttonSapphireCelestial,
      swatch: swatchSapphireCelestial,
    },
    primary: '#38BDF8',
    primaryDark: '#0369A1',
    primaryLight: '#BAE6FD',
    secondary: '#2563EB',
    accent: '#60A5FA',
    badgeBg: '#E0F2FE',
    badgeText: '#0369A1',
    tint: '#38BDF8',
    darkBackground: '#040812',
    darkSurface: '#091222',
    darkSurfaceSubtle: '#0F1E36',
    darkBorder: 'rgba(59, 130, 246, 0.18)',
    lightBackground: '#F5F9FF',
    lightSurfaceSubtle: '#EBF2FF',
    lightBorder: '#D6E4FF',
  },
  {
    id: 'velvet_orchid',
    label: 'Velvet Orchid',
    tagline: 'Haute Joaillerie & Creative Spark',
    psychology: 'Byzantine royal plum with radiant coral-orchid glow. Exudes modern luxury, style, and charismatic creative energy.',
    gradientStart: '#701A75',
    gradientMid: '#A855F7',
    gradientEnd: '#FB7185',
    assets: {
      header: headerVelvetOrchid,
      button: buttonVelvetOrchid,
      swatch: swatchVelvetOrchid,
    },
    primary: '#C084FC',
    primaryDark: '#7E22CE',
    primaryLight: '#F5D0FE',
    secondary: '#F43F5E',
    accent: '#E879F9',
    badgeBg: '#FAE8FF',
    badgeText: '#86198F',
    tint: '#C084FC',
    darkBackground: '#0C0310',
    darkSurface: '#180820',
    darkSurfaceSubtle: '#240D30',
    darkBorder: 'rgba(192, 38, 211, 0.18)',
    lightBackground: '#FAF5FF',
    lightSurfaceSubtle: '#F5EBFF',
    lightBorder: '#EBD6FF',
  },
  {
    id: 'champagne_gold',
    label: 'Champagne Gold',
    tagline: 'Opulence & Haute Horlogerie',
    psychology: 'Obsidian bronze into lustrous Tuscan gold. Evokes timeless wealth, confidence, and high executive value.',
    gradientStart: '#78350F',
    gradientMid: '#D97706',
    gradientEnd: '#FBBF24',
    assets: {
      header: headerChampagneGold,
      button: buttonChampagneGold,
      swatch: swatchChampagneGold,
    },
    primary: '#F59E0B',
    primaryDark: '#B45309',
    primaryLight: '#FDE68A',
    secondary: '#D97706',
    accent: '#FBBF24',
    badgeBg: '#FEF3C7',
    badgeText: '#B45309',
    tint: '#F59E0B',
    darkBackground: '#0C0A07',
    darkSurface: '#17140F',
    darkSurfaceSubtle: '#231E17',
    darkBorder: 'rgba(245, 158, 11, 0.18)',
    lightBackground: '#FAF8F5',
    lightSurfaceSubtle: '#F7F2EB',
    lightBorder: '#EAE0D2',
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
