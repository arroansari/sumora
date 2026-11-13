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

export const SummaryDetailScreen: React.FC<Props> = ({ route }) => {
  const { videoId, videoTitle } = route.params;
  const { colors } = useAppTheme();
  const styles = useMemo(() => createSummaryDetailStyles(colors), [colors]);

  const [video, setVideo] = useState<VideoItem | null>(null);
  const [summary, setSummary] = useState<VideoSummary | null>(null);
  const [status, setStatus] = useState<SummaryStatus>('pending');
  const [statusMessage, setStatusMessage] = useState<string>('Generating your video summary…');
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);

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
          // Already complete, no need to trigger or poll
          setLoading(false);
          return;
        }

        // Auto-trigger summarization if not completed
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
        message: `Check out this summary of "${video?.title || videoTitle}":\n\n${summary.overview}\n\nRead more on Sumora!`,
      });
    }
  }, [summary, video?.title, videoTitle]);

  const handleOpenOriginalVideo = useCallback(() => {
    const url = summary?.originalVideoUrl || video?.videoUrl || `https://www.youtube.com/watch?v=${videoId}`;
    Linking.openURL(url);
  }, [summary?.originalVideoUrl, video?.videoUrl, videoId]);

  const thumbnailUri =
    video?.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading video details…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
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
      </View>

      <View style={styles.content}>
        {/* 2. Video Title */}
        <Text style={styles.title}>{video?.title || videoTitle || 'Video Summary'}</Text>

        {/* 3. Channel Name & Metadata */}
        <View style={styles.metaRow}>
          <Text style={styles.channelName}>{video?.channelName || 'YouTube Creator'}</Text>
          {summary?.aiProvider && (
            <View style={styles.aiPill}>
              <Text style={styles.aiPillText}>AI: {summary.aiProvider}</Text>
            </View>
          )}
        </View>

        {/* Processing / Generating State Banner */}
        {status !== 'completed' && (
          <View style={styles.statusBox}>
            <ActivityIndicator color={colors.primary} style={{ marginBottom: 12 }} size="small" />
            <Text style={styles.statusBoxText}>{statusMessage}</Text>
            {status === 'failed' && (
              <TouchableOpacity
                style={{
                  marginTop: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                }}
                onPress={handleTriggerSummary}>
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Retry Summarization</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 7 Structured Sections (When Status is 'completed') */}
        {summary && status === 'completed' && (
          <>
            {/* 4. Overview */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>1. Overview</Text>
              <Text style={styles.bodyText}>{summary.overview}</Text>
            </View>

            {/* 5. Key Points */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>2. Key Points</Text>
              {summary.keyPoints?.map((point, index) => (
                <View key={index} style={styles.bulletRow}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.bulletText}>{point}</Text>
                </View>
              ))}
            </View>

            {/* 6. Important Concepts */}
            {summary.importantConcepts && summary.importantConcepts.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeading}>3. Important Concepts</Text>
                {summary.importantConcepts.map((item, index) => (
                  <View key={index} style={styles.conceptItem}>
                    <Text style={styles.conceptTitle}>{item.concept || String(item)}</Text>
                    {item.explanation && (
                      <Text style={styles.conceptExplanation}>{item.explanation}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* 7. Detailed Summary */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>4. Detailed Summary</Text>
              <Text style={styles.bodyText}>{summary.detailedSummary}</Text>
            </View>

            {/* 8. Conclusion */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>5. Conclusion</Text>
              <Text style={styles.bodyText}>{summary.conclusion}</Text>
            </View>

            {/* 9. Topics Covered */}
            {summary.topicsCovered && summary.topicsCovered.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeading}>6. Topics Covered</Text>
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

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.watchOriginalButton} onPress={handleOpenOriginalVideo}>
            <Text style={styles.watchOriginalText}>Watch Original Video ↗</Text>
          </TouchableOpacity>

          {summary && (
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Text style={styles.shareText}>Share Summary ⇪</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};
