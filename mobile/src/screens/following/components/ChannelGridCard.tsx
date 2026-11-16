import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
    const category = getCategoryForChannel(item.sourceName);

    return (
      <TouchableOpacity
        style={styles.channelGridCard}
        onPress={() => onPress(item)}
        activeOpacity={0.8}>
        {/* Top bar: Category badge on left, Star priority button on right */}
        <View style={styles.gridCardTopRow}>
          {category ? (
            <View style={styles.gridCategoryBadge}>
              <CategorySquircleIcon category={category.id} size={14} style={{ marginRight: 4 }} />
              <Text style={styles.gridCategoryText} numberOfLines={1}>
                {category.label.split(' ')[0]}
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <TouchableOpacity
            style={[styles.gridStarBtn, isFavorite && styles.gridStarBtnActive]}
            onPress={() => onToggleFavorite(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
              <Text style={styles.gridAvatarText}>{getInitials(item.sourceName)}</Text>
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

        {/* Bottom: Tracking Pill Button */}
        <TouchableOpacity
          style={styles.gridTrackingBtn}
          onPress={() => onToggle(item)}
          activeOpacity={0.75}>
          <Text style={styles.gridTrackingText}>Tracking ✓</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }
);

