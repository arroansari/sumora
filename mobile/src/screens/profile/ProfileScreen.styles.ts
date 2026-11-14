import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';

export const createProfileStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerTitle: {
      fontSize: 26,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.4,
    },
    headerSubtitle: {
      fontSize: 13,
      marginTop: 4,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    container: {
      paddingHorizontal: 16,
      paddingTop: 16,
      gap: 12,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 58,
      height: 58,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    avatarText: {
      fontSize: 24,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
      color: '#FFFFFF',
    },
    userInfo: {
      marginLeft: 16,
      flex: 1,
    },
    userName: {
      fontSize: 19,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.3,
    },
    userEmail: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 3,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    settingTitle: {
      fontSize: 16,
      fontFamily: 'PlusJakartaSans-Bold',
      fontWeight: '700',
      color: colors.textPrimary,
    },
    settingDesc: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    prefHint: {
      marginTop: 5,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textMuted,
    },
    logoutButton: {
      height: 52,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      backgroundColor: colors.dangerBg,
    },
    logoutButtonText: {
      color: colors.danger,
      fontSize: 15,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      fontWeight: '800',
    },
    footer: {
      marginTop: 20,
      marginBottom: 8,
    },
    footerText: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });

