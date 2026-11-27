const prisma = require('../config/db');

/**
 * Efficiently inserts new Video rows in bulk (1 query via createMany + skipDuplicates)
 * and updates only existing rows whose metadata actually changed, eliminating N+1 loops.
 *
 * @param {Array<object>} items
 * @param {{ updateMetadata?: boolean }} [opts]
 * @returns {Promise<{ createdCount: number, totalProcessed: number }>}
 */
async function batchUpsertVideos(items, { updateMetadata = true } = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    return { createdCount: 0, totalProcessed: 0 };
  }

  const videoIds = items.map((v) => v.videoId);
  const existingRows = await prisma.video.findMany({
    where: { videoId: { in: videoIds } },
    select: { videoId: true, title: true, thumbnailUrl: true, summaryStatus: true },
  });
  const existingMap = new Map(existingRows.map((r) => [r.videoId, r]));

  const toCreate = [];
  const toUpdate = [];

  for (const item of items) {
    const existing = existingMap.get(item.videoId);
    if (!existing) {
      toCreate.push({
        videoId: item.videoId,
        channelId: item.channelId,
        title: item.title,
        description: item.description ?? null,
        videoUrl: item.videoUrl,
        thumbnailUrl: item.thumbnailUrl ?? null,
        publishedAt: item.publishedAt instanceof Date ? item.publishedAt : new Date(item.publishedAt),
        transcriptStatus: item.transcriptStatus || 'pending',
        summaryStatus: item.summaryStatus || 'pending',
      });
    } else if (
      updateMetadata &&
      (existing.title !== item.title || (item.thumbnailUrl && existing.thumbnailUrl !== item.thumbnailUrl))
    ) {
      toUpdate.push({
        videoId: item.videoId,
        title: item.title,
        ...(item.thumbnailUrl ? { thumbnailUrl: item.thumbnailUrl } : {}),
        ...(item.publishedAt ? { publishedAt: item.publishedAt instanceof Date ? item.publishedAt : new Date(item.publishedAt) } : {}),
      });
    }
  }

  let createdCount = 0;
  if (toCreate.length > 0) {
    const res = await prisma.video.createMany({
      data: toCreate,
      skipDuplicates: true,
    });
    createdCount = res.count;
  }

  if (toUpdate.length > 0) {
    await Promise.all(
      toUpdate.map((u) =>
        prisma.video
          .update({
            where: { videoId: u.videoId },
            data: {
              title: u.title,
              ...(u.thumbnailUrl ? { thumbnailUrl: u.thumbnailUrl } : {}),
              ...(u.publishedAt ? { publishedAt: u.publishedAt } : {}),
            },
          })
          .catch(() => {})
      )
    );
  }

  return { createdCount, totalProcessed: items.length };
}

module.exports = { batchUpsertVideos };
