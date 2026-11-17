import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import FastImage, { ImageStyle } from '@d11/react-native-fast-image';
import { VideoItem, SummaryStatus } from '../../../types/models.types';
import { createHomeStyles } from '../HomeScreen.styles';
import { GradientButton } from '../../../components/atoms';
import { useAppTheme } from '../../../context/ThemeContext';

export interface FeedCardProps {
  item: VideoItem;
  styles: ReturnType<typeof createHomeStyles>;
  isFavoriteChannel?: boolean;
  isBookmarked?: boolean;
  isCompletedView?: boolean;
  cardHeight?: number;
  onReadSummary: (videoId: string, title: string) => void;
  onWatchVideo: (videoUrl: string) => void;
  onCopyTakeaways: (item: VideoItem) => void;
  onToggleBookmark: (videoId: string, title: string) => void;
  onShareVideo: (item: VideoItem) => void;
  onMarkDone?: (videoId: string, title: string) => void;
  onRestoreVideo?: (videoId: string) => void;
  onChannelPress?: (channelId: string, channelName?: string) => void;
}

const getStatusConfig = (status: SummaryStatus) => {
  switch (status) {
    case 'completed':
      return { dot: '#10B981', label: 'Summary Ready' };
    case 'processing':
      return { dot: '#60A5FA', label: 'Generating Summary...' };
    case 'fetching_transcript':
      return { dot: '#60A5FA', label: 'Fetching Transcript...' };
    case 'transcript_unavailable':
      return { dot: '#FBBF24', label: 'Transcript Unavailable' };
    case 'failed':
      return { dot: '#F87171', label: 'Summary Failed' };
    default:
      return { dot: '#94A3B8', label: 'Pending' };
  }
};

