import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';

export const createLoginStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    header: {
      alignItems: 'center',
      marginBottom: 32,
    },
    brandTitle: {
      fontSize: 32,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
      letterSpacing: 2,
      color: colors.primary,
    },
    tagline: {
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
      color: colors.textSecondary,
    },
    card: {
      borderRadius: 16,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    cardTitle: {
      fontSize: 22,
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
      marginBottom: 20,
      color: colors.textPrimary,
    },
    inputLabel: {
      fontSize: 13,
      fontFamily: 'PlusJakartaSans-SemiBold',
      fontWeight: '600',
      marginBottom: 6,
      marginTop: 12,
      color: colors.textSecondary,
    },
    input: {
      height: 48,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      color: colors.textPrimary,
      paddingHorizontal: 14,
      fontSize: 15,
    },
    loginButton: {
      height: 50,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 24,
      backgroundColor: colors.primary,
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
    },
    footerText: {
      color: colors.textMuted,
    },
    registerLink: {
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
      color: colors.primary,
    },
  });

