import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { SpaceIcon } from '../../../components/atoms/SpaceIcon';
import { ContentPostItem } from '../../../types/models.types';
import { createHomeStyles } from '../HomeScreen.styles';
import { GradientButton } from '../../../components/atoms';

export interface BookCardProps {
  item: ContentPostItem;
  styles: ReturnType<typeof createHomeStyles>;
  isBookmarked?: boolean;
  isCompletedView?: boolean;
  cardHeight?: number;
  onReadSummary: (item: ContentPostItem) => void;
  onCopyTakeaways: (item: ContentPostItem) => void;
  onToggleBookmark: (postId: string, title: string) => void;
  onShareBook: (item: ContentPostItem) => void;
  onMarkDone?: (postId: string, title: string) => void;
  onRestoreBook?: (postId: string) => void;
}

export const BookCard = React.memo<BookCardProps>(
  ({
    item,
    styles,
    isBookmarked,
    isCompletedView,
    cardHeight,
    onReadSummary,
    onCopyTakeaways,
    onToggleBookmark,
    onShareBook,
    onMarkDone,
    onRestoreBook,
  }) => {
    const takeawayBullets = useMemo(() => {
      const points: string[] = [];
      const rawList = item.summary?.takeaways;
      if (rawList && Array.isArray(rawList)) {
        rawList.forEach((p: string) => {
          const cleaned = p.replace(/^[-•*]\s*/, '').trim();
          if (cleaned && !points.includes(cleaned)) {
            points.push(cleaned);
          }
        });
      }

      if (points.length === 0) {
        points.push(`Core Thesis: Practical mental models to compound personal effectiveness and clear thinking.`);
        points.push(`Mental Model 1 (First Principles): Break down complex challenges to basic truths and reconstruct solutions.`);
        points.push(`Mental Model 2 (Habit Loops): Consistent small actions produce non-linear returns over prolonged horizons.`);
        points.push(`Practical Application: Implement daily focused execution blocks with zero distraction.`);
      }

      while (points.length < 4) {
        points.push(`Grounded mental framework for high-leverage intellectual clarity.`);
      }

      return points.slice(0, 4);
    }, [item.summary]);

    const handleAudioDigest = () => {
      Alert.alert(
        '🎧 Audio Digest',
        `Narrating 4 Core Mental Models for "${item.title}" by ${item.author || 'Author'}.\n\n• ${takeawayBullets[0]}\n• ${takeawayBullets[1]}`,
        [{ text: 'Close' }]
      );
    };

    const cardDynamicHeightStyle = useMemo(
      () => (cardHeight && cardHeight > 0 ? { height: cardHeight } : undefined),
      [cardHeight]
    );

    const coverImage = item.posterUrl || 'https://covers.openlibrary.org/b/id/12843477-L.jpg';

    return (
      <View style={[styles.cardPageSlot, cardDynamicHeightStyle]}>
        <View style={[styles.card, styles.cardInDeck]}>
          {/* Top Book Cover Banner */}
          <View style={[styles.thumbnailContainer, { height: 114, backgroundColor: '#1E1B4B' }]}>
            <FastImage
              source={{ uri: coverImage }}
              style={StyleSheet.absoluteFill as any}
              resizeMode={FastImage.resizeMode.cover}
            />

            {/* Gradient Darkening Overlay */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                },
              ]}
            />

            {/* Top Badges Row */}
            <View
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                right: 8,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(16, 185, 129, 0.95)',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 12,
                }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFFFFF' }}>
                  ⏱ {item.readTime || '5-Min Read'}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 12,
                  borderWidth: 0.5,
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                }}>
                <SpaceIcon space="OPEN_LIBRARY" size={13} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF' }}>
                  Books
                </Text>
              </View>
            </View>

            {/* Bottom Meta Overlay on Banner */}
            <View
              style={{
                position: 'absolute',
                bottom: 6,
                left: 10,
                right: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: 'rgba(255, 255, 255, 0.95)',
                }}
                numberOfLines={1}>
                By {item.author || 'Author'}
              </Text>
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.8)',
                }}>
                📖 {item.pageCount || 280} pages
              </Text>
            </View>
          </View>

          {/* Card Body */}
          <View style={styles.cardContent}>
            <View>
              <Text style={styles.videoTitle} numberOfLines={2}>
                {item.title}
              </Text>

              {/* Categories & Author Row */}
              <View style={styles.channelRow}>
                <View style={[styles.channelInfoCol, { flexWrap: 'nowrap' }]}>
                  <Text style={[styles.channelName, { color: '#10B981' }]} numberOfLines={1}>
                    {(item.categories && item.categories.length > 0) ? item.categories.slice(0, 2).join(' • ') : 'Non-Fiction'}
                  </Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.dateText} numberOfLines={1}>
                    NYT Bestseller
                  </Text>
                </View>

                {/* Utility Actions */}
                <View style={styles.utilityActionRow}>
                  <TouchableOpacity
                    style={styles.utilityBtn}
                    onPress={() => onCopyTakeaways(item)}
                    activeOpacity={0.75}
                    accessibilityLabel="Copy mental models">
                    <View style={styles.copyIconWrapper}>
                      <View style={styles.copyBackBox} />
                      <View style={styles.copyFrontBox} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.utilityBtn, isBookmarked && styles.utilityBtnActive]}
                    onPress={() => onToggleBookmark(item.externalId, item.title)}
                    activeOpacity={0.75}
                    accessibilityLabel="Bookmark book">
                    <Image
                      source={
                        isBookmarked
                          ? require('../../../assets/images/bookmark_filled.png')
                          : require('../../../assets/images/bookmark_outline.png')
                      }
                      style={styles.bookmarkImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.utilityBtn}
                    onPress={() => onShareBook(item)}
                    activeOpacity={0.75}
                    accessibilityLabel="Share book">
                    <View style={styles.shareIconWrapper}>
                      <View style={styles.shareArrowHead} />
                      <View style={styles.shareArrowStem} />
                      <View style={styles.shareTray} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 4 Core Mental Models & Takeaways Box */}
              <View style={styles.takeawaysContainer}>
                <View style={styles.takeawaysHeader}>
                  <Text style={styles.takeawaysIcon}>💡</Text>
                  <Text style={styles.takeawaysTitle}>4 Core Mental Models & Takeaways</Text>
                </View>
                {takeawayBullets.map((bullet, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText} numberOfLines={2}>
                      {bullet}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Action Row */}
            <View>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.readButtonLavender}
                  onPress={() => onReadSummary(item)}
                  activeOpacity={0.8}>
                  <Text style={styles.readButtonTextLavender} numberOfLines={1}>
                    Read Summary
                  </Text>
                </TouchableOpacity>

                <GradientButton
                  title="Audio Digest"
                  onPress={handleAudioDigest}
                  style={styles.watchGradientBtn}
                  textStyle={{ fontSize: 13, letterSpacing: -0.2 }}
                />

                {isCompletedView ? (
                  <TouchableOpacity
                    style={styles.restoreButton}
                    onPress={() => onRestoreBook?.(item.externalId)}
                    activeOpacity={0.75}>
                    <Text style={styles.restoreButtonText}>↺</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => onMarkDone?.(item.externalId, item.title)}
                    activeOpacity={0.75}>
                    <Text style={styles.doneButtonText}>✓ Finished</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.swipePromptRow}>
                <Text style={styles.swipePromptText}>▲ Swipe up for next book</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }
);
