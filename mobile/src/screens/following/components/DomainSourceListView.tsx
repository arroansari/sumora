import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { TrackedSource, SpaceType } from '../../../types/models.types';
import { createFollowingStyles } from '../FollowingScreen.styles';
import { useAppTheme } from '../../../context/ThemeContext';
import { SpaceIcon } from '../../../components/atoms/SpaceIcon';

export interface DomainSourceListViewProps {
  space: SpaceType;
  items: TrackedSource[];
  styles: ReturnType<typeof createFollowingStyles>;
  onToggle: (item: TrackedSource) => void;
  onRemove: (item: TrackedSource) => void;
  onOpenAddModal: () => void;
  emptyIcon: string;
  emptyTitle: string;
  emptySubtitle: string;
  addBtnText: string;
  themeColor: string;
  filterCategories?: string[];
  activeFilter?: string;
  onSelectFilter?: (category: string) => void;
}

export const DomainSourceListView: React.FC<DomainSourceListViewProps> = ({
  space,
  items,
  styles,
  onToggle,
  onRemove,
  onOpenAddModal,
  emptyIcon,
  emptyTitle,
  emptySubtitle,
  addBtnText,
  themeColor,
  filterCategories,
  activeFilter = 'All',
  onSelectFilter,
}) => {
  const { colors } = useAppTheme();

  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 10 }}>
      {filterCategories && filterCategories.length > 0 && onSelectFilter && (
        <View style={{ marginBottom: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {filterCategories.map((cat) => {
              const isSelected = activeFilter === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => onSelectFilter(cat)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: isSelected ? themeColor : colors.surface,
                    borderWidth: 1,
                    borderColor: isSelected ? themeColor : colors.border,
                  }}>
                  <Text
                    style={{
                      fontSize: 12.5,
                      fontWeight: isSelected ? '700' : '600',
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                    }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={items}
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
              <SpaceIcon space={space} size={42} />
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
                    ? `${item.memberCount} items available`
                    : space === 'OPEN_LIBRARY'
                    ? 'Bestselling Non-Fiction'
                    : space === 'TMDB'
                    ? 'Active Cinema Radar'
                    : 'Active Source'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Switch
                value={item.isActive !== false}
                onValueChange={() => onToggle(item)}
                trackColor={{ false: colors.border, true: themeColor }}
                thumbColor="#FFFFFF"
              />
              <TouchableOpacity
                onPress={() => onRemove(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ fontSize: 16, color: colors.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={[styles.centerContainer, { paddingHorizontal: 32 }]}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>{emptyIcon}</Text>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
            <TouchableOpacity
              style={{
                backgroundColor: themeColor,
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 14,
                marginTop: 14,
              }}
              onPress={onOpenAddModal}>
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>{addBtnText}</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

