-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('YOUTUBE', 'REDDIT', 'TMDB', 'OPEN_LIBRARY');

-- CreateTable
CREATE TABLE "connected_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platformUserId" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "connected_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_posts" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "author" TEXT,
    "posterUrl" TEXT,
    "backdropUrl" TEXT,
    "url" TEXT,
    "rating" DOUBLE PRECISION,
    "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "runtime" TEXT,
    "trailerUrl" TEXT,
    "streamingPlatforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pageCount" INTEGER,
    "readTime" TEXT,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "releaseYear" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceToken" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_tokens" (
    "id" TEXT NOT NULL,
    "connectedAccountId" TEXT NOT NULL,
    "encryptedAccessToken" TEXT NOT NULL,
    "encryptedRefreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_summaries" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "takeaways" JSONB NOT NULL,
    "consensus" TEXT,
    "contrarianViews" JSONB,
    "fullSummary" TEXT,
    "aiProvider" TEXT NOT NULL DEFAULT 'gemini',
    "modelName" TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reddit_posts" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "subreddit" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "permalink" TEXT NOT NULL,
    "url" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "selftext" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reddit_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reddit_summaries" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "consensus" TEXT NOT NULL,
    "contrarianViews" JSONB NOT NULL,
    "keyTakeaways" JSONB NOT NULL,
    "fullSummary" TEXT NOT NULL,
    "aiProvider" TEXT NOT NULL DEFAULT 'gemini',
    "modelName" TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reddit_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_jobs" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracked_sources" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "thumbnailUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPriority" BOOLEAN NOT NULL DEFAULT false,
    "memberCount" INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracked_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_summaries" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "keyPoints" JSONB NOT NULL,
    "importantConcepts" JSONB NOT NULL,
    "detailedSummary" TEXT NOT NULL,
    "conclusion" TEXT NOT NULL,
    "topicsCovered" JSONB NOT NULL,
    "aiProvider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "actualEventsAndClaims" JSONB,
    "backgroundAndContext" JSONB,
    "detailedBreakdown" JSONB,
    "examplesAndConnections" JSONB,
    "importantStatements" JSONB,
    "importantTimestamps" JSONB,
    "inputTokens" INTEGER,
    "keyTakeaways" JSONB,
    "outputTokens" INTEGER,
    "peopleAndOrganizations" JSONB,
    "processingCost" DOUBLE PRECISION,
    "processingDurationMs" INTEGER,
    "pronunciationGuide" JSONB,
    "videoOverview" JSONB,
    "finalConclusion" JSONB,

    CONSTRAINT "video_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_transcripts" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "source" TEXT NOT NULL,
    "fullText" TEXT NOT NULL,
    "segments" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "videoUrl" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "transcriptStatus" TEXT NOT NULL DEFAULT 'pending',
    "summaryStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "connected_accounts_userId_platform_key" ON "connected_accounts"("userId" ASC, "platform" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "content_posts_externalId_key" ON "content_posts"("externalId" ASC);

-- CreateIndex
CREATE INDEX "content_posts_platform_createdAt_idx" ON "content_posts"("platform" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "content_posts_platform_idx" ON "content_posts"("platform" ASC);

-- CreateIndex
CREATE INDEX "content_posts_platform_publishedAt_idx" ON "content_posts"("platform" ASC, "publishedAt" ASC);

-- CreateIndex
CREATE INDEX "content_posts_publishedAt_idx" ON "content_posts"("publishedAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_userId_deviceToken_key" ON "device_tokens"("userId" ASC, "deviceToken" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_platform_key" ON "notification_preferences"("userId" ASC, "platform" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "platform_tokens_connectedAccountId_key" ON "platform_tokens"("connectedAccountId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "post_summaries_postId_key" ON "post_summaries"("postId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "reddit_posts_externalId_key" ON "reddit_posts"("externalId" ASC);

-- CreateIndex
CREATE INDEX "reddit_posts_publishedAt_idx" ON "reddit_posts"("publishedAt" ASC);

-- CreateIndex
CREATE INDEX "reddit_posts_subreddit_idx" ON "reddit_posts"("subreddit" ASC);

-- CreateIndex
CREATE INDEX "reddit_posts_subreddit_publishedAt_idx" ON "reddit_posts"("subreddit" ASC, "publishedAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "reddit_summaries_postId_key" ON "reddit_summaries"("postId" ASC);

-- CreateIndex
CREATE INDEX "tracked_sources_platform_sourceId_idx" ON "tracked_sources"("platform" ASC, "sourceId" ASC);

-- CreateIndex
CREATE INDEX "tracked_sources_userId_platform_idx" ON "tracked_sources"("userId" ASC, "platform" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "tracked_sources_userId_platform_sourceId_key" ON "tracked_sources"("userId" ASC, "platform" ASC, "sourceId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "video_summaries_videoId_key" ON "video_summaries"("videoId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "video_transcripts_videoId_key" ON "video_transcripts"("videoId" ASC);

-- CreateIndex
CREATE INDEX "videos_channelId_idx" ON "videos"("channelId" ASC);

-- CreateIndex
CREATE INDEX "videos_channelId_publishedAt_idx" ON "videos"("channelId" ASC, "publishedAt" ASC);

-- CreateIndex
CREATE INDEX "videos_publishedAt_idx" ON "videos"("publishedAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "videos_videoId_key" ON "videos"("videoId" ASC);

-- AddForeignKey
ALTER TABLE "connected_accounts" ADD CONSTRAINT "connected_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_tokens" ADD CONSTRAINT "platform_tokens_connectedAccountId_fkey" FOREIGN KEY ("connectedAccountId") REFERENCES "connected_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_summaries" ADD CONSTRAINT "post_summaries_postId_fkey" FOREIGN KEY ("postId") REFERENCES "content_posts"("externalId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reddit_summaries" ADD CONSTRAINT "reddit_summaries_postId_fkey" FOREIGN KEY ("postId") REFERENCES "reddit_posts"("externalId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracked_sources" ADD CONSTRAINT "tracked_sources_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_summaries" ADD CONSTRAINT "video_summaries_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("videoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_transcripts" ADD CONSTRAINT "video_transcripts_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("videoId") ON DELETE CASCADE ON UPDATE CASCADE;

