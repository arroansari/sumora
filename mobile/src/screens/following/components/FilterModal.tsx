import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { createFollowingStyles } from '../FollowingScreen.styles';
import { CategorySquircleIcon } from '../../../components/atoms/CategorySquircleIcon';
import { CATEGORIES, CategoryId, SORT_OPTIONS, SortFilter } from '../types';

export interface FilterModalProps {
  visible: boolean;
  styles: ReturnType<typeof createFollowingStyles>;
  selectedCategory: CategoryId;
  sortFilter: SortFilter;
  categoryCounts: Record<string, number>;
  onSelectCategory: (id: CategoryId) => void;
  onSelectSort: (sort: SortFilter) => void;
  onReset: () => void;
  onClose: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  styles,
  selectedCategory,
  sortFilter,
  categoryCounts,
  onSelectCategory,
  onSelectSort,
  onReset,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>⚡ Filter & Sort Channels</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Section 1: Categories */}
          <Text style={styles.modalSectionTitle}>Category</Text>
          <View style={styles.modalGrid}>
            <TouchableOpacity
              style={[
                styles.modalChip,
                selectedCategory === 'all' && styles.modalChipActive,
              ]}
              onPress={() => onSelectCategory('all')}
              activeOpacity={0.75}>
              <CategorySquircleIcon category="all" size={17} style={{ marginRight: 6 }} />
              <Text
                style={[
                  styles.modalChipText,
                  selectedCategory === 'all' && styles.modalChipTextActive,
                ]}>
                All ({categoryCounts.all ?? 0})
              </Text>
            </TouchableOpacity>

            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.id] || 0;
              const isActive = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.modalChip, isActive && styles.modalChipActive]}
                  onPress={() => onSelectCategory(cat.id)}
                  activeOpacity={0.75}>
                  <CategorySquircleIcon category={cat.id} size={17} style={{ marginRight: 6 }} />
                  <Text
                    style={[
                      styles.modalChipText,
                      isActive && styles.modalChipTextActive,
                    ]}>
                    {cat.label} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Section 2: Sort Order */}
          <Text style={styles.modalSectionTitle}>Sort Order</Text>
          <View style={styles.modalGrid}>
            {SORT_OPTIONS.map((opt) => {
              const isActive = sortFilter === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.modalChip, isActive && styles.modalChipActive]}
                  onPress={() => onSelectSort(opt.value)}
                  activeOpacity={0.75}>
                  <Text
                    style={[
                      styles.modalChipText,
                      isActive && styles.modalChipTextActive,
                    ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer Buttons */}
          <View style={styles.modalBtnRow}>
            <TouchableOpacity
              style={styles.modalSecondaryBtn}
              onPress={onReset}
              activeOpacity={0.75}>
              <Text style={styles.modalSecondaryBtnText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={onClose}
              activeOpacity={0.8}>
              <Text style={styles.modalPrimaryBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

