import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';

export const createConnectedAccountsStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerTitle: {
      fontSize: 26,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 13,
      marginTop: 4,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
      marginBottom: 14,
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    platformCard: {
      padding: 18,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginBottom: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    platformRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    platformInfo: {
      flex: 1,
    },
    platformName: {
      fontSize: 16,
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
      color: colors.textPrimary,
    },
    platformDesc: {
      fontSize: 13,
      marginTop: 2,
      lineHeight: 18,
      color: colors.textSecondary,
    },
    connectButton: {
      height: 44,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FF0000',
    },
    connectButtonText: {
      color: '#FFFFFF',
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
      fontSize: 14,
    },
    disconnectButton: {
      height: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#EF4444',
      alignItems: 'center',
      justifyContent: 'center',
    },
    syncButton: {
      height: 44,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    syncButtonText: {
      color: '#FFFFFF',
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
      fontSize: 14,
    },
    disconnectButtonText: {
      color: '#EF4444',
      fontFamily: 'PlusJakartaSans-SemiBold',
      fontWeight: '600',
      fontSize: 14,
    },
    comingSoonBadge: {
      height: 36,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceHighlight,
    },
    comingSoonText: {
      fontSize: 13,
      fontFamily: 'PlusJakartaSans-SemiBold',
      fontWeight: '600',
      color: colors.textMuted,
    },
  });