export const FeedItemCard = React.memo<FeedCardProps>(
  ({
    item,
    styles,
    isFavoriteChannel,
    isBookmarked,
    isCompletedView,
    cardHeight,
    onReadSummary,
    onWatchVideo,
    onCopyTakeaways,
    onToggleBookmark,
    onShareVideo,
    onMarkDone,
    onRestoreVideo,
    onChannelPress,
  }) => {
    const { accentTheme } = useAppTheme();
    const publishedFormatted = item.publishedAt
      ? new Date(item.publishedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      : 'Recently';

    const isDetailedReady = item.summaryStatus === 'completed' && !!item.summary?.videoOverview;
    const isProcessing = item.summaryStatus === 'processing';

    const shortOverview = isDetailedReady
      ? item.summary?.videoOverview?.whatViewerLearns || item.summary?.overview || 'Summary ready to read.'
      : isProcessing
        ? 'Distilling video summary…'
        : item.summaryStatus === 'transcript_unavailable'
          ? 'An accessible transcript could not be retrieved, so a summary cannot be generated yet.'
          : item.summaryStatus === 'failed'
            ? 'Unable to generate summary. Tap to retry.'
            : 'Tap Read Summary to generate a detailed breakdown with facts & timestamps.';

    const statusConfig = isDetailedReady
      ? { dot: '#10B981', label: 'Summary Ready' }
      : isProcessing
        ? { dot: '#60A5FA', label: 'Generating Summary...' }
        : { dot: '#8B5CF6', label: 'Tap to Distill' };

    const isCustom = item.isCustomImport || item.channelId === 'imported';

    const takeawayBullets = useMemo(() => {
      if (!isDetailedReady && !item.summary?.keyTakeaways?.length) {
        return [
          'Tap "Read Summary" below to analyze this video.',
          'Extracts chronological timestamps, key facts, and deep insights.',
        ];
      }

      const points: string[] = [];
      if (item.summary?.keyTakeaways && Array.isArray(item.summary.keyTakeaways) && item.summary.keyTakeaways.length > 0) {
        item.summary.keyTakeaways.forEach((p) => {
          const cleaned = p.replace(/^[-•*]\s*/, '').trim();
          if (cleaned && !points.includes(cleaned)) {
            points.push(cleaned);
          }
        });
      } else if (item.summary?.keyPoints && item.summary.keyPoints.length > 0) {
        item.summary.keyPoints.forEach((p) => {
          const cleaned = p.replace(/^[-•*]\s*/, '').trim();
          if (cleaned && !points.includes(cleaned)) {
            points.push(cleaned);
          }
        });
      }

      if (points.length < 5 && item.summary?.conclusion) {
        const cleanedConclusion = item.summary.conclusion.replace(/^[-•*]\s*/, '').trim();
        if (cleanedConclusion && !points.includes(cleanedConclusion)) {
          points.push(cleanedConclusion);
        }
      }

      if (points.length < 5 && item.summary?.importantConcepts && Array.isArray(item.summary.importantConcepts)) {
        item.summary.importantConcepts.forEach((c: any) => {
          if (points.length >= 5) return;
          const text =
            typeof c === 'string'
              ? c
              : c?.explanation
                ? `${c.concept}: ${c.explanation}`
                : c?.concept;
          if (text && !points.includes(text)) {
            points.push(text);
          }
        });
      }

      if (points.length === 0) {
        const text = item.summary?.overview || item.description || shortOverview;
        if (text) {
          const sentences = text
            .split(/(?<=[.?!])\s+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 12);
          if (sentences.length > 0) {
            points.push(...sentences.slice(0, 5));
          }
        }
      }

      if (points.length === 0) {
        points.push(shortOverview);
      }

      return points.slice(0, 4);
    }, [item.summary, item.description, shortOverview]);

    const cardDynamicHeightStyle = useMemo(
      () =>
        cardHeight && cardHeight > 0
          ? { height: cardHeight }
          : undefined,
      [cardHeight]
    );

    return (
      <View style={[styles.cardPageSlot, cardDynamicHeightStyle]}>
        <View style={[styles.card, styles.cardInDeck]}>
          <View style={styles.thumbnailContainer}>
            {item.thumbnailUrl ? (
              <FastImage
                source={{
                  uri: item.thumbnailUrl,
                  priority: FastImage.priority.high,
                  cache: FastImage.cacheControl.immutable,
                }}
                style={styles.thumbnail as ImageStyle}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Text style={styles.placeholderPlayIcon}>▶</Text>
              </View>
            )}
            <View style={styles.badgeOverlay}>
              {isDetailedReady ? (
                <View style={styles.statusBadgeShadowWrapper}>
                  <View style={styles.statusBadgeGradientWrapper}>
                    <Text style={styles.statusSparkle}>✦</Text>
                    <Text style={styles.statusBadgeGradientText}>Summary Ready</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.statusBadge}>
                  <View style={[styles.statusDot, { backgroundColor: statusConfig.dot }]} />
                  <Text style={styles.statusBadgeText}>
                    {statusConfig.label}
                  </Text>
                </View>
              )}
              {isCustom ? (
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>🔗 Custom Link</Text>
                </View>
              ) : isFavoriteChannel ? (
                <View style={styles.favoriteBadge}>
                  <Text style={styles.favoriteBadgeText}>⭐ Priority</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.cardContent}>
            <View>
              <Text style={styles.videoTitle} numberOfLines={2}>
                {item.title}
              </Text>

              <View style={styles.channelRow}>
                <View style={styles.channelInfoCol}>
                  <TouchableOpacity
                    onPress={() => onChannelPress?.(item.channelId, item.channelName)}
                    disabled={!onChannelPress || !item.channelId}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 6 }}>
                    <Text
                      style={styles.channelName}
                      numberOfLines={1}
                      ellipsizeMode="tail">
                      {item.channelName || (isCustom ? 'Custom Link' : 'YouTube Creator')}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.dateText}>{publishedFormatted}</Text>
                </View>

                <View style={styles.utilityActionRow}>
                  <TouchableOpacity
                    style={styles.utilityBtn}
                    onPress={() => onCopyTakeaways(item)}
                    activeOpacity={0.75}
                    accessibilityLabel="Copy summary takeaways">
                    <View style={styles.copyIconWrapper}>
                      <View style={styles.copyBackBox} />
                      <View style={styles.copyFrontBox} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.utilityBtn, isBookmarked && styles.utilityBtnActive]}
                    onPress={() => onToggleBookmark(item.videoId, item.title)}
                    activeOpacity={0.75}
                    accessibilityLabel="Bookmark video summary">
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
                    onPress={() => onShareVideo(item)}
                    activeOpacity={0.75}
                    accessibilityLabel="Share video summary">
                    <View style={styles.shareIconWrapper}>
                      <View style={styles.shareArrowHead} />
                      <View style={styles.shareArrowStem} />
                      <View style={styles.shareTray} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 60-Second Inshorts Key Takeaways */}
              <View style={styles.takeawaysContainer}>
                <View style={styles.takeawaysHeader}>
                  <Text style={styles.takeawaysIcon}>💡</Text>
                  <Text style={styles.takeawaysTitle}>60-Second Takeaways</Text>
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

            <View>
              <View style={styles.actionsRow}>
                <GradientButton
                  title="Read Summary"
                  onPress={() => onReadSummary(item.videoId, item.title)}
                  style={styles.readGradientBtn}
                />

                <TouchableOpacity
                  style={styles.secondaryActionBtn}
                  onPress={() => onWatchVideo(item.videoUrl)}
                  activeOpacity={0.75}>
                  <Text style={styles.secondaryActionBtnText} numberOfLines={1}>
                    Watch
                  </Text>
                </TouchableOpacity>

                {isCompletedView ? (
                  <TouchableOpacity
                    style={styles.restoreButton}
                    onPress={() => onRestoreVideo?.(item.videoId)}
                    activeOpacity={0.75}>
                    <Text style={styles.restoreButtonText}>↺</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => onMarkDone?.(item.videoId, item.title)}
                    activeOpacity={0.75}>
                    <Text style={styles.doneButtonText}>✓ Done</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.swipePromptRow}>
                <Text style={styles.swipePromptText}>▲ Swipe up for next video</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }
);

