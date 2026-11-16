import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Share,
  Alert,
  Image,
  StyleSheet,
} from 'react-native';
import FastImage, { ImageStyle } from '@d11/react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { videosApi, redditApi, contentApi } from '../../services/api';
import { VideoItem, VideoSummary, SummaryStatus, SpaceType } from '../../types/models.types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation.types';
import { createSummaryDetailStyles } from './SummaryDetailScreen.styles';
import { GradientButton, TextScaleScrollbar } from '../../components/atoms';
import { SpaceIcon } from '../../components/atoms/SpaceIcon';

const READ_VIDEOS_KEY = 'sumora:read_video_ids';

type Props = NativeStackScreenProps<RootStackParamList, 'SummaryDetail'>;

type ViewMode = 'highlights' | 'deepdive';

export const SummaryDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const {
    videoId,
    videoTitle,
    space,
    channelName: passedChannelName,
    thumbnailUrl: passedThumbnailUrl,
    publishedAt: passedPublishedAt,
    url: passedUrl,
    readTime: passedReadTime,
    isReddit,
    redditItem,
    summary: passedSummary,
  } = route.params;

  const { colors, accentTheme, textScale, setTextScale, resetTextScale } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createSummaryDetailStyles(colors, textScale), [colors, textScale]);

  // Determine knowledge domain
  const activeSpace: SpaceType = useMemo(() => {
    if (space) return space;
    if (isReddit) return 'REDDIT';
    if (videoId?.startsWith('tmdb_')) return 'TMDB';
    if (videoId?.startsWith('/works/') || videoId?.startsWith('ol_')) return 'OPEN_LIBRARY';
    return 'YOUTUBE';
  }, [space, isReddit, videoId]);

  const [video, setVideo] = useState<VideoItem | null>(null);
  const [summary, setSummary] = useState<VideoSummary | null>(null);
  const [status, setStatus] = useState<SummaryStatus>('pending');
  const [statusMessage, setStatusMessage] = useState<string>('Distilling summary…');
  const [loading, setLoading] = useState<boolean>(true);
  const [, setGenerating] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('highlights');
  const [copied, setCopied] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isScaleVisible, setIsScaleVisible] = useState<boolean>(false);

  useEffect(() => {
    async function checkCompleted() {
      try {
        const stored = await AsyncStorage.getItem(READ_VIDEOS_KEY);
        if (stored) {
          const list: string[] = JSON.parse(stored);
          if (list.includes(videoId)) {
            setIsCompleted(true);
          }
        }
      } catch {}
    }
    checkCompleted();
  }, [videoId]);

  const handleConfirmComplete = useCallback(() => {
    const itemLabel =
      activeSpace === 'OPEN_LIBRARY'
        ? 'book insight'
        : activeSpace === 'TMDB'
        ? 'movie review'
        : activeSpace === 'REDDIT'
        ? 'discussion'
        : 'summary';

    Alert.alert(
      'Mark as Finished?',
      `Did you complete reading this ${itemLabel}? Marking it as finished will archive it from your active feed.`,
      [
        { text: 'Keep in Feed', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              const stored = await AsyncStorage.getItem(READ_VIDEOS_KEY);
              const readIds: string[] = stored ? JSON.parse(stored) : [];
              if (!readIds.includes(videoId)) {
                readIds.push(videoId);
                await AsyncStorage.setItem(READ_VIDEOS_KEY, JSON.stringify(readIds));
              }
              setIsCompleted(true);
              navigation.goBack();
            } catch {
              navigation.goBack();
            }
          },
        },
      ]
    );
  }, [activeSpace, videoId, navigation]);

  const handleRestoreToFeed = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(READ_VIDEOS_KEY);
      if (stored) {
        const readIds: string[] = JSON.parse(stored);
        const updated = readIds.filter((id) => id !== videoId);
        await AsyncStorage.setItem(READ_VIDEOS_KEY, JSON.stringify(updated));
      }
      setIsCompleted(false);
      Alert.alert('Restored', 'This summary has been restored to your active feed.');
    } catch {}
  }, [videoId]);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current || activeSpace !== 'YOUTUBE') return;

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
  }, [activeSpace, videoId]);

  const handleTriggerSummary = useCallback(async () => {
    if (activeSpace !== 'YOUTUBE') return;
    setGenerating(true);
    setStatus('processing');
    setStatusMessage('Distilling summary…');
    try {
      await videosApi.triggerSummarize(videoId);
      startPolling();
    } catch (err: any) {
      console.warn('[SummaryDetail] Trigger error:', err.message);
      setGenerating(false);
    }
  }, [activeSpace, videoId, startPolling]);

  // Load or apply summary data
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      // 1. If summary was already passed from the domain feed (Books, Cinema, Reddit, or YouTube)
      if (passedSummary && passedSummary.overview) {
        const author =
          passedChannelName ||
          (activeSpace === 'OPEN_LIBRARY'
            ? 'Bestselling Author'
            : activeSpace === 'TMDB'
            ? 'TMDB Cinema'
            : activeSpace === 'REDDIT'
            ? 'Reddit Community'
            : 'YouTube Creator');

        const keyPts = passedSummary.keyPoints || [];
        const concepts =
          passedSummary.importantConcepts ||
          keyPts.slice(0, 3).map((pt, idx) => ({
            concept: activeSpace === 'OPEN_LIBRARY' ? `Mental Model ${idx + 1}` : `Key Point ${idx + 1}`,
            explanation: pt,
          }));

        if (!isMounted) return;
        setVideo({
          id: videoId,
          videoId,
          channelId: author,
          channelName: author,
          title: videoTitle || 'Summary',
          videoUrl: passedUrl || '',
          thumbnailUrl: passedThumbnailUrl || undefined,
          publishedAt: passedPublishedAt || new Date().toISOString(),
          transcriptStatus: 'completed',
          summaryStatus: 'completed',
        });
        setSummary({
          videoId,
          overview: passedSummary.overview,
          keyPoints: keyPts,
          importantConcepts: concepts,
          detailedSummary: passedSummary.detailedSummary || passedSummary.overview,
          conclusion: passedSummary.conclusion || '',
          topicsCovered:
            passedSummary.topicsCovered ||
            (activeSpace === 'OPEN_LIBRARY'
              ? ['Non-Fiction', 'Mental Models', 'Actionable Insights']
              : activeSpace === 'TMDB'
              ? ['Cinema', 'Critic Review', 'Trending']
              : activeSpace === 'REDDIT'
              ? ['Debate', 'Community']
              : ['Video Summary']),
          aiProvider:
            activeSpace === 'OPEN_LIBRARY'
              ? 'Open Library Distilled Engine'
              : activeSpace === 'TMDB'
              ? 'TMDB Critic Engine'
              : 'Grounded Engine',
        });
        setStatus('completed');
        setLoading(false);
        return;
      }

      // 2. Reddit Space fetch fallback
      if (activeSpace === 'REDDIT') {
        try {
          const redditSummary = await redditApi.getPostSummary(videoId);
          if (!isMounted) return;
          const sub = redditItem?.subreddit ? `r/${redditItem.subreddit}` : 'Reddit';
          setVideo({
            id: videoId,
            videoId,
            channelId: sub,
            channelName: sub,
            title: videoTitle || redditItem?.title || 'Reddit Community Debate',
            videoUrl: redditItem?.permalink?.startsWith('http')
              ? redditItem.permalink
              : `https://www.reddit.com${redditItem?.permalink || ''}`,
            publishedAt: redditItem?.publishedAt || new Date().toISOString(),
            transcriptStatus: 'completed',
            summaryStatus: 'completed',
          });
          setSummary({
            videoId,
            overview: redditSummary.consensus || 'Community consensus established across top discussions.',
            keyPoints: redditSummary.keyTakeaways || [],
            importantConcepts: (redditSummary.contrarianViews || []).map((cv: string) => ({
              concept: 'Key Skepticism',
              explanation: cv,
            })),
            detailedSummary: redditSummary.fullSummary || redditSummary.consensus || '',
            conclusion: redditSummary.fullSummary || redditSummary.consensus || '',
            topicsCovered: [redditItem?.subreddit || 'reddit', 'community debate'],
            aiProvider: 'Reddit Debate Grounded Engine',
          });
          setStatus('completed');
        } catch {
          if (!isMounted) return;
          const sub = redditItem?.subreddit ? `r/${redditItem.subreddit}` : 'Reddit';
          setVideo({
            id: videoId,
            videoId,
            channelId: sub,
            channelName: sub,
            title: videoTitle || redditItem?.title || 'Reddit Community Debate',
            videoUrl: redditItem?.permalink || 'https://www.reddit.com',
            publishedAt: redditItem?.publishedAt || new Date().toISOString(),
            transcriptStatus: 'completed',
            summaryStatus: 'completed',
          });
          setSummary({
            videoId,
            overview: redditItem?.summary?.consensus || 'Community consensus on this debate thread.',
            keyPoints: redditItem?.summary?.keyTakeaways || [
              'Community Consensus: Majority perspective shared by commenters.',
              'Top Skepticism: Counterarguments and edge-case concerns.',
              'Key Facts & Impact: Practical background knowledge.',
            ],
            importantConcepts: (redditItem?.summary?.contrarianViews || []).map((cv: string) => ({
              concept: 'Key Skepticism',
              explanation: cv,
            })),
            detailedSummary: redditItem?.summary?.fullSummary || redditItem?.selftext || '',
            conclusion: redditItem?.summary?.fullSummary || '',
            topicsCovered: [redditItem?.subreddit || 'reddit', 'debate'],
            aiProvider: 'Reddit Debate Engine',
          });
          setStatus('completed');
        } finally {
          if (isMounted) setLoading(false);
        }
        return;
      }

      // 3. YouTube Space fetch
      if (activeSpace === 'YOUTUBE') {
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

          try {
            await videosApi.triggerSummarize(videoId);
            setGenerating(true);
            setStatus('processing');
            setStatusMessage('Distilling video summary…');
            startPolling();
          } catch {}
        } catch (err: any) {
          console.warn('[SummaryDetail] YouTube initial load error:', err.message);
        } finally {
          if (isMounted) setLoading(false);
        }
        return;
      }

      // 4. On-demand AI summary fetch for Books & Cinema
      try {
        const contentSummary = await contentApi.getSummary(videoId);
        if (!isMounted) return;

        const author = contentSummary?.author || passedChannelName || (activeSpace === 'OPEN_LIBRARY' ? 'Bestselling Author' : 'TMDB Cinema');
        setVideo({
          id: videoId,
          videoId,
          channelId: author,
          channelName: author,
          title: contentSummary?.title || videoTitle || 'Distilled Insight',
          videoUrl: passedUrl || '',
          thumbnailUrl: contentSummary?.posterUrl || passedThumbnailUrl || undefined,
          publishedAt: passedPublishedAt || new Date().toISOString(),
          transcriptStatus: 'completed',
          summaryStatus: 'completed',
        });

        const takeaways = contentSummary?.takeaways || [
          'Core thesis distilled into practical daily takeaways.',
          'Fundamental principles extracted for quick retention.',
          'Real-world mental models and execution steps.',
        ];

        setSummary({
          videoId,
          overview: contentSummary?.consensus || contentSummary?.overview || (activeSpace === 'OPEN_LIBRARY' ? 'Distilled non-fiction mental models and core thesis.' : 'Spoiler-free critical review and streaming availability.'),
          keyPoints: takeaways,
          importantConcepts: takeaways.slice(0, 3).map((t: string, idx: number) => ({
            concept: activeSpace === 'OPEN_LIBRARY' ? `Mental Model ${idx + 1}` : `Key Note ${idx + 1}`,
            explanation: t,
          })),
          detailedSummary: contentSummary?.fullSummary || videoTitle || 'Distilled overview',
          conclusion: contentSummary?.consensus || 'Actionable takeaways.',
          topicsCovered: [activeSpace === 'OPEN_LIBRARY' ? 'Books' : 'Cinema'],
          aiProvider: 'Sumora Grounded Engine',
        });
        setStatus('completed');
      } catch {
        if (!isMounted) return;
        const author = passedChannelName || (activeSpace === 'OPEN_LIBRARY' ? 'Bestselling Author' : 'TMDB Cinema');
        setVideo({
          id: videoId,
          videoId,
          channelId: author,
          channelName: author,
          title: videoTitle || 'Distilled Insight',
          videoUrl: passedUrl || '',
          thumbnailUrl: passedThumbnailUrl || undefined,
          publishedAt: passedPublishedAt || new Date().toISOString(),
          transcriptStatus: 'completed',
          summaryStatus: 'completed',
        });
        setSummary({
          videoId,
          overview:
            activeSpace === 'OPEN_LIBRARY'
              ? 'Core non-fiction mental models and actionable takeaways for sustainable intellectual growth.'
              : 'Spoiler-free critical analysis and streaming intelligence.',
          keyPoints: [
            'High-signal thesis distilled into practical daily takeaways.',
            'Fundamental principles extracted for quick retention.',
            'Real-world mental models and execution steps.',
          ],
          importantConcepts: [
            { concept: 'Key Takeaway', explanation: 'Direct actionable application for personal clarity.' },
          ],
          detailedSummary: videoTitle || 'Distilled overview',
          conclusion: 'Actionable consensus.',
          topicsCovered: [activeSpace === 'OPEN_LIBRARY' ? 'Books' : 'Cinema'],
          aiProvider: 'Sumora Grounded Engine',
        });
        setStatus('completed');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [
    videoId,
    videoTitle,
    activeSpace,
    passedSummary,
    passedChannelName,
    passedThumbnailUrl,
    passedPublishedAt,
    passedUrl,
    redditItem,
    startPolling,
  ]);

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
      `\n💡 Overview:\n${summary.overview}`,
      summary.keyPoints?.length
        ? `\n🎯 Core Takeaways:\n${summary.keyPoints.map((k, i) => `${i + 1}. ${k}`).join('\n')}`
        : '',
      summary.conclusion ? `\n🏁 Verdict:\n${summary.conclusion}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    Share.share({ message: text });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [summary, video?.title, videoTitle]);

  // Dynamic Open Original Link
  const handleOpenOriginal = useCallback(() => {
    const url =
      passedUrl ||
      video?.videoUrl ||
      (activeSpace === 'OPEN_LIBRARY'
        ? 'https://openlibrary.org'
        : activeSpace === 'TMDB'
        ? 'https://www.themoviedb.org'
        : activeSpace === 'REDDIT'
        ? 'https://www.reddit.com'
        : `https://www.youtube.com/watch?v=${videoId}`);

    Linking.openURL(url).catch(() => {
      Alert.alert('Cannot Open Link', 'Unable to open target URL in browser.');
    });
  }, [passedUrl, video?.videoUrl, activeSpace, videoId]);

  // Dynamic Thumbnail URI
  const thumbnailUri = useMemo(() => {
    if (video?.thumbnailUrl) return video.thumbnailUrl;
    if (passedThumbnailUrl) return passedThumbnailUrl;
    if (activeSpace === 'YOUTUBE') return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    return null;
  }, [video?.thumbnailUrl, passedThumbnailUrl, activeSpace, videoId]);

  // Space-Specific Header Labels
  const domainMeta = useMemo(() => {
    switch (activeSpace) {
      case 'OPEN_LIBRARY':
        return {
          headerTitle: 'Book Insights',
          authorDefault: 'Bestselling Author',
          readTimeDefault: '⏱️ 5-min read',
          categoryBadge: '📚 Book Insights',
          heroTitle: '💡 Core Thesis & Mental Models',
          heroBadge: 'THESIS',
          takeawaysTitle: '🎯 Actionable Takeaways',
          conceptsTitle: '🧠 Mental Models & Concepts',
          deepDiveTitle: '📝 Chapter & Concept Breakdown',
          verdictTitle: '🏁 Core Conclusion',
          buttonTitle: 'View on Open Library ↗',
          themeColor: '#10B981',
        };
      case 'TMDB':
        return {
          headerTitle: 'Cinema Radar',
          authorDefault: 'TMDB Cinema',
          readTimeDefault: '🎬 2-min read',
          categoryBadge: '🍿 Critic Consensus',
          heroTitle: '💡 Critic Consensus & Overview',
          heroBadge: 'CONSENSUS',
          takeawaysTitle: '🎯 What Critics Are Saying',
          conceptsTitle: '🧠 Cinematic Highlights & Themes',
          deepDiveTitle: '📝 Story & Screenplay Analysis',
          verdictTitle: '🏁 Critic Verdict',
          buttonTitle: 'View on TMDB Cinema ↗',
          themeColor: '#F59E0B',
        };
      case 'REDDIT':
        return {
          headerTitle: 'Reddit Debate',
          authorDefault: 'Reddit Community',
          readTimeDefault: '💬 3-min read',
          categoryBadge: '🗳️ Top Debate',
          heroTitle: '💡 Community Consensus',
          heroBadge: 'VERDICT',
          takeawaysTitle: '🎯 Core Debate Takeaways',
          conceptsTitle: '🧠 Key Counter-Arguments & Skepticism',
          deepDiveTitle: '📝 Top Perspectives & Threads',
          verdictTitle: '🏁 Final Verdict',
          buttonTitle: 'View on Reddit ↗',
          themeColor: '#FF4500',
        };
      case 'YOUTUBE':
      default:
        return {
          headerTitle: 'Video Summary',
          authorDefault: 'YouTube Creator',
          readTimeDefault: '⏱️ 1-2 min read',
          categoryBadge: '▶️ Video',
          heroTitle: '💡 At a Glance',
          heroBadge: 'TL;DR',
          takeawaysTitle: '🎯 Core Takeaways',
          conceptsTitle: '🧠 What You Need to Know',
          deepDiveTitle: '📝 Detailed Story',
          verdictTitle: '🏁 Final Verdict',
          buttonTitle: 'Watch Full Video ↗',
          themeColor: colors.primary,
        };
    }
  }, [activeSpace, colors.primary]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={domainMeta.themeColor} />
        <Text style={styles.loadingText}>Fetching {domainMeta.headerTitle.toLowerCase()}…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Top Header Banner ── */}
      <View
        style={[
          styles.topHeaderGradient,
          {
            paddingTop: insets.top + 8,
            shadowColor: accentTheme.primaryDark,
          },
        ]}>
        <Image
          source={accentTheme.assets.header}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <View style={styles.topHeaderRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.topHeaderTitle}>{domainMeta.headerTitle}</Text>
          <TouchableOpacity
            style={styles.headerScaleButton}
            onPress={() => setIsScaleVisible((prev) => !prev)}
            activeOpacity={0.75}>
            <Text allowFontScaling={false} style={styles.headerScaleText}>
              Aa {Math.round(textScale * 100)}%
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* 1. Media Preview Area (Adapts to Space) */}
          <View
            style={[
              styles.thumbnailContainer,
              activeSpace === 'OPEN_LIBRARY' && {
                backgroundColor: '#1E1B2E',
                height: 240,
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}>
            {thumbnailUri ? (
              <FastImage
                source={{
                  uri: thumbnailUri,
                  priority: FastImage.priority.high,
                  cache: FastImage.cacheControl.immutable,
                }}
                style={
                  activeSpace === 'OPEN_LIBRARY'
                    ? ({ width: 150, height: 215, borderRadius: 10 } as ImageStyle)
                    : (styles.thumbnail as ImageStyle)
                }
                resizeMode={activeSpace === 'OPEN_LIBRARY' ? FastImage.resizeMode.contain : FastImage.resizeMode.cover}
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surfaceSubtle,
                }}>
                <SpaceIcon space={activeSpace} size={54} />
              </View>
            )}

            {/* ONLY render video play overlay when space is YOUTUBE */}
            {activeSpace === 'YOUTUBE' && (
              <View style={styles.thumbnailOverlay}>
                <View style={styles.playCircle}>
                  <Text style={styles.playTriangle}>▶</Text>
                </View>
              </View>
            )}
          </View>

          {/* 2. Title */}
          <Text
            style={[
              styles.title,
              {
                fontSize: Math.round(21 * textScale),
                lineHeight: Math.round(28 * textScale),
              },
            ]}>
            {video?.title || videoTitle || 'Distilled Insight'}
          </Text>

          {/* 3. Author & Metadata Row */}
          <View style={styles.metaRow}>
            <View style={styles.channelBadge}>
              <Text style={styles.channelName}>
                {video?.channelName || passedChannelName || domainMeta.authorDefault}
              </Text>
            </View>

            <View style={styles.metaPills}>
              <View style={styles.readTimePill}>
                <Text style={styles.readTimeText}>{passedReadTime || domainMeta.readTimeDefault}</Text>
              </View>
              {summary?.aiProvider && (
                <View style={styles.aiPill}>
                  <Text style={styles.aiPillText}>
                    {summary.aiProvider.includes('gemini') ? '✨ Grounded' : summary.aiProvider}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Processing / Distilling State Banner (Only when processing) */}
          {status !== 'completed' && (
            <View style={styles.statusBox}>
              <ActivityIndicator color={domainMeta.themeColor} size="small" />
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
                    backgroundColor: domainMeta.themeColor,
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
                  {/* 1. Overview Card */}
                  <View style={styles.heroCard}>
                    <View style={styles.heroHeader}>
                      <View style={styles.heroTitleRow}>
                        <Text style={styles.heroTitle}>{domainMeta.heroTitle}</Text>
                      </View>
                      <View style={[styles.heroBadge, { backgroundColor: `${domainMeta.themeColor}22` }]}>
                        <Text style={[styles.heroBadgeText, { color: domainMeta.themeColor }]}>
                          {domainMeta.heroBadge}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.heroBodyText,
                        {
                          fontSize: Math.round(15.5 * textScale),
                          lineHeight: Math.round(25 * textScale),
                        },
                      ]}>
                      {summary.overview}
                    </Text>
                  </View>

                  {/* 2. Key Takeaways */}
                  {summary.keyPoints && summary.keyPoints.length > 0 && (
                    <View style={styles.sectionCard}>
                      <View style={styles.sectionHeadingRow}>
                        <Text style={styles.sectionHeading}>{domainMeta.takeawaysTitle}</Text>
                      </View>
                      <View style={styles.takeawaysList}>
                        {summary.keyPoints.map((point, index) => (
                          <View key={index} style={styles.takeawayItem}>
                            <View
                              style={[
                                styles.takeawayNumberBox,
                                { backgroundColor: `${domainMeta.themeColor}18` },
                              ]}>
                              <Text
                                style={[
                                  styles.takeawayNumberText,
                                  { color: domainMeta.themeColor },
                                ]}>
                                {index < 9 ? `0${index + 1}` : `${index + 1}`}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.takeawayText,
                                {
                                  fontSize: Math.round(14.5 * textScale),
                                  lineHeight: Math.round(22 * textScale),
                                },
                              ]}>
                              {point}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* 3. Important Concepts */}
                  {summary.importantConcepts && summary.importantConcepts.length > 0 && (
                    <View style={styles.sectionCard}>
                      <View style={styles.sectionHeadingRow}>
                        <Text style={styles.sectionHeading}>{domainMeta.conceptsTitle}</Text>
                      </View>
                      {summary.importantConcepts.map((item, index) => (
                        <View key={index} style={styles.conceptItem}>
                          <Text
                            style={[
                              styles.conceptTitle,
                              {
                                fontSize: Math.round(14.5 * textScale),
                                color: domainMeta.themeColor,
                              },
                            ]}>
                            {item.concept || String(item)}
                          </Text>
                          {item.explanation && (
                            <Text
                              style={[
                                styles.conceptExplanation,
                                {
                                  fontSize: Math.round(13.5 * textScale),
                                  lineHeight: Math.round(20 * textScale),
                                },
                              ]}>
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
                        <Text style={styles.sectionHeading}>{domainMeta.deepDiveTitle}</Text>
                      </View>
                      <Text
                        style={[
                          styles.bodyText,
                          {
                            fontSize: Math.round(15 * textScale),
                            lineHeight: Math.round(24 * textScale),
                          },
                        ]}>
                        {summary.detailedSummary}
                      </Text>
                    </View>
                  )}

                  {/* Final Verdict */}
                  {summary.conclusion && (
                    <View style={styles.sectionCard}>
                      <View style={styles.sectionHeadingRow}>
                        <Text style={styles.sectionHeading}>{domainMeta.verdictTitle}</Text>
                      </View>
                      <Text
                        style={[
                          styles.bodyText,
                          {
                            fontSize: Math.round(15 * textScale),
                            lineHeight: Math.round(24 * textScale),
                          },
                        ]}>
                        {summary.conclusion}
                      </Text>
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

          {/* Completion & Auto-Archive Prompt Card */}
          {summary && (
            <View style={styles.completionCard}>
              <View style={styles.completionHeaderRow}>
                <Text style={styles.completionEmoji}>{isCompleted ? '🎉' : '🎓'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.completionTitle}>
                    {isCompleted ? 'Finished!' : 'Finished this summary?'}
                  </Text>
                  <Text style={styles.completionSubtitle}>
                    {isCompleted
                      ? 'This item has been completed and removed from your active Activity Feed.'
                      : 'Mark as completed to automatically archive it and keep your feed fresh.'}
                  </Text>
                </View>
              </View>

              {isCompleted ? (
                <TouchableOpacity
                  style={styles.completedBadgeBox}
                  onPress={handleRestoreToFeed}
                  activeOpacity={0.75}>
                  <Text style={styles.completedBadgeText}>↺ Restore to Feed</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.completeBtn, { backgroundColor: domainMeta.themeColor }]}
                  onPress={handleConfirmComplete}
                  activeOpacity={0.8}>
                  <Text style={styles.completeBtnText}>✅ Yes, Mark Finished & Archive</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <GradientButton
              title={domainMeta.buttonTitle}
              onPress={handleOpenOriginal}
              style={[
                styles.watchOriginalGradient,
                activeSpace === 'OPEN_LIBRARY' && { shadowColor: '#10B981' },
                activeSpace === 'TMDB' && { shadowColor: '#F59E0B' },
              ]}
              textStyle={styles.watchOriginalText}
            />

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

      {/* Dynamic Text Scaling Dropdown */}
      <TextScaleScrollbar
        textScale={textScale}
        onChangeScale={setTextScale}
        onResetScale={resetTextScale}
        accentTheme={accentTheme}
        colors={colors}
        expanded={isScaleVisible}
        onClose={() => setIsScaleVisible(false)}
        showFloatingTrigger={false}
        style={{ top: insets.top + 70, right: 18 }}
      />
    </View>
  );
};
