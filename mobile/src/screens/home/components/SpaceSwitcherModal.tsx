import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { SpaceType } from '../../../types/models.types';

export interface SpaceOption {
  id: SpaceType;
  title: string;
  badge: string;
  icon: string;
  description: string;
  accentColor: string;
}

export const SPACES: SpaceOption[] = [
  {
    id: 'YOUTUBE',
    title: 'YouTube Videos',
    badge: 'Video Summaries',
    icon: '▶️',
    description: 'Video summaries & chapter breakdowns from followed channels',
    accentColor: '#6366F1',
  },
  {
    id: 'REDDIT',
    title: 'Reddit Discussions',
    badge: 'Debate & Verdict',
    icon: '💬',
    description: 'Community debate & consensus distilled from top subreddits',
    accentColor: '#FF4500',
  },
  {
    id: 'TMDB',
    title: 'Cinema & OTT',
    badge: 'Spoiler-Free Critics',
    icon: '🎬',
    description: 'TMDB spoiler-free critic consensus & streaming radar',
    accentColor: '#F59E0B',
  },
  {
    id: 'OPEN_LIBRARY',
    title: 'Book Insights',
    badge: '5-Min Mental Models',
    icon: '📚',
    description: 'Open Library non-fiction mental models & 5-min takeaways',
    accentColor: '#10B981',
  },
];

interface SpaceSwitcherModalProps {
  visible: boolean;
  activeSpace: SpaceType;
  onSelectSpace: (space: SpaceType) => void;
  onClose: () => void;
}

export const SpaceSwitcherModal: React.FC<SpaceSwitcherModalProps> = ({
  visible,
  activeSpace,
  onSelectSpace,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Drag Handle Indicator */}
              <View style={styles.handleBar} />

              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.sheetTitle}>Switch Knowledge Space</Text>
                  <Text style={styles.sheetSubtitle}>
                    Select a domain to personalize your intelligence feed
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.spaceList}>
                {SPACES.map((space) => {
                  const isSelected = activeSpace === space.id;
                  return (
                    <TouchableOpacity
                      key={space.id}
                      activeOpacity={0.8}
                      onPress={() => {
                        onSelectSpace(space.id);
                        onClose();
                      }}
                      style={[
                        styles.spaceCard,
                        isSelected && styles.spaceCardActive,
                      ]}>
                      <View
                        style={[
                          styles.iconWrapper,
                          { backgroundColor: `${space.accentColor}18` },
                        ]}>
                        <Text style={styles.iconText}>{space.icon}</Text>
                      </View>

                      <View style={styles.spaceInfo}>
                        <View style={styles.spaceTitleRow}>
                          <Text
                            style={[
                              styles.spaceTitle,
                              isSelected && { color: space.accentColor },
                            ]}>
                            {space.title}
                          </Text>
                          <View
                            style={[
                              styles.badgePill,
                              { backgroundColor: `${space.accentColor}18` },
                            ]}>
                            <Text
                              style={[
                                styles.badgeText,
                                { color: space.accentColor },
                              ]}>
                              {space.badge}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.spaceDesc} numberOfLines={2}>
                          {space.description}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.radioOuter,
                          isSelected && {
                            borderColor: space.accentColor,
                            backgroundColor: space.accentColor,
                          },
                        ]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 25, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handleBar: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  spaceList: {
    gap: 10,
  },
  spaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  spaceCardActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#8B5CF6',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 22,
  },
  spaceInfo: {
    flex: 1,
    marginRight: 10,
  },
  spaceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 3,
  },
  spaceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  spaceDesc: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 15.5,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});
