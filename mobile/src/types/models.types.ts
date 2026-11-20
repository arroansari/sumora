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
  timestamp?: string;
}

export interface VideoOverviewData {
  title?: string;
  channel?: string;
  duration?: string;
  mainSubject?: string;
  mainPurpose?: string;
  whatViewerLearns?: string;
}

export interface BackgroundAndContext {
  whyDiscussed?: string;
  precedingEvents?: string;
  keyEntities?: string[];
  historicalOrTechnicalContext?: string;
  whyItMatters?: string;
}

export interface BreakdownItem {
  timestampRange?: string;
  topic: string;
  explanation: string;
  developments?: string;
  keyFigures?: string[];
  evidenceOrNumbers?: string;
  significance?: string;
}

export interface ActualEventsAndClaims {
  establishedFacts?: string[];
  speakerClaims?: string[];
  allegationsAndAccusations?: string[];
  opinionsAndInterpretations?: string[];
  unverifiedOrDisputed?: string[];
}

export interface PersonOrOrg {
  name: string;
  role?: string;
  context?: string;
  connection?: string;
}

export interface PronunciationItem {
  term: string;
  readablePhonetic: string;
  ipa?: string;
  meaning: string;
  contextInVideo?: string;
}

export interface StatementItem {
  statement: string;
  isDirectQuote?: boolean;
  context?: string;
  significance?: string;
}

export interface ExampleItem {
  example: string;
  explanation: string;
  purpose?: string;
}

export interface FinalConclusionData {
  bottomLine?: string;
  supportingArguments?: string[];
  unansweredQuestions?: string;
}

export interface TimestampItem {
  timestamp: string;
  label: string;
  seconds?: number;
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

  // ── Advanced 11-Section Distillation Schema ──
  videoOverview?: VideoOverviewData | null;
  backgroundAndContext?: BackgroundAndContext | null;
  detailedBreakdown?: BreakdownItem[];
  actualEventsAndClaims?: ActualEventsAndClaims | null;
  peopleAndOrganizations?: PersonOrOrg[];
  pronunciationGuide?: PronunciationItem[];
  importantStatements?: StatementItem[];
  examplesAndConnections?: ExampleItem[];
  finalConclusion?: FinalConclusionData | null;
  keyTakeaways?: string[];
  importantTimestamps?: TimestampItem[];

  // ── Metrics ──
  inputTokens?: number;
  outputTokens?: number;
  processingCost?: number;
  processingDurationMs?: number;

  createdAt?: string;
  updatedAt?: string;
}

export interface TranscriptSegment {
  start: number;
  duration: number;
  text: string;
}

export interface VideoTranscript {
  language?: string;
  source?: string;
  status?: string;
  segments?: TranscriptSegment[];
  fullText?: string;
  createdAt?: string;
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
  transcript?: VideoTranscript | null;
  isCustomImport?: boolean;
  duration?: string;
  publishedTime?: string;
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
