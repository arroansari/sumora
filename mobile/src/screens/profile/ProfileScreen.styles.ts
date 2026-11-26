import { StyleSheet } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../../theme/colors';
import { AppThemeOption } from '../../theme/appThemes';

export const createProfileStyles = (
  colors: ThemeColors,
  accent: AppThemeOption,
  scale: number = 1.0,
  insets: EdgeInsets = { top: 0, bottom: 0, left: 0, right: 0 }
) => {
  const fs = (n: number) => Math.round(n * scale);

  // ── Hero tokens ───────────────────────────────────────────────
  // For gradient themes the ImageBackground renders the image;
  // backgroundColor acts as a fallback for two-tone themes (tone1 = dark structural color).
  const heroBg    = colors.sectionDark;        // = tone1 (dark primary)
  const heroText  = '#FFFFFF';                  // always white on dark hero
  const heroMuted = 'rgba(255,255,255,0.60)';

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // ═══════════════════════════════════════════════════
    // HERO — ImageBackground (gradient image OR solid tone1)
    // ═══════════════════════════════════════════════════
    heroBanner: {
      minHeight: 230,
      backgroundColor: heroBg,     // solid fallback for two-tone themes
      paddingHorizontal: 20,
      paddingBottom: 20,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    heroOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0,0,0,0.38)',
    },

    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    heroScreenLabel: {
      fontSize: fs(12),
      fontFamily: 'PlusJakartaSans-SemiBold',
      color: heroMuted,
      letterSpacing: 1.0,
      textTransform: 'uppercase',
    },
    heroBadge: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
    },
    heroBadgeText: {
      fontSize: fs(10),
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: heroText,
      letterSpacing: 0.6,
    },

    // Identity row (avatar + text)
    heroIdentityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    heroAvatarRing: {
      width: 70,
      height: 70,
      borderRadius: 35,
      borderWidth: 2.5,
      borderColor: 'rgba(255,255,255,0.50)',
      padding: 3,
      marginRight: 14,
    },
    heroAvatar: {
      flex: 1,
      borderRadius: 32,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroAvatarLetter: {
      fontSize: fs(26),
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
      color: heroText,
    },
    heroIdentityText: {
      flex: 1,
    },
    heroUsername: {
      fontSize: fs(22),
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
      color: heroText,
      letterSpacing: -0.5,
    },
    heroEmail: {
      fontSize: fs(12),
      color: heroMuted,
      marginTop: 2,
      fontFamily: 'PlusJakartaSans-Regular',
    },
    heroThemePill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginTop: 8,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 3,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
      gap: 5,
    },
    heroThemeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    heroThemePillText: {
      fontSize: fs(10.5),
      fontFamily: 'PlusJakartaSans-SemiBold',
      fontWeight: '600',
      color: heroText,
    },

    // Stats strip
    heroStats: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.30)',
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    heroStatBlock: {
      flex: 1,
      alignItems: 'center',
    },
    heroStatNum: {
      fontSize: fs(17),
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
      color: heroText,
      letterSpacing: -0.3,
    },
    heroStatLbl: {
      fontSize: fs(10),
      color: heroMuted,
      marginTop: 2,
      fontFamily: 'PlusJakartaSans-Medium',
    },
    heroStatSep: {
      width: 1,
      height: 26,
      backgroundColor: 'rgba(255,255,255,0.15)',
    },

    // ═══════════════════════════════════════════════════
    // SCROLL CONTENT
    // ═══════════════════════════════════════════════════
    scrollArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingTop: 20,
      paddingBottom: 8,
    },

    sectionGroup: {
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    groupLabel: {
      fontSize: fs(10.5),
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 1.2,
      marginBottom: 8,
      marginLeft: 4,
    },

    // ── Setting cards ──────────────────────────────────
    settingCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 12,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.border,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSubtle,
    },
    settingCardFirst: {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderTopWidth: 1,
    },
    settingCardLast: {
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      borderBottomWidth: 1,
    },
    settingCardOnly: {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      borderTopWidth: 1,
      borderBottomWidth: 1,
    },
    settingIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: colors.surfaceSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingIconText: {
      fontSize: 17,
    },
    settingBody: {
      flex: 1,
    },
    settingTitle: {
      fontSize: fs(15),
      fontFamily: 'PlusJakartaSans-SemiBold',
      fontWeight: '600',
      color: colors.textPrimary,
    },
    settingDesc: {
      fontSize: fs(12),
      color: colors.textMuted,
      marginTop: 2,
      fontFamily: 'PlusJakartaSans-Regular',
    },
    settingArrow: {
      fontSize: 22,
      color: colors.textMuted,
      fontWeight: '300',
    },

    // Typography controls
    typographyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    scaleBadge: {
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 10,
    },
    scaleBadgeText: {
      fontSize: fs(12),
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
    },
    presetRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 10,
    },
    presetPill: {
      paddingVertical: 5,
      paddingHorizontal: 11,
      borderRadius: 10,
      borderWidth: 1.2,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
    },
    presetPillText: {
      fontSize: fs(12),
      fontFamily: 'PlusJakartaSans-SemiBold',
      fontWeight: '600',
      color: colors.textSecondary,
    },
    stepRow: {
      flexDirection: 'row',
      gap: 8,
    },
    stepBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1.2,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
      alignItems: 'center',
    },
    stepBtnText: {
      fontSize: fs(12),
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
    },

    // Account
    deleteBtn: {
      marginHorizontal: 16,
      paddingVertical: 14,
      alignItems: 'center',
    },
    deleteBtnText: {
      fontSize: fs(13),
      fontFamily: 'PlusJakartaSans-SemiBold',
      fontWeight: '600',
      color: colors.danger,
      textDecorationLine: 'underline',
    },

    footerText: {
      fontSize: fs(11),
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: 12,
      fontFamily: 'PlusJakartaSans-Regular',
    },
  });
};
