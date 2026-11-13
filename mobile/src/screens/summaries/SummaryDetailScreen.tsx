import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Share,
} from 'react-native';
import FastImage, { ImageStyle } from '@d11/react-native-fast-image';
import { useAppTheme } from '../../context/ThemeContext';
import { videosApi } from '../../services/api';
import { VideoItem, VideoSummary, SummaryStatus } from '../../types/models.types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation.types';
import { createSummaryDetailStyles } from './SummaryDetailScreen.styles';

type Props = NativeStackScreenProps<RootStackParamList, 'SummaryDetail'>;

type ViewMode = 'highlights' | 'deepdive';

export const SummaryDetailScreen: React.FC<Props> = ({ route }) => {
  const { videoId, videoTitle } = route.params;
  const { colors } = useAppTheme();
  const styles = useMemo(() => createSummaryDetailStyles(colors), [colors]);

  const [video, setVideo] = useState<VideoItem | null>(null);
  const [summary, setSummary] = useState<VideoSummary | null>(null);
  const [status, setStatus] = useState<SummaryStatus>('pending');
  const [statusMessage, setStatusMessage] = useState<string>('Distilling video with Gemini AI…');
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('highlights');
  const [copied, setCopied] = useState<boolean>(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return;

    pollTimerRef.current = setInterval(async () => {
      try {
        const freshVideo = await videosApi.getVideo(videoId);
        if (freshVideo.summaryStatus === 'completed' && freshVideo.summary) {
          setVideo(freshVideo);
          setSummary(freshVideo.summary);
          setStatus('completed');
          setGenerating(false);
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
        } else if (freshVideo.summaryStatus === 'failed') {
          setStatus('failed');
          setStatusMessage('Failed to generate summary. Tap below to retry.');
          setGenerating(false);
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
        } else {
          setStatus(freshVideo.summaryStatus);
        }
      } catch (err: any) {
        console.warn('[SummaryDetail] Polling error:', err.message);
      }
    }, 2500);
  }, [videoId]);

  const handleTriggerSummary = useCallback(async () => {
    setGenerating(true);
    setStatus('processing');
    setStatusMessage('Distilling video with Gemini AI…');
    try {
      await videosApi.triggerSummarize(videoId);
      startPolling();
    } catch (err: any) {
      console.warn('[SummaryDetail] Trigger error:', err.message);
      setGenerating(false);
    }
  }, [videoId, startPolling]);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const videoData = await videosApi.getVideo(videoId);
        if (!isMounted) return;

        setVideo(videoData);
        setSummary(videoData.summary || null);
        setStatus(videoData.summaryStatus);

        if (videoData.summaryStatus === 'completed') {
          setLoading(false);
          return;
        }

        // Auto-trigger summarization if not yet completed
        try {
          await videosApi.triggerSummarize(videoId);
          setGenerating(true);
          setStatus('processing');
          setStatusMessage('Distilling video with Gemini AI…');
          startPolling();
        } catch (trigErr: any) {
          console.warn('[SummaryDetail] Auto-trigger note:', trigErr.message);
        }
      } catch (err: any) {
        console.warn('[SummaryDetail] Initial load error:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [videoId, startPolling]);

  const handleShare = useCallback(() => {
    if (summary) {
      Share.share({
        message: `✨ Summary of "${video?.title || videoTitle}":\n\n${summary.overview}\n\nKey Takeaway:\n• ${summary.keyPoints?.[0] || ''}\n\nDistilled by Sumora!`,
      });
    }
  }, [summary, video?.title, videoTitle]);

  const handleCopy = useCallback(() => {
    if (!summary) return;
    const text = [
      `📌 ${video?.title || videoTitle}`,
      `\n💡 At a Glance:\n${summary.overview}`,
      summary.keyPoints?.length
        ? `\n🎯 Key Takeaways:\n${summary.keyPoints.map((k, i) => `${i + 1}. ${k}`).join('\n')}`
        : '',
      summary.conclusion ? `\n🏁 Verdict:\n${summary.conclusion}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    Share.share({ message: text });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [summary, video?.title, videoTitle]);

  const handleOpenOriginalVideo = useCallback(() => {
    const url =
      summary?.originalVideoUrl ||
      video?.videoUrl ||
      `https://www.youtube.com/watch?v=${videoId}`;
    Linking.openURL(url);
  }, [summary?.originalVideoUrl, video?.videoUrl, videoId]);

  const thumbnailUri =
    video?.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Fetching video details…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. FastImage Video Thumbnail */}
      <View style={styles.thumbnailContainer}>
        <FastImage
          source={{
            uri: thumbnailUri,
            priority: FastImage.priority.high,
            cache: FastImage.cacheControl.immutable,
          }}
          style={styles.thumbnail as ImageStyle}
          resizeMode={FastImage.resizeMode.cover}
        />
        <View style={styles.thumbnailOverlay} />
      </View>

      <View style={styles.content}>
        {/* 2. Video Title */}
        <Text style={styles.title}>{video?.title || videoTitle || 'Video Summary'}</Text>

        {/* 3. Channel Name & Metadata */}
        <View style={styles.metaRow}>
          <View style={styles.channelBadge}>
            <Text style={styles.channelName}>{video?.channelName || 'YouTube Creator'}</Text>
          </View>

          <View style={styles.metaPills}>
            <View style={styles.readTimePill}>
              <Text style={styles.readTimeText}>⏱️ 1-2 min read</Text>
            </View>
            {summary?.aiProvider && (
              <View style={styles.aiPill}>
                <Text style={styles.aiPillText}>
                  {summary.aiProvider.includes('gemini') ? '✨ Gemini AI' : summary.aiProvider}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Processing / Distilling State Banner */}
        {status !== 'completed' && (
          <View style={styles.statusBox}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.statusBoxTitle}>{statusMessage}</Text>
            <Text style={styles.statusBoxSub}>
              Extracting the core takeaways into easy, bite-sized points…
            </Text>
            {status === 'failed' && (
              <TouchableOpacity
                style={{
                  marginTop: 14,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: colors.primary,
                }}
                onPress={handleTriggerSummary}>
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Retry Distillation</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Summary Content */}
        {summary && status === 'completed' && (
          <>
            {/* View Mode Segment Switcher: Highlights vs Deep Dive */}
            <View style={styles.segmentContainer}>
              <TouchableOpacity
                style={[
                  styles.segmentTab,
                  viewMode === 'highlights' && styles.segmentTabActive,
                ]}
                onPress={() => setViewMode('highlights')}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.segmentText,
                    viewMode === 'highlights' && styles.segmentTextActive,
                  ]}>
                  ⚡ Key Highlights
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentTab,
                  viewMode === 'deepdive' && styles.segmentTabActive,
                ]}
                onPress={() => setViewMode('deepdive')}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.segmentText,
                    viewMode === 'deepdive' && styles.segmentTextActive,
                  ]}>
                  📖 Deep Dive
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: Key Highlights (Bite-sized, zero overwhelm) */}
            {viewMode === 'highlights' && (
              <>
                {/* 1. At a Glance (Hero TL;DR Card) */}
                <View style={styles.heroCard}>
                  <View style={styles.heroHeader}>
                    <View style={styles.heroTitleRow}>
                      <Text style={styles.heroTitle}>💡 At a Glance</Text>
                    </View>
                    <View style={styles.heroBadge}>
                      <Text style={styles.heroBadgeText}>TL;DR</Text>
                    </View>
                  </View>
                  <Text style={styles.heroBodyText}>{summary.overview}</Text>
                </View>

                {/* 2. Key Takeaways */}
                {summary.keyPoints && summary.keyPoints.length > 0 && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeadingRow}>
                      <Text style={styles.sectionHeading}>🎯 Core Takeaways</Text>
                    </View>
                    <View style={styles.takeawaysList}>
                      {summary.keyPoints.map((point, index) => (
                        <View key={index} style={styles.takeawayItem}>
                          <View style={styles.takeawayNumberBox}>
                            <Text style={styles.takeawayNumberText}>
                              {index < 9 ? `0${index + 1}` : `${index + 1}`}
                            </Text>
                          </View>
                          <Text style={styles.takeawayText}>{point}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* 3. Important Concepts */}
                {summary.importantConcepts && summary.importantConcepts.length > 0 && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeadingRow}>
                      <Text style={styles.sectionHeading}>🧠 What You Need to Know</Text>
                    </View>
                    {summary.importantConcepts.map((item, index) => (
                      <View key={index} style={styles.conceptItem}>
                        <Text style={styles.conceptTitle}>
                          {item.concept || String(item)}
                        </Text>
                        {item.explanation && (
                          <Text style={styles.conceptExplanation}>
                            {item.explanation}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* TAB 2: Deep Dive (Full Story Breakdown) */}
            {viewMode === 'deepdive' && (
              <>
                {/* Detailed Breakdown */}
                {summary.detailedSummary && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeadingRow}>
                      <Text style={styles.sectionHeading}>📝 Detailed Story</Text>
                    </View>
                    <Text style={styles.bodyText}>{summary.detailedSummary}</Text>
                  </View>
                )}

                {/* Final Verdict */}
                {summary.conclusion && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeadingRow}>
                      <Text style={styles.sectionHeading}>🏁 Final Verdict</Text>
                    </View>
                    <Text style={styles.bodyText}>{summary.conclusion}</Text>
                  </View>
                )}

                {/* Topics Covered */}
                {summary.topicsCovered && summary.topicsCovered.length > 0 && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeadingRow}>
                      <Text style={styles.sectionHeading}>🏷️ Topics Covered</Text>
                    </View>
                    <View style={styles.topicsRow}>
                      {summary.topicsCovered.map((topic, index) => (
                        <View key={index} style={styles.topicBadge}>
                          <Text style={styles.topicBadgeText}>#{topic}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.watchOriginalButton}
            onPress={handleOpenOriginalVideo}
            activeOpacity={0.85}>
            <Text style={styles.watchOriginalText}>▶  Watch on YouTube ↗</Text>
          </TouchableOpacity>

          {summary && (
            <View style={styles.shareRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleCopy}
                activeOpacity={0.75}>
                <Text style={styles.secondaryButtonText}>
                  {copied ? '✓ Copied!' : '📋 Copy Summary'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleShare}
                activeOpacity={0.75}>
                <Text style={styles.secondaryButtonText}>⇪ Share</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};
