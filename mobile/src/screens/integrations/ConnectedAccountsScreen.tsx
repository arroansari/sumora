import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { integrationsApi } from '../../services/api';
import { ConnectedAccount } from '../../types/models.types';
import { createConnectedAccountsStyles } from './ConnectedAccountsScreen.styles';

export const ConnectedAccountsScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createConnectedAccountsStyles(colors), [colors]);

  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // ── Fetch connected accounts ──────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function fetchConnectedIntegrations() {
      try {
        const data = await integrationsApi.list();
        if (isMounted) setAccounts(data);
      } catch (err: any) {
        console.warn('[ConnectedAccounts] Failed to load integrations:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchConnectedIntegrations();
    return () => { isMounted = false; };
  }, []);

  // ── Listen for sumora://oauth/callback deep-link return ───────────────
  // When Google OAuth completes and the backend redirects back to the app,
  // this listener fires, refreshes the account list, and shows feedback.
  useEffect(() => {
    let isMounted = true;

    async function handleOAuthReturn(event: { url: string }) {
      if (!event.url || !event.url.startsWith('sumora://oauth/callback')) return;

      const queryString = event.url.split('?')[1] || '';
      const params: Record<string, string> = {};
      queryString.split('&').forEach((pair) => {
        const [key, val] = pair.split('=');
        if (key) params[decodeURIComponent(key)] = decodeURIComponent(val || '');
      });

      const success = params['success'] === 'true';

      if (success) {
        if (isMounted) {
          setConnecting(false);
          setSyncMessage('YouTube connected! Subscriptions are being synced…');
        }
        // Refresh account list
        try {
          const refreshed = await integrationsApi.list();
          if (isMounted) setAccounts(refreshed);
        } catch (err: any) {
          console.warn('[ConnectedAccounts] Refresh after OAuth failed:', err.message);
        } finally {
          // Clear message after a few seconds
          setTimeout(() => { if (isMounted) setSyncMessage(null); }, 4000);
        }
      } else {
        const errorCode = params['error'] || 'unknown_error';
        if (isMounted) {
          setConnecting(false);
          Alert.alert(
            'Connection Failed',
            errorCode === 'access_denied'
              ? 'You declined the Google permission request. Tap "Connect with Google" to try again.'
              : `YouTube connection failed (${errorCode}). Please try again.`
          );
        }
      }
    }

    const subscription = Linking.addEventListener('url', handleOAuthReturn);
    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Initiate YouTube OAuth ────────────────────────────────────────────
  const handleConnectYouTube = useCallback(async () => {
    setConnecting(true);
    setSyncMessage(null);
    try {
      const res = await integrationsApi.getYouTubeConnectUrl();
      if (res.authUrl) {
        // Open Google OAuth consent screen in the system browser
        const canOpen = await Linking.canOpenURL(res.authUrl);
        if (canOpen) {
          await Linking.openURL(res.authUrl);
        } else {
          Alert.alert('Error', 'Cannot open the Google sign-in page. Please check your device settings.');
          setConnecting(false);
        }
      } else {
        Alert.alert('Error', 'Unable to generate YouTube authorization URL. Check that Google credentials are configured in the backend.');
        setConnecting(false);
      }
    } catch (err: any) {
      Alert.alert(
        'Connection Error',
        err.message?.includes('GOOGLE_CLIENT_ID')
          ? 'Google credentials are not configured on the server. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to backend/.env'
          : err.message || 'Failed to initiate YouTube connection.'
      );
      setConnecting(false);
    }
  }, []);

  // ── Sync Subscriptions ────────────────────────────────────────────────
  const handleSyncYouTube = useCallback(async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await integrationsApi.syncYouTube();
      setSyncMessage(`Synced ${result.syncedChannelsCount} YouTube channels!`);
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      Alert.alert('Sync Failed', err.message || 'Could not sync YouTube subscriptions.');
    } finally {
      setSyncing(false);
    }
  }, []);

  // ── Disconnect ────────────────────────────────────────────────────────
  const handleDisconnect = useCallback((id: string, platformName: string) => {
    Alert.alert(
      `Disconnect ${platformName}?`,
      `Your ${platformName} subscriptions will no longer be tracked and no new summaries will be generated.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await integrationsApi.disconnect(id);
              const refreshed = await integrationsApi.list();
              setAccounts(refreshed);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to disconnect account.');
            }
          },
        },
      ]
    );
  }, []);

  const isYouTubeConnected = accounts.some((a) => a.platform === 'youtube' && a.status === 'active');
  const youtubeAccount = accounts.find((a) => a.platform === 'youtube');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Connected Accounts</Text>
          <Text style={styles.headerSubtitle}>
            Sign in with Google to automatically track your YouTube subscriptions and receive structured summaries for new uploads.
          </Text>
        </View>

        <View style={styles.content}>
          {/* Sync feedback banner */}
          {syncMessage ? (
            <View style={[styles.platformCard, { backgroundColor: '#10B98115', marginBottom: 12 }]}>
              <Text style={{ color: '#10B981', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
                {syncMessage}
              </Text>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Primary Platform</Text>

          <View style={styles.platformCard}>
            <View style={styles.platformRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#FF000018' }]}>
                {/* YouTube wordmark approximation using text */}
                <Text style={{ fontSize: 20, color: '#FF0000', fontWeight: '900', letterSpacing: -1 }}>▶</Text>
              </View>
              <View style={styles.platformInfo}>
                <Text style={styles.platformName}>YouTube</Text>
                <Text style={styles.platformDesc}>
                  {isYouTubeConnected
                    ? `Connected · ${youtubeAccount?.platformUserId || 'Google Account'}`
                    : loading
                    ? 'Checking connection status…'
                    : 'Sync subscriptions and generate summaries for new uploads'}
                </Text>
              </View>
            </View>

            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
            ) : isYouTubeConnected ? (
              <View>
                <TouchableOpacity
                  style={styles.syncButton}
                  onPress={handleSyncYouTube}
                  disabled={syncing}>
                  {syncing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.syncButtonText}>Syncing Subscriptions…</Text>
                    </View>
                  ) : (
                    <Text style={styles.syncButtonText}>↻ Sync Subscriptions</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={() => youtubeAccount && handleDisconnect(youtubeAccount.id, 'YouTube')}>
                  <Text style={styles.disconnectButtonText}>Disconnect Account</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.connectButton}
                onPress={handleConnectYouTube}
                disabled={connecting}>
                {connecting ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.connectButtonText}>Opening Google…</Text>
                  </View>
                ) : (
                  <Text style={styles.connectButtonText}>Connect with Google</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* How it works section */}
          {!isYouTubeConnected && !loading ? (
            <View style={[styles.platformCard, { marginTop: 20 }]}>
              <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>How it works</Text>
              {[
                { step: '1', text: 'Tap "Connect with Google" and sign in with your Google account.' },
                { step: '2', text: 'We fetch your active YouTube subscriptions and register webhook listeners.' },
                { step: '3', text: 'When a subscribed channel publishes a new video, we retrieve its transcript.' },
                { step: '4', text: 'A summarization engine generates a structured summary grounded exclusively in the transcript.' },
                { step: '5', text: 'Your Home feed updates with the summary — no watching required.' },
              ].map((item) => (
                <View key={item.step} style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' }}>
                  <View style={{
                    width: 22, height: 22, borderRadius: 11,
                    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
                    marginRight: 10, marginTop: 1,
                  }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{item.step}</Text>
                  </View>
                  <Text style={[styles.platformDesc, { flex: 1 }]}>{item.text}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Future Platforms */}
          <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Future Integrations</Text>

          {[
            { name: 'Reddit', icon: '📋', desc: 'Summarize top discussions from followed subreddits' },
            { name: 'TikTok', icon: '🎵', desc: 'Distill transcripts from authorized creator videos' },
            { name: 'Instagram', icon: '📸', desc: 'Summarize updates from permitted creator media' },
            { name: 'X (Twitter)', icon: '✖️', desc: 'Digest long-form threads and posts' },
          ].map((item, idx) => (
            <View key={idx} style={[styles.platformCard, { opacity: 0.6 }]}>
              <View style={styles.platformRow}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                </View>
                <View style={styles.platformInfo}>
                  <Text style={styles.platformName}>{item.name}</Text>
                  <Text style={styles.platformDesc}>{item.desc}</Text>
                </View>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
