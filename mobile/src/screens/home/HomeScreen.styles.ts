import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';

export const createHomeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    headerSubtitle: {
      fontSize: 13,
      marginTop: 4,
      color: colors.textSecondary,
    },
    listContent: {
      padding: 16,
      paddingBottom: 32,
    },
    card: {
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    thumbnailContainer: {
      width: '100%',
      height: 190,
      position: 'relative',
    },
    thumbnail: {
      width: '100%',
      height: '100%',
    },
    thumbnailPlaceholder: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceHighlight,
    },
    badgeOverlay: {
      position: 'absolute',
      top: 10,
      left: 10,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusBadgeText: {
      fontSize: 12,
      fontWeight: '700',
    },
    cardContent: {
      padding: 16,
    },
    videoTitle: {
      fontSize: 17,
      fontWeight: '700',
      lineHeight: 22,
      color: colors.textPrimary,
    },
    channelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      marginBottom: 10,
    },
    channelName: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    dot: {
      marginHorizontal: 6,
      color: colors.textMuted,
    },
    dateText: {
      fontSize: 12,
      color: colors.textMuted,
    },
    overviewText: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 16,
      color: colors.textSecondary,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    readButton: {
      flex: 1,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    readButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 14,
    },
    watchButton: {
      flex: 1,
      height: 40,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    watchButtonText: {
      fontWeight: '600',
      fontSize: 14,
      color: colors.textPrimary,
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
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    emptySubtitle: {
      fontSize: 14,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 20,
      lineHeight: 20,
      color: colors.textMuted,
    },
    connectButton: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    connectButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 14,
    },
  });

