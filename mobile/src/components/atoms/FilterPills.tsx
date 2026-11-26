import React, { useCallback } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View, Image } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

export interface FilterPillOption<T extends string> {
  label: string;
  value: T;
}

interface FilterPillsProps<T extends string> {
  options: FilterPillOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  style?: object;
}

function FilterPillsInner<T extends string>({
  options,
  selectedValue,
  onSelect,
  style,
}: FilterPillsProps<T>) {
  const { colors, accentTheme } = useAppTheme();

  const renderPill = useCallback(
    (opt: FilterPillOption<T>) => {
      const isActive = opt.value === selectedValue;
      return (
        <TouchableOpacity
          key={opt.value}
          onPress={() => onSelect(opt.value)}
          style={[
            styles.pill,
            isActive
              ? { backgroundColor: accentTheme.primary, borderColor: 'transparent' }
              : { backgroundColor: 'transparent', borderColor: colors.border },
          ]}
          activeOpacity={0.7}>
          {isActive && (
            <View
              style={[StyleSheet.absoluteFill, { borderRadius: 16, overflow: 'hidden' }]}
              pointerEvents="none">
              <Image
                source={accentTheme.assets.button ?? undefined}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
          )}
          <Text
            style={[
              styles.pillText,
              { color: isActive ? '#FFFFFF' : colors.textSecondary, zIndex: 1 },
            ]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedValue, onSelect, colors, accentTheme]
  );

  return (
    <View style={[styles.wrapper, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {options.map(renderPill)}
      </ScrollView>
    </View>
  );
}

export const FilterPills = React.memo(FilterPillsInner) as typeof FilterPillsInner;

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 6,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  pillText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontWeight: '600',
  },
});

