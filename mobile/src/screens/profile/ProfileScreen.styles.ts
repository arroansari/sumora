import { StyleSheet } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { ThemeColors } from '../../theme/colors';
import { AppThemeOption } from '../../theme/appThemes';

export const createProfileStyles = (
  colors: ThemeColors,
  _accent: AppThemeOption,
  scale: number = 1.0,
  _insets: EdgeInsets = { top: 0, bottom: 0, left: 0, right: 0 }
) => {
  const fs = (n: number) => Math.round(n * scale);

  const heroBg = colors.sectionDark;
  const heroText = '#FFFFFF';
  const heroMuted = 'rgba(255,255,255,0.70)';

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // ═══════════════════════════════════════════════════
    // STICKY COLLAPSED COMPACT BAR (Reveals on scroll)
    // ═══════════════════════════════════════════════════
    stickyCompactBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      backgroundColor: heroBg,
      paddingHorizontal: 16,
      paddingBottom: 10,
      borderBottomLeftRadius: 22,
      borderBottomRightRadius: 22,
      overflow: 'hidden',
      shadowColor: heroBg,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.24,
      shadowRadius: 12,
      elevation: 10,
    },
    stickyCompactInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    stickyUserLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },
    stickyMiniAvatar: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.34)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stickyMiniAvatarText: {
      fontSize: fs(13),
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
      color: heroText,
    },
    stickyUserTextWrap: {
      flex: 1,
    },
    stickyUsername: {
      fontSize: fs(14),
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
      color: heroText,
      letterSpacing: -0.3,
    },
    stickySubmeta: {
      fontSize: fs(9.5),
      fontFamily: 'PlusJakartaSans-Medium',
      color: 'rgba(255,255,255,0.74)',
    },
    stickySpacesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(8, 8, 16, 0.28)',
      padding: 3.5,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
    },
    stickySpacePill: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stickySpacePillActive: {
      backgroundColor: 'rgba(255,255,255,0.22)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.42)',
    },

    // ═══════════════════════════════════════════════════
    // HERO — Curved Editorial Multi-Domain Command Header
    // ═══════════════════════════════════════════════════
    heroBanner: {
      backgroundColor: heroBg,
      paddingHorizontal: 16,
      paddingBottom: 14,
      marginBottom: 18,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      overflow: 'hidden',
      shadowColor: heroBg,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 16,
      elevation: 9,
    },
    heroOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(6, 6, 14, 0.28)',
    },
    heroGlowOrbTop: {
      position: 'absolute',
      top: -40,
      right: -30,
      width: 170,
      height: 170,
      borderRadius: 85,
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    heroGlowOrbBottom: {
      position: 'absolute',
      bottom: -55,
      left: -40,
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: 'rgba(255,255,255,0.05)',
    },

    // Identity row (top-left squircle monogram + live space badge + text)
    heroIdentityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    heroAvatarWrap: {
      position: 'relative',
      marginRight: 12,
    },
    heroAvatarFrame: {
      width: 52,
      height: 52,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.38)',
      backgroundColor: 'rgba(255,255,255,0.14)',
      padding: 2.5,
    },
    heroAvatar: {
      flex: 1,
      borderRadius: 13,
      backgroundColor: 'rgba(255,255,255,0.16)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroAvatarLetter: {
      fontSize: fs(21),
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
      color: heroText,
      letterSpacing: -0.5,
    },
    heroAvatarSpaceBadge: {
      position: 'absolute',
      right: -4,
      bottom: -4,
      borderRadius: 7,
      padding: 1.5,
      backgroundColor: 'rgba(255,255,255,0.94)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    heroIdentityText: {
      flex: 1,
    },
    heroNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    heroUsername: {
      fontSize: fs(21),
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
      color: heroText,
      letterSpacing: -0.5,
      flexShrink: 1,
    },
    heroMemberTag: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.18)',
    },
    heroMemberTagText: {
      fontSize: fs(9),
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
      color: 'rgba(255,255,255,0.88)',
    },
    heroEmail: {
      fontSize: fs(12),
      color: heroMuted,
      marginTop: 2,
      fontFamily: 'PlusJakartaSans-Regular',
    },
    heroMetaLine: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      gap: 6,
    },
    heroLiveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#34D399',
    },
    heroMetaText: {
      fontSize: fs(10.5),
      fontFamily: 'PlusJakartaSans-Medium',
      fontWeight: '500',
      color: 'rgba(255,255,255,0.88)',
    },

    // Compact 4-Space Knowledge Dock
    spacesDock: {
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: 'rgba(8, 8, 16, 0.34)',
      borderRadius: 16,
      padding: 4,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
      gap: 4,
    },
    spaceTile: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: 3,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    spaceTileActive: {
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderColor: 'rgba(255,255,255,0.34)',
    },
    spaceTileHeader: {
      position: 'relative',
      marginBottom: 3,
    },
    spaceActivePip: {
      position: 'absolute',
      top: -2,
      right: -3,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#34D399',
      borderWidth: 1,
      borderColor: '#FFFFFF',
    },
    spaceTileName: {
      fontSize: fs(10),
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
      color: heroText,
    },
    spaceTileMetric: {
      fontSize: fs(9),
      fontFamily: 'PlusJakartaSans-Medium',
      fontWeight: '500',
      color: 'rgba(255,255,255,0.68)',
      marginTop: 1,
    },
    spaceTileMetricActive: {
      color: '#FFFFFF',
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
    },
    dockHintText: {
      fontSize: fs(9.5),
      fontFamily: 'PlusJakartaSans-Regular',
      color: 'rgba(255,255,255,0.58)',
      textAlign: 'center',
      marginTop: 7,
      letterSpacing: 0.1,
    },

    // ═══════════════════════════════════════════════════
    // SCROLL CONTENT
    // ═══════════════════════════════════════════════════
    scrollArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingTop: 0,
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
