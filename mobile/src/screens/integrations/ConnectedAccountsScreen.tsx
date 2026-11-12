import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

  // Clean mount effect with internal fetch
  useEffect(() => {
    let isMounted = true;

    async function fetchConnectedIntegrations() {
      try {
        const data = await integrationsApi.list();
        if (isMounted) {
          setAccounts(data);
        }
      } catch (err: any) {
        console.warn('[ConnectedAccounts] Failed to load integrations:', err.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchConnectedIntegrations();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleConnectYouTube = useCallback(async () => {
    setConnecting(true);
    try {
      const res = await integrationsApi.getYouTubeConnectUrl();
      if (res.authUrl) {
        await Linking.openURL(res.authUrl);
      } else {
        Alert.alert('Error', 'Unable to generate YouTube authorization URL.');
      }
    } catch (err: any) {
      Alert.alert('Connection Error', err.message || 'Failed to initiate YouTube connection.');
    } finally {
      setConnecting(false);
    }
  }, []);

  const handleDisconnect = useCallback((id: string, platformName: string) => {
    Alert.alert(
      `Disconnect ${platformName}?`,
      `Are you sure you want to disconnect ${platformName}? We will no longer receive new upload alerts.`,
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
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Connected Accounts</Text>
          <Text style={styles.headerSubtitle}>
            Manage platform OAuth connections to automatically aggregate content
          </Text>
        </View>

        <View style={styles.content}>
          {/* Active Platform: YouTube */}
          <Text style={styles.sectionTitle}>Primary Platform</Text>

          <View style={styles.platformCard}>
            <View style={styles.platformRow}>
              <View style={styles.iconCircle}>
                <Text style={{ fontSize: 24 }}>▶️</Text>
              </View>
              <View style={styles.platformInfo}>
                <Text style={styles.platformName}>YouTube</Text>
                <Text style={styles.platformDesc}>
                  {isYouTubeConnected
                    ? `Connected: ${youtubeAccount?.platformUserId || 'Google Account'}`
                    : 'Sync subscribed channels and summarize new uploads'}
                </Text>
              </View>
            </View>

            {isYouTubeConnected ? (
              <TouchableOpacity
                style={styles.disconnectButton}
                onPress={() => youtubeAccount && handleDisconnect(youtubeAccount.id, 'YouTube')}>
                <Text style={styles.disconnectButtonText}>Disconnect Account</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.connectButton}
                onPress={handleConnectYouTube}
                disabled={connecting}>
                {connecting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.connectButtonText}>Connect with Google</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Future Platforms (Roadmap) */}
          <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Future Platform Integrations</Text>

          {[
            { name: 'Reddit', icon: '🤖', desc: 'Summarize top discussions from followed subreddits' },
            { name: 'TikTok', icon: '🎵', desc: 'Distill transcripts from authorized creator videos' },
            { name: 'Instagram', icon: '📸', desc: 'Summarize updates from permitted creator media' },
            { name: 'X (Twitter)', icon: '✖️', desc: 'Digest long-form threads and posts' },
          ].map((item, idx) => (
            <View key={idx} style={[styles.platformCard, { opacity: 0.7 }]}>
              <View style={styles.platformRow}>
                <View style={styles.iconCircle}>
                  <Text style={{ fontSize: 22 }}>{item.icon}</Text>
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
