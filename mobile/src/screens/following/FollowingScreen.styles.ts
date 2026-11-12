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
    addBox: {
      margin: 16,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    addBoxTitle: {
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 10,
      color: colors.textPrimary,
    },
    input: {
      height: 42,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      fontSize: 14,
      marginBottom: 8,
      backgroundColor: colors.background,
      color: colors.textPrimary,
    },
    addButton: {
      height: 42,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
      backgroundColor: colors.primary,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 14,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    sourceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginBottom: 10,
    },
    sourceAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    sourceInfo: {
      flex: 1,
    },
    sourceName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    sourceIdText: {
      fontSize: 12,
      marginTop: 2,
      color: colors.textMuted,
    },
    trackingButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: '#10B98120',
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
      lineHeight: 18,
      color: colors.textMuted,
    },
  });

