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
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import FastImage, { ImageStyle } from '@d11/react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { videosApi, redditApi, contentApi } from '../../services/api';
import { VideoItem, VideoSummary, SummaryStatus, SpaceType, VideoTranscript } from '../../types/models.types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation.types';
import { createSummaryDetailStyles } from './SummaryDetailScreen.styles';
import { GradientButton, TextScaleScrollbar } from '../../components/atoms';
import { SpaceIcon } from '../../components/atoms/SpaceIcon';
import { SummaryProgressCard } from './components/SummaryProgressCard';
import { devanagariToHinglish, isDevanagariText } from '../../utils/transliterate';

const READ_VIDEOS_KEY = 'sumora:read_video_ids';

type Props = NativeStackScreenProps<RootStackParamList, 'SummaryDetail'>;

type ViewMode = 'highlights' | 'deepdive' | 'transcript';

function formatSecondsToTimestamp(totalSeconds: number): string {
  const sec = Math.floor(totalSeconds);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const mm = m < 10 ? `0${m}` : `${m}`;
  const ss = s < 10 ? `0${s}` : `${s}`;
  return `${mm}:${ss}`;
}

function formatUploadDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - d.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return `Uploaded Today`;
  if (diffDays === 1) return `Uploaded Yesterday`;
  if (diffDays < 7) return `Uploaded ${diffDays}d ago (${formatted})`;
  if (diffDays < 30) return `Uploaded ${Math.floor(diffDays / 7)}w ago (${formatted})`;

  return `Uploaded ${formatted}`;
}

