import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { TrackedSource } from '../../../types/models.types';
import { createFollowingStyles } from '../FollowingScreen.styles';
import { useAppTheme } from '../../../context/ThemeContext';
import { CategoryId } from '../types';

export interface PriorityChannelsBarProps {
  prioritySources: TrackedSource[];
  styles: ReturnType<typeof createFollowingStyles>;
  selectedCategory: CategoryId;
  onToggleCategoryFilter: () => void;
  onChannelPress: (item: TrackedSource) => void;
}

export const PriorityChannelsBar: React.FC<PriorityChannelsBarProps> = ({
  prioritySources,
  styles,
  selectedCategory,
  onToggleCategoryFilter,
  onChannelPress,
}) => {
  const { accentTheme } = useAppTheme();

  return (
    <View style={styles.prioritySection}>
      <View style={styles.priorityHeaderRow}>
        <Text style={styles.priorityHeaderTitle}>Priority Channels</Text>
        <TouchableOpacity onPress={onToggleCategoryFilter} activeOpacity={0.75}>
          <Text style={styles.prioritySeeAllText}>
            {selectedCategory === 'favorites' ? 'Show All' : 'See all'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.priorityScrollContent}>
        {prioritySources.map((item) => (
          <TouchableOpacity
            key={item.sourceId}
            style={styles.priorityItem}
            onPress={() => onChannelPress(item)}
            activeOpacity={0.8}>
            <View style={styles.gradientRingWrapper}>
              <Image
                source={accentTheme.assets.swatch}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
              <View style={styles.avatarInnerGap}>
                {item.thumbnailUrl ? (
                  <FastImage
                    source={{
                      uri: item.thumbnailUrl,
                      priority: FastImage.priority.high,
                      cache: FastImage.cacheControl.immutable,
                    }}
                    style={styles.priorityAvatar}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                ) : (
                  <View style={styles.priorityAvatarPlaceholder}>
                    <Text style={styles.priorityAvatarInitial}>
                      {item.sourceName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.priorityName} numberOfLines={1}>
              {item.sourceName}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.priorityItem}
          onPress={() => {
            Alert.alert(
              'Add Priority Channel',
              'Tap the ⭐ star button on any channel in the grid below to pin it to Priority Channels!'
            );
          }}
          activeOpacity={0.8}>
          <View style={styles.priorityAddButton}>
            <Text style={styles.priorityAddText}>+</Text>
          </View>
          <Text style={styles.priorityName} numberOfLines={1}>
            Add More
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
