export type SpaceType = 'YOUTUBE' | 'REDDIT' | 'TMDB' | 'OPEN_LIBRARY';

export interface ContentSummary {
  id?: string;
  postId: string;
  takeaways: string[];
  consensus?: string;
  contrarianViews?: string[];
  fullSummary?: string;
  aiProvider?: string;
  modelName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentPostItem {
  id: string;
  platform: SpaceType;
  externalId: string;
  title: string;
  description?: string;
  author?: string;
  posterUrl?: string;
  backdropUrl?: string;
  url?: string;
  rating?: number;
  genres?: string[];
  runtime?: string;
  trailerUrl?: string;
  streamingPlatforms?: string[];
  pageCount?: number;
  readTime?: string;
  categories?: string[];
  releaseYear?: string;
  publishedAt?: string;
  summary?: ContentSummary | null;
}

export type SummaryStatus =
  | 'pending'
  | 'fetching_transcript'
  | 'processing'
  | 'completed'
  | 'transcript_unavailable'
  | 'failed';

export interface ConceptItem {
  concept: string;
  explanation: string;
}

export interface VideoSummary {
  id?: string;
  videoId: string;
  overview: string;
  keyPoints: string[];
  importantConcepts: ConceptItem[];
  detailedSummary: string;
  conclusion: string;
  topicsCovered: string[];
  originalVideoUrl?: string;
  aiProvider?: string;
  modelName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VideoItem {
  id: string;
  videoId: string;
  channelId: string;
  channelName?: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  videoUrl: string;
  publishedAt: string;
  transcriptStatus: SummaryStatus;
  summaryStatus: SummaryStatus;
  summary?: VideoSummary | null;
  isCustomImport?: boolean;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface ConnectedAccount {
  id: string;
  platform: string;
  platformUserId?: string;
  status: string;
  connectedAt: string;
}

export interface TrackedSource {
  id: string;
  platform: string;
  sourceId: string;
  sourceName: string;
  thumbnailUrl?: string | null;
  memberCount?: number;
  isActive?: boolean;
  isPriority?: boolean;
  createdAt: string;
}

export interface RedditSummary {
  id?: string;
  postId: string;
  consensus: string;
  keyTakeaways: string[];
  takeaways?: string[];
  contrarianViews: string[];
  fullSummary: string;
  aiProvider?: string;
  modelName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RedditPostItem {
  id: string;
  externalId: string;
  subreddit: string;
  title: string;
  author: string;
  permalink: string;
  url?: string;
  score: number;
  commentCount: number;
  selftext?: string;
  publishedAt: string;
  summary?: RedditSummary | null;
}

export interface TrackedSubreddit {
  id: string;
  platform: 'reddit';
  sourceId: string;
  sourceName: string;
  thumbnailUrl?: string | null;
  memberCount?: number;
  isActive: boolean;
  isPriority?: boolean;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  platform: string;
  enabled: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  videoId?: string;
}

// Backward compatibility types for starter mock components
export interface MockSummary {
  id: string;
  source: string;
  channelName: string;
  videoTitle: string;
  headline: string;
  keyPoints: string[];
  readingTimeMinutes: number;
  publishedAgo: string;
  thumbnailUrl?: string;
  category: string;
}

export interface MockChannel {
  id: string;
  name: string;
  subscriberCount: string;
  category: string;
  avatarUrl: string;
  connected: boolean;
}

export interface MockNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  type: 'summary' | 'system' | 'integration';
}
