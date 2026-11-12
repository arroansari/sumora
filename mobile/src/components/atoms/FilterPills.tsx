import React, { useCallback } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
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
  const { colors } = useAppTheme();

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
              ? { backgroundColor: colors.primary, borderColor: colors.primary }
              : { backgroundColor: 'transparent', borderColor: colors.border },
          ]}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.pillText,
              { color: isActive ? '#FFFFFF' : colors.textSecondary },
            ]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedValue, onSelect, colors]
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
    fontWeight: '600',
  },
});

