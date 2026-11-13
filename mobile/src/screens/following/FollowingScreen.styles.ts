import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';

export const createFollowingStyles = (colors: ThemeColors) =>
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
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.3,
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
    toggleAddButton: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: colors.primary,
    },
    toggleAddButtonActive: {
      backgroundColor: `${colors.primary}18`,
    },
    toggleAddButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    toggleAddButtonTextActive: {
      color: colors.primary,
    },
    headerSubtitle: {
      fontSize: 13,
      marginTop: 4,
      color: colors.textSecondary,
    },
    searchSection: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
    },
    searchMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingHorizontal: 4,
    },
    searchMetaText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
    },
    addBox: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: `${colors.primary}30`,
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 3,
    },
    addBoxTitle: {
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 10,
      color: colors.textPrimary,
    },
    input: {
      height: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 13,
      fontSize: 14,
      marginBottom: 10,
      backgroundColor: colors.background,
      color: colors.textPrimary,
    },
    addButton: {
      height: 44,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
      backgroundColor: colors.primary,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 14,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 32,
    },
    sourceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 90,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
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
    sourceAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: `${colors.primary}15`,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      overflow: 'hidden',
    },
    sourceAvatarImage: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    sourceAvatarText: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.primary,
    },
    sourceInfo: {
      flex: 1,
      paddingRight: 10,
    },
    sourceName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    sourceIdText: {
      fontSize: 12,
      marginTop: 3,
      color: colors.textMuted,
    },
    sourceHint: {
      fontSize: 11,
      marginTop: 2,
      fontWeight: '600',
      color: colors.primary,
    },
    trackingButton: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: '#10B98118',
      borderWidth: 1,
      borderColor: '#10B98130',
    },
    trackingButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#10B981',
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textMuted,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    emptySubtitle: {
      fontSize: 13,
      textAlign: 'center',
      marginTop: 6,
      lineHeight: 19,
      color: colors.textMuted,
    },
    clearSearchButton: {
      marginTop: 16,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: `${colors.primary}15`,
    },
    clearSearchButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    syncEmptyButton: {
      marginTop: 18,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    syncEmptyButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    // ── Filter pills ──────────────────────────────────────────────────────────
    filterPillsRow: {
      marginHorizontal: -16, // bleed to full width since searchSection has px16
      marginTop: 8,
      marginBottom: 2,
    },

    // ── Priority Summaries Banner ───────────────────────────────────────────
    priorityBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#F59E0B40',
      backgroundColor: '#FEF3C7',
      marginBottom: 12,
      gap: 12,
    },
    priorityBannerIcon: {
      fontSize: 22,
    },
    priorityBannerTextWrap: {
      flex: 1,
    },
    priorityBannerTitle: {
      fontSize: 13.5,
      fontWeight: '800',
      color: '#92400E',
      marginBottom: 2,
    },
    priorityBannerSub: {
      fontSize: 12,
      lineHeight: 16,
      color: '#B45309',
    },

    // ── Category Pills Row ──────────────────────────────────────────────────
    categoryPillsRow: {
      marginHorizontal: -16,
      paddingHorizontal: 16,
      marginTop: 10,
      marginBottom: 6,
    },
    categoryChip: {
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSubtle,
    },
    categoryChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '18',
    },
    categoryChipText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    categoryChipTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },

    // ── Section Headers ─────────────────────────────────────────────────────
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 4,
      marginTop: 8,
      marginBottom: 6,
      backgroundColor: colors.background,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    sectionBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: colors.surfaceHighlight,
    },
    sectionBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
    },

    // ── Star / Favorite Button ──────────────────────────────────────────────
    sourceActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    starBtn: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: colors.surfaceSubtle,
    },
    starBtnActive: {
      backgroundColor: '#FEF3C7',
    },
    starIcon: {
      fontSize: 17,
      color: colors.textMuted,
    },
    starIconActive: {
      color: '#F59E0B',
    },
  });
