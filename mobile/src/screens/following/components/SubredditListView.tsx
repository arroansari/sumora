import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Switch } from 'react-native';
import { TrackedSource } from '../../../types/models.types';
import { createFollowingStyles } from '../FollowingScreen.styles';
import { useAppTheme } from '../../../context/ThemeContext';
import { SpaceIcon } from '../../../components/atoms/SpaceIcon';

export interface SubredditListViewProps {
  subreddits: TrackedSource[];
  styles: ReturnType<typeof createFollowingStyles>;
  onToggleSubreddit: (item: TrackedSource) => void;
  onRemoveSubreddit: (item: TrackedSource) => void;
  onOpenAddModal: () => void;
}

export const SubredditListView: React.FC<SubredditListViewProps> = ({
  subreddits,
  styles,
  onToggleSubreddit,
  onRemoveSubreddit,
  onOpenAddModal,
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 10 }}>
      <FlatList
        data={subreddits}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, gap: 10 }}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              padding: 14,
              borderRadius: 16,
              borderWidth: 1.2,
              borderColor: colors.border,
              justifyContent: 'space-between',
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <SpaceIcon space="REDDIT" size={44} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15.5,
                    fontWeight: '800',
                    color: colors.textPrimary,
                    marginBottom: 2,
                  }}
                  numberOfLines={1}>
                  {item.sourceName}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                  {item.memberCount && item.memberCount > 0
                    ? `${
                        item.memberCount >= 1000000
                          ? (item.memberCount / 1000000).toFixed(1) + 'M'
                          : (item.memberCount / 1000).toFixed(0) + 'k'
                      } members`
                    : 'Active community'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Switch
                value={item.isActive !== false}
                onValueChange={() => onToggleSubreddit(item)}
                trackColor={{ false: colors.border, true: '#FF4500' }}
                thumbColor="#FFFFFF"
              />
              <TouchableOpacity
                onPress={() => onRemoveSubreddit(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ fontSize: 16, color: colors.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={[styles.centerContainer, { paddingHorizontal: 32 }]}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>💬</Text>
            <Text style={styles.emptyTitle}>No Subreddits Tracked</Text>
            <Text style={styles.emptySubtitle}>
              Track your favorite subreddits (e.g. r/technology, r/stocks) to auto-distill top community discussions.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#FF4500',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 14,
                marginTop: 14,
              }}
              onPress={onOpenAddModal}>
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                + Track First Subreddit
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};
