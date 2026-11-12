import { StyleSheet, Platform } from 'react-native';
import { ThemeColors } from '../theme/colors';

export const createTabNavigatorStyles = (colors: ThemeColors, bottomInset: number) => {
  const isIosWithHomeIndicator = Platform.OS === 'ios' && bottomInset > 0;
  const safeBottom = isIosWithHomeIndicator ? bottomInset : 8;

  return StyleSheet.create({
    tabBar: {
      backgroundColor: colors.tabBar,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      height: 52 + safeBottom,
      paddingTop: 8,
      paddingBottom: safeBottom,
      elevation: 10,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius: 5,
    },
    tabBarLabel: {
      fontSize: 11,
      fontWeight: '600',
      marginTop: 3,
    },
    tabBarIcon: {
      marginBottom: 0,
    },
  });
};

