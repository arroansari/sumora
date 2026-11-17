import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
} from 'react-native';
import { RedditPostItem } from '../../../types/models.types';
import { SpaceIcon } from '../../../components/atoms/SpaceIcon';
import { createHomeStyles } from '../HomeScreen.styles';
import { GradientButton } from '../../../components/atoms';
import { useAppTheme } from '../../../context/ThemeContext';

export interface RedditDiscussionCardProps {
  item: RedditPostItem;
  styles: ReturnType<typeof createHomeStyles>;
  isBookmarked?: boolean;
  isCompletedView?: boolean;
  cardHeight?: number;
  onReadSummary: (postId: string, title: string, item: RedditPostItem) => void;
  onCopyTakeaways: (item: RedditPostItem) => void;
  onToggleBookmark: (postId: string, title: string) => void;
  onShareThread: (item: RedditPostItem) => void;
  onMarkDone?: (postId: string, title: string) => void;
  onRestoreThread?: (postId: string) => void;
}

export const RedditDiscussionCard = React.memo<RedditDiscussionCardProps>(
  ({
    item,
    styles,
    isBookmarked,
    isCompletedView,
    cardHeight,
    onReadSummary,
    onCopyTakeaways,
    onToggleBookmark,
    onShareThread,
    onMarkDone,
    onRestoreThread,
  }) => {
    const { accentTheme } = useAppTheme();

    const publishedFormatted = useMemo(() => {
      if (!item.publishedAt) return 'Today';
      const d = new Date(item.publishedAt);
      const diffMs = Date.now() - d.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      if (hours < 1) return 'Just now';
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }, [item.publishedAt]);

    const formattedScore = useMemo(() => {
      const s = item.score || 0;
      if (s >= 1000) return `${(s / 1000).toFixed(1)}k`;
      return `${s}`;
    }, [item.score]);

    const formattedComments = useMemo(() => {
      const c = item.commentCount || 0;
      if (c >= 1000) return `${(c / 1000).toFixed(1)}k`;
      return `${c}`;
    }, [item.commentCount]);

    const takeawayBullets = useMemo(() => {
      const points: string[] = [];
      const rawList =
        (item.summary as any)?.takeaways || item.summary?.keyTakeaways;
      if (rawList && Array.isArray(rawList)) {
        rawList.forEach((p: string) => {
          const cleaned = p.replace(/^[-•*]\s*/, '').trim();
          if (cleaned && !points.includes(cleaned)) {
            points.push(cleaned);
          }
        });
      }

      if (points.length === 0 && item.summary?.consensus) {
        points.push(`Community Consensus: ${item.summary.consensus}`);
      }

      if (points.length < 4 && item.summary?.contrarianViews && Array.isArray(item.summary.contrarianViews)) {
        item.summary.contrarianViews.forEach((cv) => {
          if (points.length < 4) {
            points.push(`Top Skepticism: ${cv}`);
          }
        });
      }

      if (points.length === 0) {
        if (item.selftext) {
          const sentences = item.selftext
            .split(/(?<=[.?!])\s+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 15);
          points.push(...sentences.slice(0, 4));
        } else {
          points.push(`Community discussion on ${item.title}`);
          points.push(`Top arguments highlighted in r/${item.subreddit} with ${formattedScore} upvotes.`);
          points.push(`Key debate points focusing on practical implications and real-world results.`);
          points.push(`Overall verdict reflects active community engagement and scrutiny.`);
        }
      }

      // Ensure 4 items
      while (points.length < 4) {
        points.push(`Grounded perspective from active r/${item.subreddit} contributors.`);
      }

      return points.slice(0, 4);
    }, [item.summary, item.selftext, item.title, item.subreddit, formattedScore]);

    const cleanSubreddit = useMemo(() => (item.subreddit || '').replace(/^r\//i, ''), [item.subreddit]);
    const cleanAuthor = useMemo(() => (item.author || '').replace(/^u\//i, ''), [item.author]);

    const handleOpenThread = () => {
      const url = item.permalink.startsWith('http')
        ? item.permalink
        : `https://www.reddit.com${item.permalink}`;
      Linking.openURL(url).catch(() => {});
    };

    const cardDynamicHeightStyle = useMemo(
      () => (cardHeight && cardHeight > 0 ? { height: cardHeight } : undefined),
      [cardHeight]
    );

    return (
      <View style={[styles.cardPageSlot, cardDynamicHeightStyle]}>
        <View style={[styles.card, styles.cardInDeck]}>
          {/* Top Visual Community Banner */}
          <View style={[styles.thumbnailContainer, { height: 114, backgroundColor: '#0F172A' }]}>
            <View style={StyleSheet.absoluteFill}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#0F172A',
                  paddingHorizontal: 14,
                  paddingTop: 10,
                  paddingBottom: 8,
                  justifyContent: 'center',
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <SpaceIcon space="REDDIT" size={28} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }} numberOfLines={1}>
                      r/{cleanSubreddit}
                    </Text>
                    <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '500' }} numberOfLines={1}>
                      u/{cleanAuthor} • {publishedFormatted}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{ color: '#CBD5E1', fontSize: 12, lineHeight: 16 }}
                  numberOfLines={1}>
                  {item.selftext || `Discussion thread with ${formattedComments} community replies.`}
                </Text>
              </View>
            </View>

            {/* Top Badge: ✦ Debate Analyzed */}
            <View style={styles.badgeOverlay}>
              <View style={styles.statusBadgeShadowWrapper}>
                <View style={styles.statusBadgeGradientWrapper}>
                  <Text style={styles.statusSparkle}>✦</Text>
                  <Text style={styles.statusBadgeGradientText}>Debate Analyzed</Text>
                </View>
              </View>

              <View style={[styles.customBadge, { backgroundColor: 'rgba(255, 69, 0, 0.25)', borderColor: '#FF4500' }]}>
                <Text style={[styles.customBadgeText, { color: '#FF4500' }]}>Reddit</Text>
              </View>
            </View>
          </View>

          {/* Card Body */}
          <View style={styles.cardContent}>
            <View>
              {/* Thread Headline */}
              <Text style={styles.videoTitle} numberOfLines={2}>
                {item.title}
              </Text>

              {/* Community Metrics Row */}
              <View style={styles.channelRow}>
                <View style={styles.channelInfoCol}>
                  <Text style={[styles.channelName, { color: '#FF4500' }]} numberOfLines={1}>
                    ▲ {formattedScore} upvotes
                  </Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.dateText}>💬 {formattedComments} comments</Text>
                </View>

                {/* Utility Actions */}
                <View style={styles.utilityActionRow}>
                  <TouchableOpacity
                    style={styles.utilityBtn}
                    onPress={() => onCopyTakeaways(item)}
                    activeOpacity={0.75}
                    accessibilityLabel="Copy debate takeaways">
                    <View style={styles.copyIconWrapper}>
                      <View style={styles.copyBackBox} />
                      <View style={styles.copyFrontBox} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.utilityBtn, isBookmarked && styles.utilityBtnActive]}
                    onPress={() => onToggleBookmark(item.externalId, item.title)}
                    activeOpacity={0.75}
                    accessibilityLabel="Bookmark debate">
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
                    onPress={() => onShareThread(item)}
                    activeOpacity={0.75}
                    accessibilityLabel="Share Reddit thread">
                    <View style={styles.shareIconWrapper}>
                      <View style={styles.shareArrowHead} />
                      <View style={styles.shareArrowStem} />
                      <View style={styles.shareTray} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 60-Second Takeaways & Consensus Box */}
              <View style={styles.takeawaysContainer}>
                <View style={styles.takeawaysHeader}>
                  <Text style={styles.takeawaysIcon}>💡</Text>
                  <Text style={styles.takeawaysTitle}>60-Second Takeaways & Consensus</Text>
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
                <GradientButton
                  title="Read Summary"
                  onPress={() => onReadSummary(item.externalId, item.title, item)}
                  style={styles.readGradientBtn}
                />

                <TouchableOpacity
                  style={styles.secondaryActionBtn}
                  onPress={handleOpenThread}
                  activeOpacity={0.75}>
                  <Text style={styles.secondaryActionBtnText} numberOfLines={1}>
                    Open Thread
                  </Text>
                </TouchableOpacity>

                {isCompletedView ? (
                  <TouchableOpacity
                    style={styles.restoreButton}
                    onPress={() => onRestoreThread?.(item.externalId)}
                    activeOpacity={0.75}>
                    <Text style={styles.restoreButtonText}>↺</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => onMarkDone?.(item.externalId, item.title)}
                    activeOpacity={0.75}>
                    <Text style={styles.doneButtonText}>✓ Done</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.swipePromptRow}>
                <Text style={styles.swipePromptText}>▲ Swipe up for next thread</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }
);

