import React, { useEffect, useRef, useMemo } from 'react';
import { Linking, View, ActivityIndicator } from 'react-native';
import { NavigationContainer, NavigationContainerRef, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation.types';
import { TabNavigator } from './TabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { SummaryDetailScreen } from '../screens/summaries/SummaryDetailScreen';
import { ChannelDetailScreen } from '../screens/channel/ChannelDetailScreen';
import { useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { FontFamily } from '../theme/typography';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Handles the deep-link URI returned by the backend OAuth callback.
 * Pattern: sumora://oauth/callback?success=true|false[&error=...]
 *
 * On success, navigates to the ConnectedAccounts tab so it can refresh.
 * On failure, navigation stays on current screen; ConnectedAccountsScreen
 * listens for the same event via its own Linking listener.
 */
function useOAuthDeepLink(navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>) {
  // Handle deep-link when app is already open
  useEffect(() => {
    function handleUrl(event: { url: string }) {
      processOAuthUrl(event.url, navigationRef);
    }

    const subscription = Linking.addEventListener('url', handleUrl);

    // Handle deep-link when app is cold-started from the OAuth redirect
    async function checkInitialUrl() {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          processOAuthUrl(url, navigationRef);
        }
      } catch (err) {
        console.warn('[RootNavigator] Could not read initial URL:', err);
      }
    }

    checkInitialUrl();

    return () => subscription.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

function processOAuthUrl(
  url: string,
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList> | null>
) {
  if (!url) return;

  try {
    // Parse query params from the deep-link
    const queryString = url.split('?')[1] || '';
    const params: Record<string, string> = {};
    queryString.split('&').forEach((pair) => {
      const [key, val] = pair.split('=');
      if (key) params[decodeURIComponent(key)] = decodeURIComponent(val || '');
    });

    if (url.startsWith('sumora://oauth/callback')) {
      const success = params['success'] === 'true';
      if (success && navigationRef.current?.isReady()) {
        navigationRef.current.navigate('MainTabs', { screen: 'ConnectedAccounts' } as any);
      }
    } else if (url.startsWith('sumora://summary')) {
      const videoId = params['videoId'] || '';
      const videoTitle = params['title'] || 'Video Summary';
      if (navigationRef.current?.isReady() && videoId) {
        navigationRef.current.navigate('SummaryDetail', { videoId, videoTitle });
      }
    }
  } catch (err) {
    console.warn('[RootNavigator] Error processing deep-link:', err);
  }
}

export const RootNavigator: React.FC = () => {
  const { colors, isDark } = useAppTheme();
  const { isAuthenticated, isRestoring } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList> | null>(null);

  const navTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: isDark,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.border,
        notification: colors.primary,
      },
    };
  }, [isDark, colors]);

  useOAuthDeepLink(navigationRef);

  if (isRestoring) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontFamily: FontFamily.bold, fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
        }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SummaryDetail"
              component={SummaryDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ChannelDetail"
              component={ChannelDetailScreen}
              options={({ route }) => ({
                title: route.params.channelName,
                headerBackTitle: 'Following',
              })}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
