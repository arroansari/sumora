import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { SpaceType } from '../../types/models.types';
import { SpaceIcon } from '../atoms/SpaceIcon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 3D Cover Flow geometry
const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.65);
const CARD_HEIGHT = Math.round(SCREEN_HEIGHT * 0.53);
const SPACING = 16;
const CARD_INTERVAL = CARD_WIDTH + SPACING;
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;

export interface SpaceDeckItem {
  id: SpaceType;
  title: string;
  icon: string;
  glowColor: string;
  previewImage: string;
  metaBadge?: string;
  metaBadgePosition?: 'top-left' | 'bottom-left';
  pills: string[];
  bulletTitle: string;
  sideSpineText?: string;
}

export const SPACE_DECK_ITEMS: SpaceDeckItem[] = [
  {
    id: 'YOUTUBE',
    title: 'YouTube Summaries',
    icon: '▶️',
    glowColor: '#8B5CF6', // Signature Violet (distinct from Reddit's orange)
    previewImage: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80', // YouTube video creation & timeline
    metaBadge: '▶ YouTube Summary',
    pills: ['Video Summary', 'Key Chapters', 'Action Items', '1-2 Min Read'],
    bulletTitle: 'Key Video Summary & Chapters',
    sideSpineText: 'YouTube Summaries',
  },
  {
    id: 'REDDIT',
    title: 'Reddit Discussions',
    icon: '💬',
    glowColor: '#FF4500', // Official Reddit Orange
    previewImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    metaBadge: 'r/finance',
    pills: ['Community', 'Consensus', '253 comments', 'Verified'],
    bulletTitle: 'Top Community Debates',
    sideSpineText: 'Reddit Discussions',
  },
  {
    id: 'TMDB',
    title: 'Cinema & OTT',
    icon: '🎬',
    glowColor: '#F59E0B',
    previewImage: 'https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', // Dune: Part Two poster
    metaBadge: 'TMDB 8.4',
    metaBadgePosition: 'bottom-left',
    pills: ['Critic Consensus', 'Streaming Radar', 'Top Rated'],
    bulletTitle: '60-Sec Critic Consensus',
    sideSpineText: 'Cinema & OTT',
  },
  {
    id: 'OPEN_LIBRARY',
    title: 'Book Insights',
    icon: '📚',
    glowColor: '#10B981',
    previewImage: 'https://covers.openlibrary.org/b/id/12843477-L.jpg',
    metaBadge: '⏱ 5-Min Read',
    pills: ['Mental Model', 'Insights', 'Execution', 'Habits', 'Actionable'],
    bulletTitle: 'Mental Model Insights',
    sideSpineText: 'Book Insights',
  },
];

interface Space3DDeckModalProps {
  visible: boolean;
  activeSpace: SpaceType;
  onSelectSpace: (space: SpaceType) => void;
  onClose: () => void;
}

