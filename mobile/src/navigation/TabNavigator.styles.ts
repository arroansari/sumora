import { StyleSheet, Platform } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { FontFamily } from '../theme/typography';

export const createTabNavigatorStyles = (colors: ThemeColors, bottomInset: number) => {
  // On devices with home indicator (iPhone X+), bottomInset is ~34.
  // We want the tab bar to sit flush with the safe area, icons + labels
  // centred in the visible region (above the inset).
  const safeBottom = Platform.OS === 'ios' && bottomInset > 0 ? bottomInset : 8;

  // Visible content height: icon (26) + gap (4) + label (13) + top padding (10)
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
      elevation: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    tabBarLabel: {
      fontFamily: FontFamily.semiBold,
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 0.1,
      marginTop: 2,
      marginBottom: 0,
    },
    tabBarIcon: {
      marginBottom: 0,
      marginTop: 0,
    },
  });
};
