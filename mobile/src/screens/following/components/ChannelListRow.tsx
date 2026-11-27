import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { TrackedSource } from '../../../types/models.types';
import { createFollowingStyles } from '../FollowingScreen.styles';
import { CategorySquircleIcon } from '../../../components/atoms/CategorySquircleIcon';
import { getCategoryForChannel, getInitials } from '../types';

export interface ChannelListRowProps {
  item: TrackedSource;
  isFavorite: boolean;
  styles: ReturnType<typeof createFollowingStyles>;
  onToggle: (source: TrackedSource) => void;
  onToggleFavorite: (source: TrackedSource) => void;
  onPress: (source: TrackedSource) => void;
}

export const ChannelListRow = React.memo<ChannelListRowProps>(
  ({ item, isFavorite, styles, onToggle, onToggleFavorite, onPress }) => {
    const category = useMemo(() => getCategoryForChannel(item.sourceName), [item.sourceName]);
    const initials = useMemo(() => getInitials(item.sourceName), [item.sourceName]);
    const isActivelyTracked = item.isActive !== false;

    const handleRowPress = useCallback(() => onPress(item), [onPress, item]);
    const handleTogglePress = useCallback(() => onToggle(item), [onToggle, item]);
    const handleFavoritePress = useCallback(() => onToggleFavorite(item), [onToggleFavorite, item]);

    return (
      <TouchableOpacity
        style={styles.channelListRow}
        onPress={handleRowPress}
        activeOpacity={0.75}>
        {/* Left: Circular Channel Avatar */}
        <View style={styles.listRowAvatarContainer}>
          {item.thumbnailUrl ? (
            <FastImage
              source={{
                uri: item.thumbnailUrl,
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.immutable,
              }}
              style={styles.listRowAvatarImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <View style={styles.listRowAvatarPlaceholder}>
              <Text style={styles.listRowAvatarText}>{initials}</Text>
            </View>
          )}
          {isFavorite && (
            <View style={styles.listRowFavoriteDot}>
              <Text style={styles.listRowFavoriteDotText}>⭐</Text>
            </View>
          )}
        </View>

        {/* Center: Channel Name & Category Badge */}
        <View style={styles.listRowInfo}>
          <Text style={styles.listRowTitle} numberOfLines={1}>
            {item.sourceName}
          </Text>
          <View style={styles.listRowMetaRow}>
            {category && (
              <View style={styles.listRowCategoryBadge}>
                <CategorySquircleIcon category={category.id} size={11} style={localStyles.catIcon} />
                <Text style={styles.listRowCategoryText} numberOfLines={1}>
                  {category.label}
                </Text>
              </View>
            )}
            <Text style={styles.listRowTapHint}>Tap to view ›</Text>
          </View>
        </View>

        {/* Right: Active/Track Pill Button & Priority Star Button */}
        <View style={styles.listRowActions}>
          <TouchableOpacity
            style={isActivelyTracked ? styles.listRowTrackBtnActive : styles.listRowTrackBtn}
            onPress={handleTogglePress}
            activeOpacity={0.75}>
            <Text style={isActivelyTracked ? styles.listRowTrackBtnTextActive : styles.listRowTrackBtnText}>
              {isActivelyTracked ? '✓ Active' : '+ Track'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.listRowStarBtn, isFavorite && styles.listRowStarBtnActive]}
            onPress={handleFavoritePress}
            hitSlop={hitSlop}
            activeOpacity={0.7}>
            <Text style={styles.listRowStarIcon}>{isFavorite ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }
);

const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 };
const localStyles = StyleSheet.create({
  catIcon: { marginRight: 3 },
});
