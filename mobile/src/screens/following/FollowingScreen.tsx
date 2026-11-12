import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { sourcesApi } from '../../services/api';
import { TrackedSource } from '../../types/models.types';
import { createFollowingStyles } from './FollowingScreen.styles';

interface ChannelRowProps {
  item: TrackedSource;
  styles: ReturnType<typeof createFollowingStyles>;
  onToggle: (source: TrackedSource) => void;
}

const ChannelRow = React.memo<ChannelRowProps>(({ item, styles, onToggle }) => (
  <View style={styles.sourceCard}>
    <View style={styles.sourceAvatar}>
      <Text style={{ fontSize: 20 }}>🎬</Text>
    </View>

    <View style={styles.sourceInfo}>
      <Text style={styles.sourceName}>{item.sourceName}</Text>
      <Text style={styles.sourceIdText}>ID: {item.sourceId.slice(0, 16)}...</Text>
    </View>

    <TouchableOpacity style={styles.trackingButton} onPress={() => onToggle(item)}>
      <Text style={styles.trackingButtonText}>Tracking ✓</Text>
    </TouchableOpacity>
  </View>
));

export const FollowingScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createFollowingStyles(colors), [colors]);

  const [sources, setSources] = useState<TrackedSource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [newChannelId, setNewChannelId] = useState<string>('');
  const [newChannelName, setNewChannelName] = useState<string>('');
  const [adding, setAdding] = useState<boolean>(false);

  // Performance-oriented mount effect with self-contained fetching logic
  useEffect(() => {
    let isMounted = true;

    async function fetchSources() {
      try {
        const data = await sourcesApi.list();
        if (isMounted) {
          setSources(data);
        }
      } catch (err: any) {
        console.warn('[FollowingScreen] Failed to load sources:', err.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSources();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await sourcesApi.list();
      setSources(data);
    } catch (err: any) {
      console.warn('[FollowingScreen] Refresh failed');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleToggleTracking = useCallback((source: TrackedSource) => {
    Alert.alert(
      `Stop Tracking?`,
      `Do you want to stop tracking new uploads from "${source.sourceName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop Tracking',
          style: 'destructive',
          onPress: async () => {
            try {
              await sourcesApi.remove(source.id);
              setSources((prev) => prev.filter((s) => s.id !== source.id));
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to stop tracking channel.');
            }
          },
        },
      ]
    );
  }, []);

  const handleAddManualChannel = useCallback(async () => {
    if (!newChannelId.trim() || !newChannelName.trim()) {
      Alert.alert('Required Fields', 'Please enter both Channel Name and YouTube Channel ID.');
      return;
    }

    setAdding(true);
    try {
      const added = await sourcesApi.add({
        platform: 'youtube',
        sourceId: newChannelId.trim(),
        sourceName: newChannelName.trim(),
      });
      setSources((prev) => [added, ...prev]);
      setNewChannelId('');
      setNewChannelName('');
      Alert.alert('Success', `Now tracking "${added.sourceName}" for new uploads.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add channel.');
    } finally {
      setAdding(false);
    }
  }, [newChannelId, newChannelName]);

  const keyExtractor = useCallback((item: TrackedSource) => item.id, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TrackedSource>) => (
      <ChannelRow item={item} styles={styles} onToggle={handleToggleTracking} />
    ),
    [styles, handleToggleTracking]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tracked Channels</Text>
        <Text style={styles.headerSubtitle}>
          Manage subscribed channels for automatic AI summarization
        </Text>
      </View>

      {/* Manual Add Channel Box */}
      <View style={styles.addBox}>
        <Text style={styles.addBoxTitle}>Track a Specific Channel</Text>
        <TextInput
          style={styles.input}
          placeholder="Channel Name (e.g. Veritasium)"
          placeholderTextColor={colors.textMuted}
          value={newChannelName}
          onChangeText={setNewChannelName}
        />
        <TextInput
          style={styles.input}
          placeholder="YouTube Channel ID (e.g. UCHnyfMqiRRG1u-2MsSQLbXA)"
          placeholderTextColor={colors.textMuted}
          value={newChannelId}
          onChangeText={setNewChannelId}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddManualChannel}
          disabled={adding}>
          {adding ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.addButtonText}>+ Track Channel</Text>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading channels...</Text>
        </View>
      ) : sources.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 44, marginBottom: 12 }}>⭐️</Text>
          <Text style={styles.emptyTitle}>No Channels Tracked</Text>
          <Text style={styles.emptySubtitle}>
            Connect your YouTube account or add a channel ID above to start summarizing uploads.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sources}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </SafeAreaView>
  );
};