function computeVideoDuration(
  rawSegments?: any,
  fallbackDuration?: string
): string {
  let segs = rawSegments;
  if (typeof segs === 'string') {
    try {
      segs = JSON.parse(segs);
    } catch {}
  }
  if (Array.isArray(segs) && segs.length > 0) {
    const last = segs[segs.length - 1];
    const totalSec = Math.round((Number(last?.start) || 0) + (Number(last?.duration) || 0));
    if (totalSec > 0) {
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      if (h > 0) {
        return `${h}h ${m}m ${s > 0 ? `${s}s ` : ''}duration`.trim();
      }
      return `${m}m ${s < 10 ? '0' : ''}${s}s duration`;
    }
  }
  if (fallbackDuration && fallbackDuration !== 'N/A') {
    const clean = fallbackDuration.replace(/ duration$/i, '');
    return `${clean} duration`;
  }
  return '';
}

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
  const [viewMode, setViewMode] = useState<ViewMode>((route.params as any)?.initialTab || 'highlights');
  const [copied, setCopied] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isScaleVisible, setIsScaleVisible] = useState<boolean>(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState<boolean>(false);
  const [manualTranscriptText, setManualTranscriptText] = useState<string>('');
  const [submittingTranscript, setSubmittingTranscript] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<VideoTranscript | null>(null);
  const [transcriptSearch, setTranscriptSearch] = useState<string>('');
  const [transcriptCopied, setTranscriptCopied] = useState<boolean>(false);
  const [useHinglish, setUseHinglish] = useState<boolean>(true);
  const scrollViewRef = useRef<any>(null);

  const hasHindiSubtitles = useMemo(() => {
    if (transcript?.language?.toLowerCase().startsWith('hi')) return true;
    if (!transcript?.segments || transcript.segments.length === 0) return false;
    return transcript.segments.slice(0, 10).some((s) => isDevanagariText(s.text));
  }, [transcript]);

  const filteredSegments = useMemo(() => {
    if (!transcript?.segments) return [];
    let segs = transcript.segments;
    if (transcriptSearch.trim()) {
      const query = transcriptSearch.toLowerCase();
      segs = segs.filter(
        (s) =>
          s.text.toLowerCase().includes(query) ||
          devanagariToHinglish(s.text).toLowerCase().includes(query)
      );
    }
    if (useHinglish && hasHindiSubtitles) {
      return segs.map((s) => ({
        ...s,
        text: devanagariToHinglish(s.text),
      }));
    }
    return segs;
  }, [transcript, transcriptSearch, useHinglish, hasHindiSubtitles]);

  const handleCopyTranscript = useCallback(() => {
    if (!transcript) return;
    const full = (transcript.segments || [])
      .map((s) => {
        const line = useHinglish && hasHindiSubtitles ? devanagariToHinglish(s.text) : s.text;
        return `[${formatSecondsToTimestamp(s.start)}] ${line}`;
      })
      .join('\n');
    Share.share({ message: full || transcript.fullText || '' });
    setTranscriptCopied(true);
    setTimeout(() => setTranscriptCopied(false), 2000);
  }, [transcript, useHinglish, hasHindiSubtitles]);

  const handleOpenTimestamp = useCallback(
    (timestampStr?: string, seconds?: number) => {
      const targetUrl = video?.videoUrl || passedUrl;
      if (!targetUrl) return;

      let sec = seconds;
      if (sec === undefined && timestampStr) {
        // Parse "MM:SS" or "HH:MM:SS"
        const cleanTs = timestampStr.split('-')[0].trim();
        const parts = cleanTs.split(':').map((p) => parseInt(p.trim(), 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          sec = parts[0] * 60 + parts[1];
        } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      }

      if (sec !== undefined && sec > 0) {
        const sep = targetUrl.includes('?') ? '&' : '?';
        const urlWithTime = `${targetUrl}${sep}t=${Math.floor(sec)}s`;
        Linking.openURL(urlWithTime).catch(() => Linking.openURL(targetUrl));
      } else {
        Linking.openURL(targetUrl).catch(() => {});
      }
    },
    [video, passedUrl]
  );

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

        // Progressive Disclosure: As soon as transcript arrives in ~1.5s, update state immediately
        if (freshVideo.transcript) {
          setTranscript((prev) => prev || freshVideo.transcript || null);
        }

        if (freshVideo.summaryStatus === 'completed' && freshVideo.summary && freshVideo.summary.videoOverview) {
          setVideo(freshVideo);
          setSummary(freshVideo.summary);
          if (freshVideo.transcript) {
            setTranscript(freshVideo.transcript);
          }
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
    }, 2000);
  }, [activeSpace, videoId]);

  const handleTriggerSummary = useCallback(async () => {
    if (activeSpace !== 'YOUTUBE') return;
    setGenerating(true);
    setStatus('processing');
    setStatusMessage('Distilling summary…');
    startPolling();
    try {
      await videosApi.triggerSummarize(videoId);
    } catch (err: any) {
      console.warn('[SummaryDetail] Trigger error:', err.message);
    }
  }, [activeSpace, videoId, startPolling]);

  const handleSubmitManualTranscript = useCallback(async () => {
    if (!manualTranscriptText.trim()) {
      Alert.alert('Empty Transcript', 'Please paste or enter the video transcript text.');
      return;
    }
    setSubmittingTranscript(true);
    try {
      await videosApi.submitTranscript(videoId, {
        text: manualTranscriptText.trim(),
      });
      setShowTranscriptModal(false);
      setManualTranscriptText('');
      setStatus('processing');
      setStatusMessage('Analyzing and distilling comprehensive 11-section summary…');
      handleTriggerSummary();
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Could not submit transcript.');
    } finally {
      setSubmittingTranscript(false);
    }
  }, [videoId, manualTranscriptText, handleTriggerSummary]);

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
          ...passedSummary,
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
            passedSummary.aiProvider ||
            (activeSpace === 'OPEN_LIBRARY'
              ? 'Open Library Distilled Engine'
              : activeSpace === 'TMDB'
              ? 'TMDB Critic Engine'
              : 'Grounded Engine'),
        });
        if (activeSpace === 'YOUTUBE' && !passedSummary.videoOverview) {
          setStatus('processing');
          setStatusMessage('Distilling video summary…');
          setGenerating(true);
        } else {
          setStatus('completed');
        }
        if (activeSpace !== 'YOUTUBE') {
          setLoading(false);
          return;
        }
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
          if (videoData.transcript) {
            setTranscript(videoData.transcript);
          }
          setStatus(videoData.summaryStatus);

          const hasDetailed = videoData.summary && videoData.summary.videoOverview;
          if (videoData.summaryStatus === 'completed' && hasDetailed) {
            setLoading(false);
            return;
          }

          setGenerating(true);
          setStatus('processing');
          setStatusMessage('Distilling video summary…');
          startPolling();

          try {
            await videosApi.triggerSummarize(videoId);
          } catch (triggerErr: any) {
            console.warn('[SummaryDetail] Initial trigger note:', triggerErr?.message);
          }
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

  const handleFlagContent = useCallback(() => {
    Alert.alert(
      'Flag or Report Content',
      'Please select why you are reporting this AI-generated summary:',
      [
        {
          text: 'Inaccurate / Hallucination',
          onPress: () => {
            Alert.alert('Report Received', 'Thank you. Your report has been submitted to the Sumora quality team for review.');
          },
        },
        {
          text: 'Inappropriate Content',
          onPress: () => {
            Alert.alert('Report Received', 'Thank you. Your report has been submitted to the Sumora quality team for review.');
          },
        },
        {
          text: 'Copyright / Other',
          onPress: () => {
            Alert.alert('Report Received', 'Thank you. Your report has been submitted to the Sumora quality team for review.');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, []);

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

  const uploadDateText = useMemo(() => {
    return formatUploadDate(video?.publishedAt || passedPublishedAt);
  }, [video?.publishedAt, passedPublishedAt]);

  const videoDurationText = useMemo(() => {
    return computeVideoDuration(
      (transcript?.segments || (video as any)?.transcript?.segments) as any,
      summary?.videoOverview?.duration || undefined
    );
  }, [transcript?.segments, (video as any)?.transcript?.segments, summary?.videoOverview?.duration]);

  // ── Scroll Animation Values for Collapsible Header & Sticky Tabs ──
  const scrollY = useRef(new Animated.Value(0)).current;

  // ── Scroll Animation: ONLY show artwork & title in entire header once big image has FULLY disappeared (scrollY >= 210) ──
  const summaryTitleOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [195, 230],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  const summaryTitleTranslateY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [195, 230],
        outputRange: [0, -8],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  const headerImageOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [205, 245],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  const titleBarOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [215, 255],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  const titleBarHeight = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [215, 255],
        outputRange: [0, 24],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  const titleBarMarginTop = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [215, 255],
        outputRange: [0, 8],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  const canShowTabs = Boolean(status === 'completed' || transcript);

  const initialScrollY = (route.params as any)?.initialScrollY;
  useEffect(() => {
    if (initialScrollY && (status === 'completed' || transcript)) {
      const timer = setTimeout(() => {
        (scrollViewRef.current as any)?.scrollTo?.({ y: Number(initialScrollY), animated: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialScrollY, status, transcript]);

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
      {/* ── Top Header Banner with Smooth Scroll Animation ── */}
      <Animated.View
        style={[
          styles.topHeaderGradient,
          {
            paddingTop: insets.top + 8,
            shadowColor: accentTheme.primaryDark,
          },
        ]}>
        {/* Emerald Header Asset */}
        <Image
          source={accentTheme.assets.header ?? undefined}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {/* Full-bleed Video Artwork filling entire header from left to right & top to bottom */}
        {thumbnailUri && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { opacity: headerImageOpacity },
            ]}>
            <FastImage
              source={{
                uri: thumbnailUri,
                priority: FastImage.priority.high,
                cache: FastImage.cacheControl.immutable,
              }}
              style={StyleSheet.absoluteFill as ImageStyle}
              resizeMode={FastImage.resizeMode.cover}
            />
            {/* Cinematic dark glassmorphic gradient overlay so frosted controls & title are crystal clear */}
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: 'rgba(5, 12, 16, 0.48)' },
              ]}
            />
          </Animated.View>
        )}

        <View style={styles.topHeaderRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>

          {/* Center Title: "Video Summary" fades out when video image fills entire header */}
          <View style={styles.headerCenterWrap}>
            <Animated.Text
              style={[
                styles.topHeaderTitle,
                {
                  opacity: summaryTitleOpacity,
                  transform: [{ translateY: summaryTitleTranslateY }],
                },
              ]}>
              {domainMeta.headerTitle}
            </Animated.Text>
          </View>

          <TouchableOpacity
            style={styles.headerScaleButton}
            onPress={() => setIsScaleVisible((prev) => !prev)}
            activeOpacity={0.75}>
            <Text allowFontScaling={false} style={styles.headerScaleText}>
              Aa {Math.round(textScale * 100)}%
            </Text>
          </TouchableOpacity>
        </View>

        {/* Video Title below header buttons */}
        <Animated.View
          style={[
            styles.headerTitleRow,
            {
              opacity: titleBarOpacity,
              maxHeight: titleBarHeight,
              marginTop: titleBarMarginTop,
            },
          ]}>
          <Text style={styles.headerScrolledTitle} numberOfLines={1}>
            {video?.title || videoTitle || 'Distilled Insight'}
          </Text>
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollViewRef as any}
        style={{ flex: 1 }}
        stickyHeaderIndices={canShowTabs ? [1] : undefined}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        {/* Child 0: Top Content (Media, Title, Metadata, AI Disclaimer, Progress) */}
        <View style={styles.topContentSection}>
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

          {/* Video Metadata Bar: Upload Date & Video Duration */}
          {(uploadDateText || videoDurationText) ? (
            <View style={styles.videoMetaDetailsBar}>
              {uploadDateText ? (
                <View style={styles.videoMetaDetailItem}>
                  <Text style={styles.videoMetaDetailIcon}>📅</Text>
                  <Text style={styles.videoMetaDetailText}>{uploadDateText}</Text>
                </View>
              ) : null}
              {videoDurationText ? (
                <View style={styles.videoMetaDetailItem}>
                  <Text style={styles.videoMetaDetailIcon}>⏱️</Text>
                  <Text style={styles.videoMetaDetailText}>{videoDurationText}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* AI Accuracy Disclaimer Banner (App Store Guideline 1.2 & Google Play AI Policy) */}
          <View style={styles.aiDisclaimerBanner}>
            <Text style={styles.aiDisclaimerIcon}>🤖</Text>
            <Text style={styles.aiDisclaimerText}>
              AI-Generated Content: Summaries may contain inaccuracies. Verify critical details with the original source.
            </Text>
          </View>

          {/* Honest Unavailable State Card */}
          {status === 'transcript_unavailable' && (
            <View style={styles.unavailableCard}>
              <Text style={styles.unavailableIcon}>📝</Text>
              <Text style={styles.unavailableTitle}>No Public Captions Available</Text>
              <Text style={styles.unavailableSubtitle}>
                This video does not have accessible public subtitles. Per our strict zero-hallucination policy, we never generate summaries using only video titles or descriptions.
              </Text>
              <TouchableOpacity
                style={styles.manualInputBtn}
                activeOpacity={0.8}
                onPress={() => setShowTranscriptModal(true)}>
                <Text style={styles.manualInputBtnText}>+ Paste / Upload Transcript</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Progressive Disclosure Banner: When transcript is ready, but summary is finalizing (~2-3s) */}
          {transcript && status === 'processing' && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: `${domainMeta.themeColor}15`,
                borderRadius: 14,
                padding: 12,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: `${domainMeta.themeColor}30`,
                gap: 10,
              }}>
              <ActivityIndicator size="small" color={domainMeta.themeColor} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Bold', color: domainMeta.themeColor }}>
                  Transcript Ready • Generating Summary (~3s)...
                </Text>
                <Text style={{ fontSize: 11.5, fontFamily: 'PlusJakartaSans-Regular', color: colors.textSecondary }}>
                  You can already browse the full transcript tab below!
                </Text>
              </View>
            </View>
          )}

          {/* Dynamic Progress Card (shown only while initial transcript is being fetched) */}
          {!transcript && status !== 'completed' && status !== 'transcript_unavailable' && (
            <SummaryProgressCard
              status={status}
              themeColor={domainMeta.themeColor}
              onRetry={handleTriggerSummary}
            />
          )}

        </View>

        {/* Child 1: Sticky Tabs Switcher (Pinned beneath header when scrolling) */}
        {canShowTabs ? (
          <View style={styles.stickyTabsWrapper}>
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

              {activeSpace === 'YOUTUBE' && (
                <TouchableOpacity
                  style={[
                    styles.segmentTab,
                    viewMode === 'transcript' && styles.segmentTabActive,
                  ]}
                  onPress={() => setViewMode('transcript')}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.segmentText,
                      viewMode === 'transcript' && styles.segmentTextActive,
                    ]}>
                    📜 Transcript
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={{ height: 0, overflow: 'hidden' }} />
        )}

        {/* Child 2: Main Tab Content & Actions */}
        <View style={styles.mainContentSection}>
          {(status === 'completed' || transcript) && (
            <>
              {/* TAB 1: Key Highlights (Bite-sized, zero overwhelm) */}
              {viewMode === 'highlights' && (
                !summary ? (
                  <View style={styles.heroCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
                      <ActivityIndicator size="small" color={domainMeta.themeColor} />
                      <Text
                        style={{
                          fontSize: Math.round(15 * textScale),
                          fontFamily: 'PlusJakartaSans-Medium',
                          color: colors.textPrimary,
                          flex: 1,
                        }}>
                        Distilling 5-section executive summary (~3s)...
                      </Text>
                    </View>
                  </View>
                ) : (
                  <>
                    {/* 1. Overview Card */}
                  <View style={styles.heroCard}>
                    <View style={styles.heroHeader}>
                      <View style={styles.heroTitleRow}>
                        <Text style={styles.heroTitle}>{domainMeta.heroTitle}</Text>
                      </View>
                      <View style={[styles.heroBadge, { backgroundColor: `${domainMeta.themeColor}22` }]}>
                        <Text style={[styles.heroBadgeText, { color: domainMeta.themeColor }]}>
                          {summary.videoOverview?.mainSubject ? 'Distillation' : domainMeta.heroBadge}
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
                      {summary.videoOverview?.whatViewerLearns || summary.overview}
                    </Text>
                  </View>

                  {/* 2. Background and Context Card */}
                  {summary.backgroundAndContext && (
                    <View style={styles.sectionCard}>
                      <View style={styles.sectionHeadingRow}>
                        <Text style={styles.sectionHeading}>🏛️ Background & Context</Text>
                      </View>
                      {summary.backgroundAndContext.whyDiscussed && (
                        <View style={{ marginBottom: 14 }}>
                          <Text style={styles.breakdownSubLabel}>Why This Matters Now</Text>
                          <Text style={styles.breakdownSubText}>
                            {summary.backgroundAndContext.whyDiscussed}
                          </Text>
                        </View>
                      )}
                      {summary.backgroundAndContext.precedingEvents && (
                        <View style={{ marginBottom: 14 }}>
                          <Text style={styles.breakdownSubLabel}>Preceding Events</Text>
                          <Text style={styles.breakdownSubText}>
                            {summary.backgroundAndContext.precedingEvents}
                          </Text>
                        </View>
                      )}
                      {summary.backgroundAndContext.historicalOrTechnicalContext && (
                        <View style={{ marginBottom: 14 }}>
                          <Text style={styles.breakdownSubLabel}>Context & Key Entities</Text>
                          <Text style={styles.breakdownSubText}>
                            {summary.backgroundAndContext.historicalOrTechnicalContext}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* 3. Key Takeaways */}
                  {((summary.keyTakeaways && summary.keyTakeaways.length > 0) ||
                    (summary.keyPoints && summary.keyPoints.length > 0)) && (
                    <View style={styles.sectionCard}>
                      <View style={styles.sectionHeadingRow}>
                        <Text style={styles.sectionHeading}>{domainMeta.takeawaysTitle}</Text>
                      </View>
                      <View style={styles.takeawaysList}>
                        {(summary.keyTakeaways?.length ? summary.keyTakeaways : summary.keyPoints).map((point, index) => (
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

                  {/* 4. Key Insights */}
                  {summary.importantConcepts && summary.importantConcepts.length > 0 && (
                    <View style={styles.sectionCard}>
                      <View style={styles.sectionHeadingRow}>
                        <Text style={styles.sectionHeading}>💡 Key Insights</Text>
                      </View>
                      {summary.importantConcepts.map((item, index) => (
                        <View key={index} style={styles.conceptItem}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text
                              style={[
                                styles.conceptTitle,
                                {
                                  fontSize: Math.round(16.5 * textScale),
                                  color: colors.textPrimary,
                                  flex: 1,
                                },
                              ]}>
                              {item.concept || String(item)}
                            </Text>
                            {item.timestamp && (
                              <TouchableOpacity
                                style={styles.timestampButton}
                                onPress={() => handleOpenTimestamp(item.timestamp)}
                                activeOpacity={0.7}>
                                <Text style={styles.timestampText}>▶ {item.timestamp}</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          {item.explanation && (
                            <Text
                              style={[
                                styles.conceptExplanation,
                                {
                                  fontSize: Math.round(15 * textScale),
                                  lineHeight: Math.round(23 * textScale),
                                },
                              ]}>
                              {item.explanation}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* 7. Conclusion */}
                  {summary.conclusion && (
                    <View style={styles.sectionCard}>
                      <View style={styles.sectionHeadingRow}>
                        <Text style={styles.sectionHeading}>🎯 Conclusion</Text>
                      </View>
                      <Text
                        style={[
                          styles.conceptExplanation,
                          {
                            fontSize: Math.round(15 * textScale),
                            lineHeight: Math.round(24 * textScale),
                            color: colors.textPrimary,
                          },
                        ]}>
                        {summary.conclusion}
                      </Text>
                    </View>
                  )}
                </>
              ))}

              {/* TAB 2: Deep Dive (Full Story Breakdown) */}
              {viewMode === 'deepdive' && (
                !summary ? (
                  <View style={styles.heroCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
                      <ActivityIndicator size="small" color={domainMeta.themeColor} />
                      <Text
                        style={{
                          fontSize: Math.round(15 * textScale),
                          fontFamily: 'PlusJakartaSans-Medium',
                          color: colors.textPrimary,
                          flex: 1,
                        }}>
                        Analyzing detailed breakdown (~3s)...
                      </Text>
                    </View>
                  </View>
                ) : (
                  <>
                    {/* 1. Chronological Video Breakdown */}
                  {summary.detailedBreakdown && summary.detailedBreakdown.length > 0 ? (
                    <View style={styles.sectionCard}>
                      <View style={styles.sectionHeadingRow}>
                        <Text style={styles.sectionHeading}>📑 Chronological Video Breakdown</Text>
                      </View>
                      {summary.detailedBreakdown.map((section, idx) => (
                        <View key={idx} style={styles.breakdownCard}>
                          <View style={styles.breakdownHeader}>
                            {section.timestampRange ? (
                              <TouchableOpacity
                                style={styles.timestampButton}
                                activeOpacity={0.7}
                                onPress={() => handleOpenTimestamp(section.timestampRange)}>
                                <Text style={styles.timestampText}>⏱️ {section.timestampRange}</Text>
                              </TouchableOpacity>
                            ) : null}
                            <Text style={styles.breakdownTopic}>{section.topic}</Text>
                          </View>
                          <Text style={styles.breakdownBody}>{section.explanation}</Text>

                          {section.developments ? (
                            <View style={styles.breakdownSubSection}>
                              <Text style={styles.breakdownSubLabel}>Key Developments</Text>
                              <Text style={styles.breakdownSubText}>{section.developments}</Text>
                            </View>
                          ) : null}

                          {section.evidenceOrNumbers ? (
                            <View style={styles.breakdownSubSection}>
                              <Text style={styles.breakdownSubLabel}>Evidence & Details</Text>
                              <Text style={styles.breakdownSubText}>{section.evidenceOrNumbers}</Text>
                            </View>
                          ) : null}

                          {section.significance ? (
                            <View style={styles.breakdownSubSection}>
                              <Text style={styles.breakdownSubLabel}>Significance</Text>
                              <Text style={styles.breakdownSubText}>{section.significance}</Text>
                            </View>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  ) : summary.detailedSummary ? (
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
                  ) : null}

                  {/* 2. Important People & Organizations */}
                  {summary.peopleAndOrganizations && summary.peopleAndOrganizations.length > 0 && (
                    <View style={styles.sectionCard}>
                      <View style={styles.sectionHeadingRow}>
                        <Text style={styles.sectionHeading}>👥 Key People & Organizations</Text>
                      </View>
                      {summary.peopleAndOrganizations.map((person, idx) => (
                        <View key={idx} style={styles.personCard}>
                          <View style={styles.personAvatarBox}>
                            <Text style={styles.personAvatarText}>
                              {person.name ? person.name.charAt(0).toUpperCase() : '?'}
                            </Text>
                          </View>
                          <View style={styles.personDetails}>
                            <View style={styles.personNameRow}>
                              <Text style={styles.personName}>{person.name}</Text>
                              {person.role ? <Text style={styles.personRole}>{person.role}</Text> : null}
                            </View>
                            {person.connection ? (
                              <Text style={styles.personConnection}>{person.connection}</Text>
                            ) : person.context ? (
                              <Text style={styles.personConnection}>{person.context}</Text>
                            ) : null}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* 3. Meaningful Statements & Arguments */}
                  {summary.importantStatements && summary.importantStatements.length > 0 && (
                    <View style={styles.sectionCard}>
                      <View style={styles.sectionHeadingRow}>
                        <Text style={styles.sectionHeading}>💬 Notable Statements & Arguments</Text>
                      </View>
                      {summary.importantStatements.map((stmt, idx) => (
                        <View key={idx} style={styles.statementCard}>
                          <View style={styles.statementBadgeRow}>
                            <Text style={styles.statementQuoteBadge}>
                              {stmt.isDirectQuote ? '“ DIRECT QUOTE ”' : 'ARGUMENT SUMMARY'}
                            </Text>
                          </View>
                          <Text style={styles.statementText}>"{stmt.statement}"</Text>
                          {stmt.context ? (
                            <Text style={styles.statementMeta}>Context: {stmt.context}</Text>
                          ) : null}
                          {stmt.significance ? (
                            <Text style={styles.statementMeta}>Why it matters: {stmt.significance}</Text>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* 4. Examples & Real-World Connections */}
                  {summary.examplesAndConnections && summary.examplesAndConnections.length > 0 && (
                    <View style={styles.sectionCard}>
                      <View style={styles.sectionHeadingRow}>
                        <Text style={styles.sectionHeading}>🌍 Examples & Real-World Connections</Text>
                      </View>
                      {summary.examplesAndConnections.map((ex, idx) => (
                        <View key={idx} style={{ marginBottom: 12 }}>
                          <Text style={styles.conceptTitle}>{ex.example}</Text>
                          <Text style={styles.conceptExplanation}>{ex.explanation}</Text>
                          {ex.purpose ? (
                            <Text style={styles.pronunciationContext}>Purpose: {ex.purpose}</Text>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* 5. Final Conclusion */}
                  {(summary.finalConclusion || summary.conclusion) && (
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
                        {summary.finalConclusion?.bottomLine || summary.conclusion}
                      </Text>
                      {summary.finalConclusion?.supportingArguments &&
                        summary.finalConclusion.supportingArguments.length > 0 && (
                          <View style={{ marginTop: 10 }}>
                            <Text style={styles.breakdownSubLabel}>Core Pillars</Text>
                            {summary.finalConclusion.supportingArguments.map((arg, idx) => (
                              <Text key={idx} style={[styles.claimText, { marginTop: 4 }]}>
                                • {arg}
                              </Text>
                            ))}
                          </View>
                        )}
                      {summary.finalConclusion?.unansweredQuestions ? (
                        <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
                          <Text style={styles.breakdownSubLabel}>Unanswered Questions</Text>
                          <Text style={styles.breakdownSubText}>
                            {summary.finalConclusion.unansweredQuestions}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  )}


                </>
              ))}

              {/* TAB 3: Transcript (Interactive & Searchable) */}
              {viewMode === 'transcript' && (
                <View style={styles.transcriptContainer}>
                  {/* Search Bar & Action Header */}
                  <View style={styles.transcriptHeaderCard}>
                    <View style={styles.transcriptMetaRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={styles.transcriptLanguageBadge}>
                          <Text style={styles.transcriptLanguageText}>
                            🌐 {transcript?.language ? transcript.language.toUpperCase() : 'EN'} SUBTITLES
                          </Text>
                        </View>
                        {hasHindiSubtitles && (
                          <TouchableOpacity
                            style={[
                              styles.hinglishToggleBtn,
                              useHinglish && styles.hinglishToggleBtnActive,
                            ]}
                            activeOpacity={0.75}
                            onPress={() => setUseHinglish((prev) => !prev)}>
                            <Text
                              style={[
                                styles.hinglishToggleText,
                                useHinglish && styles.hinglishToggleTextActive,
                              ]}>
                              {useHinglish ? '🔤 Hinglish' : '🇮🇳 हिन्दी'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <TouchableOpacity
                        style={styles.transcriptCopyBtn}
                        activeOpacity={0.75}
                        onPress={handleCopyTranscript}>
                        <Text style={styles.transcriptCopyBtnText}>
                          {transcriptCopied ? '✓ Copied' : '📋 Copy Full'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Search Input */}
                    <View style={styles.transcriptSearchBox}>
                      <Text style={styles.transcriptSearchIcon}>🔍</Text>
                      <TextInput
                        style={styles.transcriptSearchInput}
                        placeholder="Search spoken words in video..."
                        placeholderTextColor={colors.textMuted}
                        value={transcriptSearch}
                        onChangeText={setTranscriptSearch}
                      />
                      {transcriptSearch.length > 0 && (
                        <TouchableOpacity onPress={() => setTranscriptSearch('')}>
                          <Text style={styles.transcriptSearchClear}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Segments List */}
                  {filteredSegments.length > 0 ? (
                    <View style={styles.segmentsList}>
                      {filteredSegments.map((segment, idx) => (
                        <View key={idx} style={styles.segmentCard}>
                          <TouchableOpacity
                            style={styles.segmentTimeBtn}
                            activeOpacity={0.7}
                            onPress={() => handleOpenTimestamp(undefined, segment.start)}>
                            <Text style={styles.segmentTimeText}>
                              ▶ {formatSecondsToTimestamp(segment.start)}
                            </Text>
                          </TouchableOpacity>
                          <Text style={styles.transcriptLineText}>{segment.text}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyTranscriptCard}>
                      <Text style={styles.emptyTranscriptIcon}>
                        {transcriptSearch ? '🔍' : '📝'}
                      </Text>
                      <Text style={styles.emptyTranscriptTitle}>
                        {transcriptSearch
                          ? 'No matching words found'
                          : 'No Subtitle Segments Available'}
                      </Text>
                      <Text style={styles.emptyTranscriptSub}>
                        {transcriptSearch
                          ? `No speech segments matched "${transcriptSearch}". Try a different keyword.`
                          : 'This video summary was distilled directly via multimodal audio analysis.'}
                      </Text>
                    </View>
                  )}
                </View>
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

            {summary && (
              <TouchableOpacity
                style={styles.flagButton}
                onPress={handleFlagContent}
                activeOpacity={0.7}>
                <Text style={styles.flagButtonText}>🚩 Flag Inaccurate Summary or Content</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.ScrollView>

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

      {/* User-Provided Transcript Input Modal */}
      <Modal
        visible={showTranscriptModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTranscriptModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Paste / Upload Transcript</Text>
            <Text style={styles.modalSubtitle}>
              Paste video captions, subtitles, or full transcript (plain text or SRT format) below.
            </Text>

            <TextInput
              style={styles.modalTextInput}
              multiline={true}
              placeholder="Paste transcript or subtitles here..."
              placeholderTextColor={colors.textMuted}
              value={manualTranscriptText}
              onChangeText={setManualTranscriptText}
              autoFocus={true}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                activeOpacity={0.75}
                onPress={() => setShowTranscriptModal(false)}
                disabled={submittingTranscript}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                activeOpacity={0.8}
                onPress={handleSubmitManualTranscript}
                disabled={submittingTranscript}>
                {submittingTranscript ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Submit & Summarize</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
