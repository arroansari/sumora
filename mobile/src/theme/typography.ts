import { TextStyle } from 'react-native';

/**
 * Typography System — Plus Jakarta Sans
 *
 * Selected for its modern geometric design, excellent readability across all
 * sizes, friendly yet premium character, and strong visual hierarchy.
 * Psychology: geometric sans-serifs feel trustworthy, approachable, and
 * contemporary — ideal for a content-rich reading app.
 */

export const FontFamily = {
  light: 'PlusJakartaSans-Light',
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semiBold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  extraBold: 'PlusJakartaSans-ExtraBold',
  italic: 'PlusJakartaSans-Italic',
};

/** Default font for all Text components via Text.defaultProps */
export const DEFAULT_FONT_FAMILY = FontFamily.regular;

export const typography: Record<string, TextStyle> = {
  // ── Display ──────────────────────────────────────────────────────────────
  display: {
    fontFamily: FontFamily.extraBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.8,
  },

  // ── Headings ─────────────────────────────────────────────────────────────
  h1: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: FontFamily.semiBold,
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: -0.1,
  },
  h4: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },

  // ── Subtitles ─────────────────────────────────────────────────────────────
  subtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  subtitleBold: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    lineHeight: 22,
  },

  // ── Body ──────────────────────────────────────────────────────────────────
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  bodyBold: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    lineHeight: 22,
  },

  // ── Labels / UI ───────────────────────────────────────────────────────────
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  labelBold: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },

  // ── Caption ───────────────────────────────────────────────────────────────
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  captionMedium: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 17,
  },

  // ── Badge / Tag ───────────────────────────────────────────────────────────
  badge: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.3,
  },

  // ── Button ────────────────────────────────────────────────────────────────
  button: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  buttonSmall: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },

  // ── Input ─────────────────────────────────────────────────────────────────
  input: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  inputLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },

  // ── Tab / Nav ─────────────────────────────────────────────────────────────
  tabLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    lineHeight: 14,
  },
};
