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
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 10,
      color: colors.textPrimary,
    },
    card: {
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
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
    channelTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    channelStatus: {
      fontSize: 12,
      marginTop: 2,
      fontWeight: '600',
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

