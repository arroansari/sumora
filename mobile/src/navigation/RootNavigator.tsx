import React, { useEffect, useRef } from 'react';
import { Linking, View, ActivityIndicator } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
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
  if (!url || !url.startsWith('sumora://oauth/callback')) {
    return;
  }

  try {
    // Parse query params from the deep-link
    const queryString = url.split('?')[1] || '';
    const params: Record<string, string> = {};
    queryString.split('&').forEach((pair) => {
      const [key, val] = pair.split('=');
      if (key) params[decodeURIComponent(key)] = decodeURIComponent(val || '');
    });

    const success = params['success'] === 'true';

    if (success && navigationRef.current?.isReady()) {
      // Navigate to the ConnectedAccounts tab so it can re-fetch the account list
      navigationRef.current.navigate('MainTabs', { screen: 'ConnectedAccounts' } as any);
    }

    // ConnectedAccountsScreen subscribes to Linking events too — it will refresh regardless
  } catch (err) {
    console.warn('[RootNavigator] Error processing OAuth deep-link:', err);
  }
}

export const RootNavigator: React.FC = () => {
  const { colors } = useAppTheme();
  const { isAuthenticated, isRestoring } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList> | null>(null);

  useOAuthDeepLink(navigationRef);

  if (isRestoring) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
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
              options={{ title: 'AI Summary Details', headerBackTitle: 'Feed' }}
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
