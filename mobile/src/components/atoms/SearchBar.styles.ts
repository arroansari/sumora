import { StyleSheet } from 'react-native';
import { ThemeColors } from '../../theme/colors';

export const createSearchBarStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      height: 46,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    wrapperFocused: {
      borderColor: colors.primary,
      shadowOpacity: 0.08,
    },
    iconContainer: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    magnifierCircle: {
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.textMuted,
      position: 'absolute',
      top: 2,
      left: 2,
    },
    magnifierCircleFocused: {
      borderColor: colors.primary,
    },
    magnifierHandle: {
      width: 6,
      height: 2,
      borderRadius: 1,
      backgroundColor: colors.textMuted,
      position: 'absolute',
      bottom: 3,
      right: 2,
      transform: [{ rotate: '45deg' }],
    },
    magnifierHandleFocused: {
      backgroundColor: colors.primary,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: colors.textPrimary,
      paddingVertical: 0,
      height: '100%',
    },
    clearButton: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    clearIcon: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      lineHeight: 13,
    },
  });

