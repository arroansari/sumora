import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
} from 'react-native';
import FastImage, { ImageStyle } from '@d11/react-native-fast-image';
import { ThemeColors } from '../../../theme/colors';
import { useAppTheme } from '../../../context/ThemeContext';
import { createHomeStyles } from '../HomeScreen.styles';
import { FeedChannelOption } from '../hooks/useHomeDomainData';

export interface ChannelFilterModalProps {
  visible: boolean;
  onClose: () => void;
  channels: FeedChannelOption[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string | null) => void;
  totalFeedCount: number;
  styles: ReturnType<typeof createHomeStyles>;
  colors: ThemeColors;
}

export const ChannelFilterModal: React.FC<ChannelFilterModalProps> = React.memo(
  ({
    visible,
    onClose,
    channels,
    selectedChannelId,
    onSelectChannel,
    totalFeedCount,
    styles,
    colors,
  }) => {
    const { accentTheme } = useAppTheme();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
      if (!visible) {
        setSearchQuery('');
      }
    }, [visible]);

    const filteredChannels = useMemo(() => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return channels;
      return channels.filter((ch) => ch.channelName.toLowerCase().includes(q));
    }, [channels, searchQuery]);

    const handleChoose = (channelId: string | null) => {
      onSelectChannel(channelId);
      onClose();
    };

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}>
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalContent, localStyles.sheetContent]}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Channel</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.modalCloseBtn}
                accessibilityLabel="Close channel filter">
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, localStyles.subtitle]}>
              Only tracked channels appearing in your current feed are listed ({channels.length})
            </Text>

            {channels.length > 5 && (
              <TextInput
                style={[styles.modalInput, localStyles.searchInput]}
                placeholder="Search tracked channels..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            )}

            {/* Option 0: All Channels (clears filter) */}
            <TouchableOpacity
              style={[
                localStyles.channelRow,
                {
                  backgroundColor:
                    selectedChannelId === null ? `${accentTheme.primary}14` : colors.surfaceSubtle,
                  borderColor:
                    selectedChannelId === null ? accentTheme.primary : colors.border,
                },
              ]}
              activeOpacity={0.75}
              onPress={() => handleChoose(null)}>
              <View
                style={[
                  localStyles.allIconCircle,
                  {
                    backgroundColor:
                      selectedChannelId === null ? accentTheme.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}>
                <Text
                  style={[
                    localStyles.allIconText,
                    { color: selectedChannelId === null ? '#FFFFFF' : colors.textPrimary },
                  ]}>
                  All
                </Text>
              </View>

              <View style={localStyles.channelTextCol}>
                <Text style={[localStyles.channelName, { color: colors.textPrimary }]}>
                  All Tracked Channels
                </Text>
                <Text style={[localStyles.channelMeta, { color: colors.textSecondary }]}>
                  {totalFeedCount} video{totalFeedCount === 1 ? '' : 's'} in feed
                </Text>
              </View>

              {selectedChannelId === null && (
                <View style={[localStyles.checkBadge, { backgroundColor: accentTheme.primary }]}>
                  <Text style={localStyles.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <FlatList
              data={filteredChannels}
              keyExtractor={(item) => item.channelId}
              style={localStyles.list}
              contentContainerStyle={localStyles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={localStyles.emptyBox}>
                  <Text style={[localStyles.emptyText, { color: colors.textMuted }]}>
                    {searchQuery.trim()
                      ? `No channels match "${searchQuery.trim()}"`
                      : 'No tracked channels appear in this feed view yet.'}
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = selectedChannelId === item.channelId;
                const initial = item.channelName?.trim()?.charAt(0)?.toUpperCase() || 'Y';

                return (
                  <TouchableOpacity
                    style={[
                      localStyles.channelRow,
                      {
                        backgroundColor: isSelected ? `${accentTheme.primary}14` : colors.surface,
                        borderColor: isSelected ? accentTheme.primary : colors.border,
                      },
                    ]}
                    activeOpacity={0.75}
                    onPress={() => handleChoose(item.channelId)}>
                    {item.thumbnailUrl ? (
                      <FastImage
                        source={{
                          uri: item.thumbnailUrl,
                          priority: FastImage.priority.normal,
                          cache: FastImage.cacheControl.immutable,
                        }}
                        style={localStyles.avatar as ImageStyle}
                        resizeMode={FastImage.resizeMode.cover}
                      />
                    ) : (
                      <View
                        style={[
                          localStyles.avatarFallback,
                          { backgroundColor: `${accentTheme.primary}1F` },
                        ]}>
                        <Text style={[localStyles.avatarInitial, { color: accentTheme.primary }]}>
                          {initial}
                        </Text>
                      </View>
                    )}

                    <View style={localStyles.channelTextCol}>
                      <Text
                        style={[localStyles.channelName, { color: colors.textPrimary }]}
                        numberOfLines={1}>
                        {item.channelName}
                      </Text>
                      <Text style={[localStyles.channelMeta, { color: colors.textSecondary }]}>
                        {item.videoCount} video{item.videoCount === 1 ? '' : 's'} showing
                      </Text>
                    </View>

                    {isSelected ? (
                      <View style={[localStyles.checkBadge, { backgroundColor: accentTheme.primary }]}>
                        <Text style={localStyles.checkText}>✓</Text>
                      </View>
                    ) : (
                      <View style={[localStyles.countPill, { backgroundColor: colors.surfaceSubtle }]}>
                        <Text style={[localStyles.countPillText, { color: colors.textSecondary }]}>
                          {item.videoCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  }
);

const localStyles = StyleSheet.create({
  sheetContent: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: '80%',
  },
  subtitle: {
    marginBottom: 14,
  },
  searchInput: {
    height: 44,
    marginBottom: 12,
  },
  list: {
    maxHeight: 340,
  },
  listContent: {
    gap: 8,
    paddingBottom: 8,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  allIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allIconText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontWeight: '800',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontWeight: '800',
  },
  channelTextCol: {
    flex: 1,
  },
  channelName: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
  },
  channelMeta: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Regular',
    marginTop: 1,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  countPill: {
    minWidth: 26,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillText: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans-Bold',
    fontWeight: '700',
  },
  emptyBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
  },
});
