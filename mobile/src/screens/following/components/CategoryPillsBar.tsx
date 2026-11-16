import React from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';
import { createFollowingStyles } from '../FollowingScreen.styles';
import { CategorySquircleIcon } from '../../../components/atoms/CategorySquircleIcon';
import { CATEGORIES, CategoryId } from '../types';

export interface CategoryPillsBarProps {
  styles: ReturnType<typeof createFollowingStyles>;
  selectedCategory: CategoryId;
  totalChannelsCount: number;
  categoryCounts: Record<string, number>;
  onSelectCategory: (catId: CategoryId) => void;
}

export const CategoryPillsBar: React.FC<CategoryPillsBarProps> = ({
  styles,
  selectedCategory,
  totalChannelsCount,
  categoryCounts,
  onSelectCategory,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryPillsRow}
      contentContainerStyle={{ gap: 8, paddingRight: 32 }}>
      <TouchableOpacity
        style={[
          styles.categoryChip,
          selectedCategory === 'all' && styles.categoryChipActive,
        ]}
        onPress={() => onSelectCategory('all')}>
        <CategorySquircleIcon category="all" size={17} style={{ marginRight: 6 }} />
        <Text
          style={[
            styles.categoryChipText,
            selectedCategory === 'all' && styles.categoryChipTextActive,
          ]}>
          All ({totalChannelsCount})
        </Text>
      </TouchableOpacity>

      {CATEGORIES.map((cat) => {
        const count = categoryCounts[cat.id] || 0;
        if (count === 0 && cat.id !== 'favorites') return null;
        const isActive = selectedCategory === cat.id;

        return (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, isActive && styles.categoryChipActive]}
            onPress={() => onSelectCategory(cat.id)}>
            <CategorySquircleIcon category={cat.id} size={17} style={{ marginRight: 6 }} />
            <Text
              style={[
                styles.categoryChipText,
                isActive && styles.categoryChipTextActive,
              ]}>
              {cat.label} ({count})
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};
