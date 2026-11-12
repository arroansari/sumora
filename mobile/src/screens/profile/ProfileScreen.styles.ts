import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';

export const createProfileStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    headerSubtitle: {
      fontSize: 14,
      marginTop: 4,
      color: colors.textSecondary,
    },
    container: {
      paddingHorizontal: 16,
      gap: 12,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    avatarText: {
      fontSize: 22,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    userInfo: {
      marginLeft: 16,
    },
    userName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    userEmail: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    settingDesc: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    prefHint: {
      marginTop: 4,
      fontSize: 13,
      color: colors.textMuted,
    },
    logoutButton: {
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#EF4444',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    logoutButtonText: {
      color: '#EF4444',
      fontSize: 15,
      fontWeight: '700',
    },
    footer: {
      marginTop: 16,
    },
    footerText: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });

