import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootTabParamList } from '../types/navigation.types';
import { HomeScreen } from '../screens/home/HomeScreen';
import { FollowingScreen } from '../screens/following/FollowingScreen';
import { ConnectedAccountsScreen } from '../screens/integrations/ConnectedAccountsScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { useAppTheme } from '../context/ThemeContext';
import {
  HomeTabIcon,
  FollowingTabIcon,
  ConnectedTabIcon,
  AlertsTabIcon,
  ProfileTabIcon,
} from './TabIcons';
import { createTabNavigatorStyles } from './TabNavigator.styles';

const Tab = createBottomTabNavigator<RootTabParamList>();

export const TabNavigator: React.FC = () => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () => createTabNavigatorStyles(colors, insets.bottom),
    [colors, insets.bottom]
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 0,
        },
        tabBarHideOnKeyboard: true,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => <HomeTabIcon color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Following"
        component={FollowingScreen}
        options={{
          tabBarLabel: 'Following',
          tabBarIcon: ({ color, focused }) => <FollowingTabIcon color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ConnectedAccounts"
        component={ConnectedAccountsScreen}
        options={{
          tabBarLabel: 'Connected',
          tabBarIcon: ({ color, focused }) => <ConnectedTabIcon color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, focused }) => <AlertsTabIcon color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => <ProfileTabIcon color={color} focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};
