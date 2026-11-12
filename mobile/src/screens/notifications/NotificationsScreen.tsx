import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { preferencesApi, sourcesApi } from '../../services/api';
import { NotificationPreference, TrackedSource } from '../../types/models.types';
import { createNotificationsStyles } from './NotificationsScreen.styles';

export const NotificationsScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createNotificationsStyles(colors), [colors]);

  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [sources, setSources] = useState<TrackedSource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mutedChannels, setMutedChannels] = useState<Record<string, boolean>>({});

  // Performance-oriented mount effect with self-contained fetching logic
  useEffect(() => {
    let isMounted = true;

    async function loadNotificationData() {
      try {
        const [prefs, channels] = await Promise.all([
          preferencesApi.get().catch(() => []),
          sourcesApi.list().catch(() => []),
        ]);
        if (isMounted) {
          setPreferences(prefs);
          setSources(channels);
        }
      } catch (err: any) {
        console.warn('[NotificationsScreen] Load error:', err.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadNotificationData();

    return () => {
      isMounted = false;
    };
  }, []);

  const isYouTubeEnabled =
    preferences.find((p) => p.platform === 'youtube')?.enabled ?? true;

  const handleToggleGlobalYouTube = useCallback(async (value: boolean) => {
    try {
      setPreferences((prev) =>
        prev.map((p) => (p.platform === 'youtube' ? { ...p, enabled: value } : p))
      );
      await preferencesApi.update({ platform: 'youtube', enabled: value });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update preference.');
    }
  }, []);

  const handleToggleChannelMute = useCallback((channelId: string) => {
    setMutedChannels((prev) => ({
      ...prev,
      [channelId]: !prev[channelId],
    }));
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notification Settings</Text>
          <Text style={styles.headerSubtitle}>
            Control push notification alerts for AI video summaries
          </Text>
        </View>

        <View style={styles.content}>
          {/* Global Platform Toggles */}
          <Text style={styles.sectionTitle}>Platform Push Notifications</Text>

          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.toggleLabel}>YouTube Summaries</Text>
                <Text style={styles.toggleDesc}>
                  Receive a push notification when newly published YouTube videos are summarized.
                </Text>
              </View>
              <Switch
                value={isYouTubeEnabled}
                onValueChange={handleToggleGlobalYouTube}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Source-Specific Channel Muting */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Channel-Specific Notifications</Text>

          {sources.length === 0 ? (
            <View style={styles.card}>
              <Text style={{ color: colors.textMuted, textAlign: 'center', padding: 8 }}>
                No tracked channels yet. Connect YouTube or add channels to configure notifications.
              </Text>
            </View>
          ) : (
            sources.map((channel) => {
              const isMuted = Boolean(mutedChannels[channel.sourceId]);
              const isNotifying = isYouTubeEnabled && !isMuted;

              return (
                <View key={channel.id} style={[styles.card, { marginBottom: 8 }]}>
                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.channelTitle}>{channel.sourceName}</Text>
                      <Text
                        style={[
                          styles.channelStatus,
                          { color: isNotifying ? '#10B981' : colors.textMuted },
                        ]}>
                        {isNotifying ? 'Alerts active' : 'Muted'}
                      </Text>
                    </View>
                    <Switch
                      value={!isMuted}
                      onValueChange={() => handleToggleChannelMute(channel.sourceId)}
                      disabled={!isYouTubeEnabled}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
