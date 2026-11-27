-- CreateIndex
CREATE INDEX "connected_accounts_platform_status_idx" ON "connected_accounts"("platform", "status");

-- CreateIndex
CREATE INDEX "device_tokens_userId_idx" ON "device_tokens"("userId");

-- CreateIndex
CREATE INDEX "tracked_sources_platform_sourceId_isActive_idx" ON "tracked_sources"("platform", "sourceId", "isActive");

-- CreateIndex
CREATE INDEX "tracked_sources_userId_platform_isActive_idx" ON "tracked_sources"("userId", "platform", "isActive");

-- CreateIndex
CREATE INDEX "tracked_sources_userId_platform_createdAt_idx" ON "tracked_sources"("userId", "platform", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "tracked_sources_userId_createdAt_idx" ON "tracked_sources"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "videos_publishedAt_id_idx" ON "videos"("publishedAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "videos_channelId_publishedAt_desc_id_idx" ON "videos"("channelId", "publishedAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "videos_summaryStatus_idx" ON "videos"("summaryStatus");

