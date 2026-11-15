import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { ContentPostItem } from '../../../types/models.types';
import { createHomeStyles } from '../HomeScreen.styles';
import { GradientButton } from '../../../components/atoms';

export interface MovieCardProps {
  item: ContentPostItem;
  styles: ReturnType<typeof createHomeStyles>;
  isBookmarked?: boolean;
  isCompletedView?: boolean;
  cardHeight?: number;
  onReadReview: (item: ContentPostItem) => void;
  onCopyTakeaways: (item: ContentPostItem) => void;
  onToggleBookmark: (postId: string, title: string) => void;
  onShareMovie: (item: ContentPostItem) => void;
  onMarkDone?: (postId: string, title: string) => void;
  onRestoreMovie?: (postId: string) => void;
}

export const MovieCard = React.memo<MovieCardProps>(
  ({
    item,
    styles,
    isBookmarked,
    isCompletedView,
    cardHeight,
    onReadReview,
    onCopyTakeaways,
    onToggleBookmark,
    onShareMovie,
    onMarkDone,
    onRestoreMovie,
  }) => {
    const formattedRating = useMemo(() => {
      const r = item.rating || 8.0;
      return r.toFixed(1);
    }, [item.rating]);

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
        points.push(`Consensus: Universally praised for exceptional cinematic scale and gripping storytelling.`);
        points.push(`Performances & Direction: Standout visionary direction by ${item.author || 'the director'} with resonant lead acting.`);
        points.push(`Viewer Caveats: Atmospheric, deliberate pacing that rewards undivided attention.`);
        points.push(`Streaming Availability: Available on ${item.streamingPlatforms?.join(', ') || 'top digital platforms'}.`);
      }

      while (points.length < 4) {
        points.push(`Grounded critic consensus highlights strong audience reception.`);
      }

      return points.slice(0, 4);
    }, [item.summary, item.author, item.streamingPlatforms]);

    const handleWatchTrailer = () => {
      const url = item.trailerUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(item.title + ' official trailer')}`;
      Linking.openURL(url).catch(() => {});
    };

    const cardDynamicHeightStyle = useMemo(
      () => (cardHeight && cardHeight > 0 ? { height: cardHeight } : undefined),
      [cardHeight]
    );

    const bannerImage = item.backdropUrl || item.posterUrl || 'https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s5200SV.jpg';

    return (
      <View style={[styles.cardPageSlot, cardDynamicHeightStyle]}>
        <View style={[styles.card, styles.cardInDeck]}>
          {/* Top Movie Poster / Backdrop Banner */}
          <View style={[styles.thumbnailContainer, { height: 114, backgroundColor: '#0B0F19' }]}>
            <FastImage
              source={{ uri: bannerImage }}
              style={StyleSheet.absoluteFill as any}
              resizeMode={FastImage.resizeMode.cover}
            />

            {/* Gradient Overlays for Readability */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: 'rgba(11, 15, 25, 0.45)',
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
                  backgroundColor: 'rgba(245, 158, 11, 0.95)',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 12,
                }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFFFFF' }}>
                  ★ {formattedRating}/10 TMDB
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 12,
                  borderWidth: 0.5,
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF' }}>
                  🎬 Cinema
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
                  color: 'rgba(255, 255, 255, 0.9)',
                }}
                numberOfLines={1}>
                Dir. {item.author || 'Director'} • {item.releaseYear || '2024'}
              </Text>
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.75)',
                }}>
                ⏱ {item.runtime || '2h 15m'}
              </Text>
            </View>
          </View>

          {/* Card Body */}
          <View style={styles.cardContent}>
            <View>
              <Text style={styles.videoTitle} numberOfLines={2}>
                {item.title}
              </Text>

              {/* Genres & Streaming Row */}
              <View style={styles.channelRow}>
                <View style={[styles.channelInfoCol, { flexWrap: 'nowrap' }]}>
                  <Text style={[styles.channelName, { color: '#F59E0B' }]} numberOfLines={1}>
                    {(item.genres && item.genres.length > 0) ? item.genres.slice(0, 2).join(' • ') : 'Cinema'}
                  </Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.dateText} numberOfLines={1}>
                    {item.streamingPlatforms && item.streamingPlatforms.length > 0
                      ? item.streamingPlatforms.slice(0, 2).join(', ')
                      : 'Digital'}
                  </Text>
                </View>

                {/* Utility Actions */}
                <View style={styles.utilityActionRow}>
                  <TouchableOpacity
                    style={styles.utilityBtn}
                    onPress={() => onCopyTakeaways(item)}
                    activeOpacity={0.75}
                    accessibilityLabel="Copy critic consensus">
                    <View style={styles.copyIconWrapper}>
                      <View style={styles.copyBackBox} />
                      <View style={styles.copyFrontBox} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.utilityBtn, isBookmarked && styles.utilityBtnActive]}
                    onPress={() => onToggleBookmark(item.externalId, item.title)}
                    activeOpacity={0.75}
                    accessibilityLabel="Bookmark movie">
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
                    onPress={() => onShareMovie(item)}
                    activeOpacity={0.75}
                    accessibilityLabel="Share movie">
                    <View style={styles.shareIconWrapper}>
                      <View style={styles.shareArrowHead} />
                      <View style={styles.shareArrowStem} />
                      <View style={styles.shareTray} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 60-Second Critic & Audience Consensus Box */}
              <View style={styles.takeawaysContainer}>
                <View style={styles.takeawaysHeader}>
                  <Text style={styles.takeawaysIcon}>💡</Text>
                  <Text style={styles.takeawaysTitle}>60-Second Critic & Audience Consensus</Text>
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
                  onPress={() => onReadReview(item)}
                  activeOpacity={0.8}>
                  <Text style={styles.readButtonTextLavender}>Read Review</Text>
                </TouchableOpacity>

                <GradientButton
                  title="Watch Trailer"
                  onPress={handleWatchTrailer}
                  style={styles.watchGradientBtn}
                />

                {isCompletedView ? (
                  <TouchableOpacity
                    style={styles.restoreButton}
                    onPress={() => onRestoreMovie?.(item.externalId)}
                    activeOpacity={0.75}>
                    <Text style={styles.restoreButtonText}>↺</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => onMarkDone?.(item.externalId, item.title)}
                    activeOpacity={0.75}>
                    <Text style={styles.doneButtonText}>✓ Watched</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.swipePromptRow}>
                <Text style={styles.swipePromptText}>▲ Swipe up for next movie</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }
);
