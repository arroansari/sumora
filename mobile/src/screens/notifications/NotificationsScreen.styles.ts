import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';

export const createNotificationsStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      fontSize: 13,
      marginTop: 4,
      color: colors.textSecondary,
    },
    listContent: {
      padding: 16,
      paddingBottom: 36,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    countBadge: {
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 12,
      backgroundColor: `${colors.primary}18`,
    },
    countBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    card: {
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 1,
    },
    channelCard: {
      borderRadius: 14,
      height: 66,
      paddingHorizontal: 14,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 1,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    toggleLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    toggleDesc: {
      fontSize: 13,
      lineHeight: 18,
      marginTop: 3,
      color: colors.textSecondary,
    },
    searchContainer: {
      marginBottom: 12,
    },
    searchMetaText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
      marginTop: 8,
      paddingHorizontal: 4,
    },
    channelLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingRight: 12,
    },
    channelAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      overflow: 'hidden',
    },
    channelAvatarImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    channelAvatarImageMuted: {
      opacity: 0.45,
    },
    channelAvatarMuted: {
      backgroundColor: `${colors.textMuted}18`,
    },
    channelAvatarText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.primary,
    },
    channelAvatarTextMuted: {
      color: colors.textMuted,
    },
    channelTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 3,
      gap: 5,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    channelStatus: {
      fontSize: 12,
      fontWeight: '600',
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    emptySearchBox: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 20,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    emptySearchTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 8,
    },
    emptySearchSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 4,
    },
    clearSearchButton: {
      marginTop: 14,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: `${colors.primary}15`,
    },
    clearSearchButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textMuted,
    },

    // ── Filter pills ──────────────────────────────────────────────────────────
    filterPillsRow: {
      marginHorizontal: -16, // bleed out of listContent padding
      marginTop: 4,
      marginBottom: 2,
    },
    filterPillsRowSecond: {
      marginHorizontal: -16,
      marginTop: 4,
      marginBottom: 2,
    },

    // ── Bulk action row ───────────────────────────────────────────────────────
    bulkActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
      marginBottom: 10,
      paddingHorizontal: 4,
    },
    bulkButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: `${colors.primary}15`,
      borderWidth: 1,
      borderColor: `${colors.primary}30`,
    },
    bulkButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    bulkButtonMute: {
      backgroundColor: '#FF444415',
      borderColor: '#FF444430',
    },
    bulkButtonMuteText: {
      color: '#EF4444',
    },
  });
