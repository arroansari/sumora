import React, { useState, useCallback, useMemo } from 'react';
import { View, ListRenderItemInfo, Alert, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';
import { usePlatform } from '../../context/PlatformContext';
import { videosApi } from '../../services/api';
import { VideoItem, RedditPostItem, ContentPostItem } from '../../types/models.types';
import { createHomeStyles } from './HomeScreen.styles';
import {
  FeedItemCard,
  RedditDiscussionCard,
  MovieCard,
  BookCard,
  Space3DDeckModal,
  HomeHeader,
  HomeFilterBar,
  FeedEmptyState,
  ImportVideoModal,
  SavedCelebrationModal,
  SnapDeckList,
  DomainEmptyState,
} from './components';
import { useHomeDomainData } from './hooks/useHomeDomainData';

export const HomeScreen: React.FC<any> = ({ navigation }) => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createHomeStyles(colors), [colors]);

  // Universal Space Horizon State
  const { activeSpace, setActiveSpace } = usePlatform();
  const [showSpaceSwitcherModal, setShowSpaceSwitcherModal] = useState<boolean>(false);

  // Layout & Global Modal States
  const [cardContainerHeight, setCardContainerHeight] = useState<number>(0);
  const [urlInput, setUrlInput] = useState<string>('');
  const [importing, setImporting] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Domain data and feed handlers hook
  const {
    // YouTube
    loading,
    refreshing,
    activeTab,
    setActiveTab,
    favoriteChannelIds,
    bookmarkedVideoIds,
    displayedVideos,
    handleRefresh,
    handleReadSummary,
    handleWatchVideo,
    handleMarkDone,
    handleRestoreVideo,
    handleCopyTakeaways,
    handleShareVideo,
    handleToggleBookmark,

    // Reddit
    redditLoading,
    redditRefreshing,
    subreddits,
    activeSubreddit,
    setActiveSubreddit,
    bookmarkedRedditIds,
    displayedRedditPosts,
    loadRedditFeed,
    handleReadRedditSummary,
    handleCopyRedditTakeaways,
    handleToggleRedditBookmark,
    handleShareRedditThread,
    handleMarkRedditDone,
    handleRestoreRedditThread,

    // Cinema
    cinemaLoading,
    cinemaRefreshing,
    activeCinemaFilter,
    setActiveCinemaFilter,
    bookmarkedCinemaIds,
    displayedCinemaPosts,
    loadCinemaFeed,
    handleReadReview,
    handleToggleCinemaBookmark,
    handleMarkCinemaWatched,
    handleRestoreCinema,

    // Book
    bookLoading,
    bookRefreshing,
    activeBookFilter,
    setActiveBookFilter,
    bookmarkedBookIds,
    displayedBookPosts,
    loadBookFeed,
    handleReadBookSummary,
    handleToggleBookBookmark,
    handleMarkBookFinished,
    handleRestoreBook,

    // Storage
    loadStoredData,

    // Counts & Headers
    customCount,
    completedCount,
    activeSavedCount,
    headerMeta,

    // Celebration
    showSavedCelebrationModal,
    setShowSavedCelebrationModal,
    celebrationVideoTitle,
  } = useHomeDomainData({ navigation, activeSpace });

  // YouTube Card Renderer
  const renderVideoItem = useCallback(
    ({ item }: ListRenderItemInfo<VideoItem>) => (
      <FeedItemCard
        item={item}
        styles={styles}
        isFavoriteChannel={favoriteChannelIds.has(item.channelId)}
        isBookmarked={bookmarkedVideoIds.has(item.videoId)}
        isCompletedView={activeTab === 'completed'}
        cardHeight={cardContainerHeight}
        onReadSummary={handleReadSummary}
        onWatchVideo={handleWatchVideo}
        onCopyTakeaways={handleCopyTakeaways}
        onToggleBookmark={handleToggleBookmark}
        onShareVideo={handleShareVideo}
        onMarkDone={handleMarkDone}
        onRestoreVideo={handleRestoreVideo}
      />
    ),
    [
      styles,
      favoriteChannelIds,
      bookmarkedVideoIds,
      activeTab,
      cardContainerHeight,
      handleReadSummary,
      handleWatchVideo,
      handleCopyTakeaways,
      handleToggleBookmark,
      handleShareVideo,
      handleMarkDone,
      handleRestoreVideo,
    ]
  );

  // Reddit Card Renderer
  const renderRedditItem = useCallback(
    ({ item }: ListRenderItemInfo<RedditPostItem>) => (
      <RedditDiscussionCard
        item={item}
        styles={styles}
        isBookmarked={bookmarkedRedditIds.has(item.externalId)}
        cardHeight={cardContainerHeight}
        onReadSummary={handleReadRedditSummary}
        onCopyTakeaways={handleCopyRedditTakeaways}
        onToggleBookmark={handleToggleRedditBookmark}
        onShareThread={handleShareRedditThread}
        onMarkDone={handleMarkRedditDone}
        onRestoreThread={handleRestoreRedditThread}
      />
    ),
    [
      styles,
      bookmarkedRedditIds,
      cardContainerHeight,
      handleReadRedditSummary,
      handleCopyRedditTakeaways,
      handleToggleRedditBookmark,
      handleShareRedditThread,
      handleMarkRedditDone,
      handleRestoreRedditThread,
    ]
  );

  // Cinema Card Renderer
  const renderCinemaItem = useCallback(
    ({ item }: ListRenderItemInfo<ContentPostItem>) => (
      <MovieCard
        item={item}
        styles={styles}
        isBookmarked={bookmarkedCinemaIds.has(item.externalId)}
        cardHeight={cardContainerHeight}
        onReadReview={handleReadReview}
        onCopyTakeaways={(m) => Alert.alert('Consensus Copied', m.summary?.takeaways?.join('\n\n') || m.title)}
        onToggleBookmark={handleToggleCinemaBookmark}
        onShareMovie={(m) => Share.share({ message: `Check out "${m.title}" (${m.releaseYear}): ${m.url || ''}` })}
        onMarkDone={handleMarkCinemaWatched}
        onRestoreMovie={handleRestoreCinema}
      />
    ),
    [
      styles,
      bookmarkedCinemaIds,
      cardContainerHeight,
      handleReadReview,
      handleToggleCinemaBookmark,
      handleMarkCinemaWatched,
      handleRestoreCinema,
    ]
  );

  // Book Card Renderer
  const renderBookItem = useCallback(
    ({ item }: ListRenderItemInfo<ContentPostItem>) => (
      <BookCard
        item={item}
        styles={styles}
        isBookmarked={bookmarkedBookIds.has(item.externalId)}
        cardHeight={cardContainerHeight}
        onReadSummary={handleReadBookSummary}
        onCopyTakeaways={(b) => Alert.alert('Mental Models Copied', b.summary?.takeaways?.join('\n\n') || b.title)}
        onToggleBookmark={handleToggleBookBookmark}
        onShareBook={(b) => Share.share({ message: `Distilled Book Takeaways from "${b.title}" by ${b.author}: ${b.url || ''}` })}
        onMarkDone={handleMarkBookFinished}
        onRestoreBook={handleRestoreBook}
      />
    ),
    [
      styles,
      bookmarkedBookIds,
      cardContainerHeight,
      handleReadBookSummary,
      handleToggleBookBookmark,
      handleMarkBookFinished,
      handleRestoreBook,
    ]
  );

  // Global Import Handler
  const handleGlobalImport = useCallback(async () => {
    if (!urlInput.trim()) return;
    setImporting(true);
    try {
      if (urlInput.includes('reddit.com')) {
        setActiveSpace('REDDIT');
        setShowImportModal(false);
        setUrlInput('');
        Alert.alert('Reddit Discussion', 'Importing Reddit discussions via public debate analysis.');
        return;
      }
      const imported = await videosApi.importByUrl(urlInput.trim());
      setShowImportModal(false);
      setUrlInput('');
      setActiveSpace('YOUTUBE');
      navigation.navigate('SummaryDetail', {
        videoId: imported.videoId,
        videoTitle: imported.title,
        channelName: imported.channelName,
        thumbnailUrl: imported.thumbnailUrl,
        publishedAt: imported.publishedAt,
        summary: imported.summary,
      });
    } catch {
      Alert.alert('Import Failed', 'Please verify the URL is valid.');
    } finally {
      setImporting(false);
    }
  }, [urlInput, navigation, setActiveSpace]);

  return (
    <View style={styles.container}>
      {/* ── Dynamic Top Header with Universal Space Switcher Dropdown ── */}
      <HomeHeader
        insets={insets}
        styles={styles}
        title={headerMeta.title}
        subtitle={headerMeta.subtitle}
        activeSpace={activeSpace}
        onSpacePillPress={() => setShowSpaceSwitcherModal(true)}
        onSummarizePress={() => setShowImportModal(true)}
      />

      {/* ── Filter Pills Adapt to Active Space ── */}
      <HomeFilterBar
        space={activeSpace}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        savedCount={activeSavedCount}
        customCount={customCount}
        completedCount={completedCount}
        styles={styles}
        subreddits={subreddits}
        activeSubreddit={activeSubreddit}
        onSelectSubreddit={setActiveSubreddit}
        activeFilter={activeSpace === 'TMDB' ? activeCinemaFilter : activeBookFilter}
        onSelectFilter={(f) => {
          if (activeSpace === 'TMDB') setActiveCinemaFilter(f);
          if (activeSpace === 'OPEN_LIBRARY') setActiveBookFilter(f);
        }}
      />

      {/* ── Vertical Snap Deck Viewport ── */}
      <View
        style={styles.deckViewport}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - cardContainerHeight) > 4) {
            setCardContainerHeight(h);
          }
        }}>
        {/* 1. YouTube Space */}
        {activeSpace === 'YOUTUBE' && (
          <View style={styles.deckViewport}>
            <SnapDeckList
              data={displayedVideos}
              keyExtractor={(item) => item.videoId}
              renderItem={renderVideoItem}
              cardContainerHeight={cardContainerHeight}
              loading={loading}
              loadingText="Loading your video feed..."
              loadingColor={colors.primary}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              emptyComponent={
                <FeedEmptyState
                  activeTab={activeTab}
                  styles={styles}
                  onBrowseAll={() =>
                    setActiveTab(activeTab === 'all' && completedCount > 0 ? 'completed' : 'all')
                  }
                  onPasteLink={() => setShowImportModal(true)}
                  onExploreChannels={() => navigation.navigate('Following')}
                  completedCount={completedCount}
                />
              }
              styles={styles}
            />
          </View>
        )}

        {/* 2. Reddit Space */}
        {activeSpace === 'REDDIT' && (
          <View style={styles.deckViewport}>
            <SnapDeckList
              data={displayedRedditPosts}
              keyExtractor={(item) => item.externalId}
              renderItem={renderRedditItem}
              cardContainerHeight={cardContainerHeight}
              loading={redditLoading}
              loadingText="Loading community debates..."
              loadingColor="#FF4500"
              refreshing={redditRefreshing}
              onRefresh={() => {
                loadRedditFeed(true);
                loadStoredData();
              }}
              emptyComponent={
                <DomainEmptyState
                  icon="💬"
                  title="No Reddit Debates Yet"
                  subtitle="Follow your favorite subreddits in the Following tab to distill high-upvote community discussions."
                  actionText="Manage Subreddits"
                  onAction={() => navigation.navigate('Following')}
                  styles={styles}
                />
              }
              styles={styles}
            />
          </View>
        )}

        {/* 3. Cinema (TMDB) Space */}
        {activeSpace === 'TMDB' && (
          <View style={styles.deckViewport}>
            <SnapDeckList
              data={displayedCinemaPosts}
              keyExtractor={(item) => item.externalId}
              renderItem={renderCinemaItem}
              cardContainerHeight={cardContainerHeight}
              loading={cinemaLoading}
              loadingText="Loading cinema radar..."
              loadingColor="#F59E0B"
              refreshing={cinemaRefreshing}
              onRefresh={() => {
                loadCinemaFeed(true);
                loadStoredData();
              }}
              emptyComponent={
                <DomainEmptyState
                  icon="🎬"
                  title="No Cinema Cards Found"
                  subtitle="Explore trending movies or filter by Netflix, Max, or Top Rated."
                  actionText="View Trending"
                  actionColor="#F59E0B"
                  onAction={() => setActiveCinemaFilter('Trending Today')}
                  styles={styles}
                />
              }
              styles={styles}
            />
          </View>
        )}

        {/* 4. Book (Open Library) Space */}
        {activeSpace === 'OPEN_LIBRARY' && (
          <View style={styles.deckViewport}>
            <SnapDeckList
              data={displayedBookPosts}
              keyExtractor={(item) => item.externalId}
              renderItem={renderBookItem}
              cardContainerHeight={cardContainerHeight}
              loading={bookLoading}
              loadingText="Loading book mental models..."
              loadingColor="#10B981"
              refreshing={bookRefreshing}
              onRefresh={() => {
                loadBookFeed(true);
                loadStoredData();
              }}
              emptyComponent={
                <DomainEmptyState
                  icon="📚"
                  title="No Book Insights Found"
                  subtitle="Explore popular non-fiction mental models across Psychology, Productivity, and Wealth."
                  actionText="Browse All Books"
                  actionColor="#10B981"
                  onAction={() => setActiveBookFilter('All Books')}
                  styles={styles}
                />
              }
              styles={styles}
            />
          </View>
        )}
      </View>

      {/* ── 3D Perspective Space Deck Modal (Cover Flow) ── */}
      <Space3DDeckModal
        visible={showSpaceSwitcherModal}
        activeSpace={activeSpace}
        onSelectSpace={(space) => {
          setActiveSpace(space);
          if (space === 'TMDB') setActiveCinemaFilter('Trending Today');
          if (space === 'OPEN_LIBRARY') setActiveBookFilter('All Books');
          if (space === 'REDDIT') setActiveSubreddit('all');
        }}
        onClose={() => setShowSpaceSwitcherModal(false)}
      />

      {/* ── Modal: Paste Link to Summarize ── */}
      <ImportVideoModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        urlInput={urlInput}
        onChangeUrlInput={setUrlInput}
        onImport={handleGlobalImport}
        importing={importing}
        styles={styles}
        colors={colors}
      />

      {/* ── Celebration Modal: First Bookmark Discovery ── */}
      <SavedCelebrationModal
        visible={showSavedCelebrationModal}
        videoTitle={celebrationVideoTitle}
        styles={styles}
        onViewSaved={() => {
          setShowSavedCelebrationModal(false);
          setActiveTab('saved');
        }}
        onDismiss={() => setShowSavedCelebrationModal(false)}
      />
    </View>
  );
};
