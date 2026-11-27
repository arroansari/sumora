import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { TrackedSource } from '../../../types/models.types';
import { createFollowingStyles } from '../FollowingScreen.styles';
import { CategorySquircleIcon } from '../../../components/atoms/CategorySquircleIcon';
import { getCategoryForChannel, getInitials } from '../types';

export interface ChannelGridCardProps {
  item: TrackedSource;
  isFavorite: boolean;
  styles: ReturnType<typeof createFollowingStyles>;
  onToggle: (source: TrackedSource) => void;
  onToggleFavorite: (source: TrackedSource) => void;
  onPress: (source: TrackedSource) => void;
}

export const ChannelGridCard = React.memo<ChannelGridCardProps>(
  ({ item, isFavorite, styles, onToggle, onToggleFavorite, onPress }) => {
    const category = useMemo(() => getCategoryForChannel(item.sourceName), [item.sourceName]);
    const initials = useMemo(() => getInitials(item.sourceName), [item.sourceName]);
    const isActivelyTracked = item.isActive !== false;

    const handleCardPress = useCallback(() => onPress(item), [onPress, item]);
    const handleTogglePress = useCallback(() => onToggle(item), [onToggle, item]);
    const handleFavoritePress = useCallback(() => onToggleFavorite(item), [onToggleFavorite, item]);

    return (
      <TouchableOpacity
        style={styles.channelGridCard}
        onPress={handleCardPress}
        activeOpacity={0.8}>
        {/* Top bar: Category badge on left, Star priority button on right */}
        <View style={styles.gridCardTopRow}>
          {category ? (
            <View style={styles.gridCategoryBadge}>
              <CategorySquircleIcon category={category.id} size={14} style={localStyles.catIcon} />
              <Text style={styles.gridCategoryText} numberOfLines={1}>
                {category.label.split(' ')[0]}
              </Text>
            </View>
          ) : (
            <View style={localStyles.spacer} />
          )}

          <TouchableOpacity
            style={[styles.gridStarBtn, isFavorite && styles.gridStarBtnActive]}
            onPress={handleFavoritePress}
            hitSlop={hitSlop}
            activeOpacity={0.7}>
            <Text style={styles.gridStarIcon}>{isFavorite ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
        </View>

        {/* Center: Circular Avatar */}
        <View style={styles.gridAvatarContainer}>
          {item.thumbnailUrl ? (
            <FastImage
              source={{
                uri: item.thumbnailUrl,
                priority: FastImage.priority.normal,
                cache: FastImage.cacheControl.immutable,
              }}
              style={styles.gridAvatarImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <View style={styles.gridAvatarPlaceholder}>
              <Text style={styles.gridAvatarText}>{initials}</Text>
            </View>
          )}
        </View>

        {/* Channel Name */}
        <Text style={styles.gridChannelTitle} numberOfLines={1}>
          {item.sourceName}
        </Text>

        {/* Subtle tap hint */}
        <Text style={styles.gridSubMeta} numberOfLines={1}>
          Tap to view ›
        </Text>

        {/* Bottom: Tracking Pill Button with Active vs. Inactive styling */}
        <TouchableOpacity
          style={isActivelyTracked ? styles.gridTrackingBtn : styles.gridTrackingBtnInactive}
          onPress={handleTogglePress}
          activeOpacity={0.75}>
          <Text style={isActivelyTracked ? styles.gridTrackingText : styles.gridTrackingTextInactive}>
            {isActivelyTracked ? '⚡ Tracking Active' : '+ Track Channel'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }
);

const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 };
const localStyles = StyleSheet.create({
  catIcon: { marginRight: 4 },
  spacer: { flex: 1 },
});

