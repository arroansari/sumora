import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Share,
} from 'react-native';
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
  const [statusMessage, setStatusMessage] = useState<string>('Your video summary is being prepared.');
  const [loading, setLoading] = useState<boolean>(true);

  // Performance-oriented mount effect with strictly scoped fetching and cleanup
  useEffect(() => {
    let isMounted = true;

    async function loadSummaryData() {
      try {
        const videoData = await videosApi.getVideo(videoId);
        if (isMounted) {
          setVideo(videoData);
          setSummary(videoData.summary || null);
          setStatus(videoData.summaryStatus);
        }

        const statusData = await videosApi.getSummaryStatus(videoId);
        if (isMounted) {
          setStatus(statusData.status as SummaryStatus);
          setStatusMessage(statusData.message);
        }
      } catch (err: any) {
        console.warn('[SummaryDetail] Failed to fetch live summary:', err.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSummaryData();

    return () => {
      isMounted = false;
    };
  }, [videoId]);

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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading summary details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 1. Video Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {video?.thumbnailUrl ? (
          <Image source={{ uri: video.thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Text style={{ fontSize: 40 }}>▶</Text>
          </View>
        )}
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

        {/* Processing State Banners */}
        {status !== 'completed' && (
          <View style={styles.statusBox}>
            {status === 'processing' || status === 'fetching_transcript' ? (
              <ActivityIndicator color={colors.primary} style={{ marginBottom: 10 }} />
            ) : null}
            <Text style={styles.statusBoxText}>{statusMessage}</Text>
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