export const Space3DDeckModal: React.FC<Space3DDeckModalProps> = ({
  visible,
  activeSpace,
  onSelectSpace,
  onClose,
}) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);

  const initialIndex = useMemo(() => {
    const idx = SPACE_DECK_ITEMS.findIndex((item) => item.id === activeSpace);
    return idx >= 0 ? idx : 0; // Default to YouTube (first)
  }, [activeSpace]);

  const [activeIndex, setActiveIndex] = useState<number>(initialIndex);

  // Sync scroll on open
  useEffect(() => {
    if (visible) {
      setActiveIndex(initialIndex);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: initialIndex * CARD_INTERVAL,
          animated: false,
        });
      }, 60);
    }
  }, [visible, initialIndex]);

  const handleCardPress = useCallback(
    (spaceId: SpaceType, index: number) => {
      if (index === activeIndex) {
        onSelectSpace(spaceId);
        onClose();
      } else {
        scrollViewRef.current?.scrollTo({
          x: index * CARD_INTERVAL,
          animated: true,
        });
        setActiveIndex(index);
      }
    },
    [activeIndex, onSelectSpace, onClose]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <View style={styles.modalBackdrop}>
        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <View style={{ width: 36 }} />
          <Text style={styles.topBarTitle}>
            ✦ Knowledge Spaces (Swipe to Switch)
          </Text>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            activeOpacity={0.75}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ── Center 3D Perspective Cover Flow Deck ── */}
        <View style={styles.deckContainer}>
          <Animated.ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled={false}
            snapToInterval={CARD_INTERVAL}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum={true}
            contentContainerStyle={{
              paddingLeft: SIDE_PADDING,
              paddingRight: SIDE_PADDING,
              alignItems: 'center',
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              const activeIdx = Math.round(
                e.nativeEvent.contentOffset.x / CARD_INTERVAL
              );
              if (activeIdx >= 0 && activeIdx < SPACE_DECK_ITEMS.length) {
                setActiveIndex(activeIdx);
              }
            }}>
            {SPACE_DECK_ITEMS.map((item, index) => {
              const inputRange = [
                (index - 1) * CARD_INTERVAL,
                index * CARD_INTERVAL,
                (index + 1) * CARD_INTERVAL,
              ];

              const rotateY = scrollX.interpolate({
                inputRange,
                outputRange: ['32deg', '0deg', '-32deg'],
                extrapolate: 'clamp',
              });

              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.82, 1, 0.82],
                extrapolate: 'clamp',
              });

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.70, 1, 0.70],
                extrapolate: 'clamp',
              });

              const translateX = scrollX.interpolate({
                inputRange,
                outputRange: [-36, 0, 36],
                extrapolate: 'clamp',
              });

              const isFocused = activeIndex === index;
              const zIndex = isFocused ? 30 : 20 - Math.abs(index - activeIndex);

              return (
                <View
                  key={item.id}
                  style={{
                    width: CARD_WIDTH,
                    marginRight: index === SPACE_DECK_ITEMS.length - 1 ? 0 : SPACING,
                    zIndex,
                  }}>
                  <Animated.View
                    style={[
                      styles.cardWrapper,
                      {
                        transform: [
                          { perspective: 1000 },
                          { translateX },
                          { scale },
                          { rotateY },
                        ],
                        opacity,
                        borderColor: isFocused ? item.glowColor : 'rgba(255, 255, 255, 0.12)',
                        borderWidth: isFocused ? 1.5 : 1,
                        shadowColor: '#000000',
                        shadowOpacity: isFocused ? 0.40 : 0.20,
                        shadowRadius: isFocused ? 16 : 8,
                        shadowOffset: { width: 0, height: 8 },
                        elevation: isFocused ? 10 : 4,
                      },
                    ]}>
                    <TouchableWithoutFeedback
                      onPress={() => handleCardPress(item.id, index)}>
                      <View style={styles.cardInner}>
                        {/* ── Card Header Row with Custom Squircle Space Icon ── */}
                        <View style={styles.cardHeaderRow}>
                          <SpaceIcon space={item.id} size={28} />
                          <Text style={styles.cardTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                        </View>

                        {/* ── Card Visual Poster / Cover Area ── */}
                        <View style={styles.cardPosterFrame}>
                          <FastImage
                            source={{ uri: item.previewImage }}
                            style={styles.cardPosterImage as any}
                            resizeMode={FastImage.resizeMode.cover}
                          />

                          {/* Subtle Vignette */}
                          <View style={styles.posterOverlay} />

                          {/* Optional badge (e.g. TMDB 8.4 bottom left) */}
                          {item.metaBadge && (
                            <View
                              style={[
                                styles.posterMetaBadge,
                                item.metaBadgePosition === 'bottom-left'
                                  ? { bottom: 8, left: 8 }
                                  : { bottom: 8, right: 8 },
                                { backgroundColor: `${item.glowColor}EE` },
                              ]}>
                              <Text style={styles.posterMetaBadgeText}>
                                {item.metaBadge}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* ── Card Bottom Insights & Pills ── */}
                        <View style={styles.cardBody}>
                          <View style={styles.insightHeaderRow}>
                            <Text style={styles.insightIcon}>💡</Text>
                            <Text style={styles.insightTitle} numberOfLines={1}>
                              {item.bulletTitle}
                            </Text>
                          </View>

                          {/* Glowing Category Pills */}
                          <View style={styles.pillsRow}>
                            {item.pills.map((pill, pIdx) => (
                              <View
                                key={pIdx}
                                style={[
                                  styles.pillItem,
                                  {
                                    borderColor: `${item.glowColor}50`,
                                    backgroundColor: `${item.glowColor}15`,
                                  },
                                ]}>
                                <Text
                                  style={[
                                    styles.pillItemText,
                                    { color: '#E2E8F0' },
                                  ]}>
                                  {pill}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>
                    </TouchableWithoutFeedback>
                  </Animated.View>
                </View>
              );
            })}
          </Animated.ScrollView>
        </View>

        {/* ── Bottom Depth Indicator Bar ── */}
        <View style={styles.bottomBar}>
          <View style={styles.depthPillRow}>
            {SPACE_DECK_ITEMS.map((item, idx) => {
              const isSelected = activeIndex === idx;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.depthPillSegment,
                    isSelected && {
                      backgroundColor: item.glowColor,
                      width: 44,
                      shadowColor: item.glowColor,
                      shadowOpacity: 0.9,
                      shadowRadius: 8,
                    },
                  ]}
                />
              );
            })}
          </View>
          <Text style={styles.bottomPromptText}>
            Tap card to enter space
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#070412',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingBottom: 36,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  topBarTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9E9AB8',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  deckContainer: {
    height: CARD_HEIGHT + 40,
    justifyContent: 'center',
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: '#120E24',
    shadowOffset: { width: 0, height: 8 },
    position: 'relative',
  },
  cardInner: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 12,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(18, 14, 36, 0.95)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 17,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    flex: 1,
  },
  cardPosterFrame: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0A0716',
    marginBottom: 8,
  },
  cardPosterImage: {
    width: '100%',
    height: '100%',
  },
  posterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 4, 18, 0.25)',
  },
  posterMetaBadge: {
    position: 'absolute',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  posterMetaBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardBody: {
    gap: 5,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  insightIcon: {
    fontSize: 11,
  },
  insightTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  pillItem: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  pillItemText: {
    fontSize: 9,
    fontWeight: '600',
  },
  focusedBorderHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    opacity: 0.6,
  },
  bottomBar: {
    alignItems: 'center',
    gap: 12,
  },
  depthPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  depthPillSegment: {
    width: 28,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: '#27243C',
  },
  bottomPromptText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: 0.2,
  },
});
