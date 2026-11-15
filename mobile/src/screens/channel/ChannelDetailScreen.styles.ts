import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';

export const createChannelDetailStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // ── Channel Header ────────────────────────────────────────────────────────
    channelHeader: {
      alignItems: 'center',
      paddingTop: 20,
      paddingBottom: 16,
      paddingHorizontal: 20,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    avatarWrap: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: `${colors.primary}20`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      overflow: 'hidden',
    },
    avatarImage: {
      width: 70,
      height: 70,
      borderRadius: 35,
    },
    avatarInitials: {
      fontSize: 26,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
      color: colors.primary,
    },
    channelName: {
      fontSize: 20,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.3,
      textAlign: 'center',
    },
    channelMeta: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },

    // ── Filter + Count ────────────────────────────────────────────────────────
    filterRow: {
      marginTop: 12,
      marginBottom: 2,
    },
    resultCount: {
      fontSize: 12,
      fontFamily: 'PlusJakartaSans-SemiBold',
      fontWeight: '600',
      color: colors.textMuted,
      paddingHorizontal: 20,
      paddingVertical: 8,
    },

    // ── List ─────────────────────────────────────────────────────────────────
    listContent: {
      paddingBottom: 40,
    },

    // ── Video Card ────────────────────────────────────────────────────────────
    videoCard: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
      overflow: 'hidden',
    },
    videoCardInner: {
      flexDirection: 'row',
      padding: 12,
      gap: 12,
    },
    thumbnailBox: {
      width: 96,
      height: 68,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: colors.border,
    },
    thumbnail: {
      width: 96,
      height: 68,
    },
    thumbnailPlaceholder: {
      width: 96,
      height: 68,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.primary}10`,
    },
    thumbnailPlay: {
      fontSize: 22,
      color: colors.textMuted,
    },
    summaryBadge: {
      position: 'absolute',
      top: 5,
      left: 5,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
    summaryBadgeText: {
      fontSize: 10,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
      color: '#FFFFFF',
    },
    videoMeta: {
      flex: 1,
    },
    videoTitle: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
      color: colors.textPrimary,
      lineHeight: 20,
    },
    videoDate: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 3,
    },
    videoPreview: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 5,
      lineHeight: 17,
    },

    // ── Read row ─────────────────────────────────────────────────────────────
    readRow: {
      paddingHorizontal: 12,
      paddingBottom: 12,
    },
    readLabel: {
      fontSize: 13,
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
    },

    // ── Empty State ───────────────────────────────────────────────────────────
    emptyBox: {
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingTop: 48,
    },
    emptyEmoji: {
      fontSize: 48,
      marginBottom: 14,
    },
    emptyTitle: {
      fontSize: 18,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    emptyAction: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    emptyActionText: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
      color: '#FFFFFF',
    },

    // ── Loading ───────────────────────────────────────────────────────────────
    loadingBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textMuted,
    },

    // ── Control Bar (Search + Link Button) ───────────────────────────────────
    controlBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginTop: 14,
      marginBottom: 6,
      gap: 10,
    },
    searchWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      height: 42,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 12,
    },
    searchIcon: {
      fontSize: 15,
      marginRight: 8,
      color: colors.textMuted,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.textPrimary,
      paddingVertical: 0,
    },
    clearSearchBtn: {
      padding: 4,
    },
    clearSearchText: {
      fontSize: 14,
      color: colors.textMuted,
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
    },
    linkActionBtn: {
      height: 42,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    linkActionBtnText: {
      fontSize: 13,
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
      color: '#FFFFFF',
    },

    // ── Modals (Custom Date & Paste Link) ───────────────────────────────────
    modalBackdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 24,
      paddingBottom: 38,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 12,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    modalCloseBtn: {
      padding: 4,
    },
    modalCloseText: {
      fontSize: 18,
      color: colors.textMuted,
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
    },
    modalSub: {
      fontSize: 13.5,
      lineHeight: 19,
      color: colors.textSecondary,
      marginBottom: 18,
    },
    modalInput: {
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 14,
      fontSize: 14,
      color: colors.textPrimary,
      marginBottom: 16,
    },
    modalBtnRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    modalPrimaryBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalPrimaryBtnText: {
      fontSize: 15,
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
      color: '#FFFFFF',
    },
    modalSecondaryBtn: {
      height: 48,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    modalSecondaryBtnText: {
      fontSize: 14,
      fontFamily: 'PlusJakartaSans-SemiBold',
      fontWeight: '600',
      color: colors.textSecondary,
    },

    // Date Presets Grid inside modal
    presetGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 20,
    },
    presetChip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
    },
    presetChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '15',
    },
    presetChipText: {
      fontSize: 13,
      fontFamily: 'PlusJakartaSans-SemiBold',
      fontWeight: '600',
      color: colors.textSecondary,
    },
    presetChipTextActive: {
      color: colors.primary,
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
    },
  });

