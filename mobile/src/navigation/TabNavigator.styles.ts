import { StyleSheet, Platform } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { FontFamily } from '../theme/typography';

export const createTabNavigatorStyles = (colors: ThemeColors, bottomInset: number) => {
  const safeBottom = Platform.OS === 'ios' && bottomInset > 0 ? bottomInset : 8;
  const contentHeight = 54;

  return StyleSheet.create({
    tabBar: {
      backgroundColor: colors.tabBar,
      borderTopColor: colors.border,
      borderTopWidth: StyleSheet.hairlineWidth,
      height: contentHeight + safeBottom,
      paddingTop: 10,
      paddingBottom: safeBottom,
      paddingHorizontal: 0,
      elevation: 16,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    tabBarLabel: {
      fontFamily: FontFamily.semiBold,
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 0.2,
      marginTop: 2,
      marginBottom: 0,
    },
    tabBarIcon: {
      marginBottom: 0,
      marginTop: 0,
    },
  });
};
