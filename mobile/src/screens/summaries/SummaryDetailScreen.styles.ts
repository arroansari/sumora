import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';

export const createSummaryDetailStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    thumbnailContainer: {
      width: '100%',
      height: 220,
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
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      lineHeight: 28,
      color: colors.textPrimary,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      marginBottom: 20,
    },
    channelName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    aiPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: colors.surfaceHighlight,
    },
    aiPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
    },
    statusBox: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      marginBottom: 20,
    },
    statusBoxText: {
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
      color: colors.textPrimary,
    },
    sectionCard: {
      padding: 18,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginBottom: 16,
    },
    sectionHeading: {
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.5,
      marginBottom: 10,
      textTransform: 'uppercase',
      color: colors.primary,
    },
    bodyText: {
      fontSize: 15,
      lineHeight: 23,
      color: colors.textPrimary,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    bulletPoint: {
      fontSize: 18,
      lineHeight: 22,
      marginRight: 8,
      color: colors.primary,
    },
    bulletText: {
      fontSize: 14,
      lineHeight: 21,
      flex: 1,
      color: colors.textPrimary,
    },
    conceptItem: {
      marginBottom: 12,
    },
    conceptTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
    },
    conceptExplanation: {
      fontSize: 14,
      lineHeight: 20,
      marginTop: 2,
      color: colors.textSecondary,
    },
    topicsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    topicBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.surfaceHighlight,
    },
    topicBadgeText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    actionsContainer: {
      marginTop: 10,
      gap: 12,
    },
    watchOriginalButton: {
      height: 50,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    watchOriginalText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
    shareButton: {
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shareText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textMuted,
    },
  });

