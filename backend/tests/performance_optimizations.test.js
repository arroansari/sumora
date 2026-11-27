const assert = require('assert');
const { cleanSegmentText, decodeHtmlEntities, normalizeTranscript } = require('../src/modules/transcripts/transcript.processor');
const { batchUpsertVideos } = require('../src/utils/videoBatch.util');
const cache = require('../src/utils/cache.util');
const { acquireLock, releaseLock, withDistributedLock } = require('../src/utils/redisLock.util');
const { getFastRedisClient, isRedisReady, closeRedisClients } = require('../src/config/redis');
const videosService = require('../src/modules/videos/videos.service');
const transcriptService = require('../src/modules/transcripts/transcript.service');
const transcriptFactory = require('../src/modules/transcripts/transcript.factory');
const GeminiProvider = require('../src/modules/ai/providers/gemini.provider');
const OpenAIProvider = require('../src/modules/ai/providers/openai.provider');
const aiService = require('../src/modules/ai/ai.service');
const aiStream = require('../src/utils/aiStream.util');
const prisma = require('../src/config/db');
const bcrypt = require('bcrypt');
const bcryptjs = require('bcryptjs');

async function runTests() {
  console.log('🧪 Starting Performance Optimizations Verification Tests...\n');

  // Test 1: Single-pass HTML entity decoder & cleaner
  console.log('Test 1: Single-pass transcript HTML entity decoding & cue cleaning');
  assert.strictEqual(
    decodeHtmlEntities('Tom &amp; Jerry &lt;3 &quot;quotes&quot; &#39;hi&#39; &#x21; &#65;'),
    'Tom & Jerry <3 "quotes" \'hi\' ! A'
  );
  assert.strictEqual(decodeHtmlEntities('Plain text without entities'), 'Plain text without entities');
  assert.strictEqual(
    cleanSegmentText('  [Music] Hello &amp; welcome ♪ (applause)  '),
    'Hello & welcome'
  );
  const norm = normalizeTranscript({
    videoId: 'perfTest001',
    language: 'EN',
    source: 'youtube_captions',
    rawSegments: [
      { start: 0, duration: 2, text: '[Music]' },
      { start: 2, duration: 3, text: 'First &amp; second' },
    ],
  });
  assert.strictEqual(norm.segments.length, 1);
  assert.strictEqual(norm.fullText, 'First & second');
  console.log('  ✅ Transcript single-pass parser verified.');

  // Test 2: Native bcrypt compatibility with existing bcryptjs hashes
  console.log('\nTest 2: Native bcrypt compatibility with existing bcryptjs ($2a$/$2b$) hashes');
  const legacyHash = await bcryptjs.hash('SumoraPerfPass!', 10);
  const nativeMatchesLegacy = await bcrypt.compare('SumoraPerfPass!', legacyHash);
  assert.strictEqual(nativeMatchesLegacy, true, 'Native bcrypt must verify existing bcryptjs hashes');
  const nativeHash = await bcrypt.hash('SumoraPerfPass!', 10);
  assert.strictEqual(await bcryptjs.compare('SumoraPerfPass!', nativeHash), true, 'bcryptjs must verify native bcrypt hashes');
  console.log('  ✅ Cross-compatible native async bcrypt verified.');

  // Test 3: Redis distributed lock & cache-aside helper (when Redis is available)
  console.log('\nTest 3: Redis distributed lock & cache-aside epoch invalidation');
  const client = getFastRedisClient();
  // Wait briefly for connection if Redis is running locally
  await new Promise((r) => setTimeout(r, 250));
  if (isRedisReady()) {
    const lockKey = `test:lock:${Date.now()}`;
    const tok1 = await acquireLock(lockKey, 5000);
    assert.ok(tok1 && tok1 !== 'local-bypass', 'First contender must acquire Redis lock');
    const tok2 = await acquireLock(lockKey, 5000);
    assert.strictEqual(tok2, null, 'Second contender must be blocked while lock is held');
    const skipped = await withDistributedLock(lockKey, 5000, async () => 'should-not-run');
    assert.deepStrictEqual(skipped, { skipped: true });
    await releaseLock(lockKey, tok1);
    const tok3 = await acquireLock(lockKey, 5000);
    assert.ok(tok3 && tok3 !== 'local-bypass', 'Lock must be acquirable after release');
    await releaseLock(lockKey, tok3);

    // Cache & epoch invalidation test
    process.env.ENABLE_REDIS_CACHE_IN_TEST = 'true';
    const testKey = `test:cache:${Date.now()}`;
    await cache.setJson(testKey, { hello: 'world' }, 30);
    assert.deepStrictEqual(await cache.getJson(testKey), { hello: 'world' });
    await cache.del(testKey);
    assert.strictEqual(await cache.getJson(testKey), null);

    const epochKey = `test:epoch:${Date.now()}`;
    const [e0] = await cache.getEpochs(epochKey);
    assert.strictEqual(e0, '0');
    await cache.bumpEpochs(epochKey);
    const [e1] = await cache.getEpochs(epochKey);
    assert.strictEqual(e1, '1');
    await cache.del(epochKey);
    delete process.env.ENABLE_REDIS_CACHE_IN_TEST;
    console.log('  ✅ Redis distributed lock and cache/epoch invalidation verified.');
  } else {
    // Graceful offline bypass test
    const tok = await acquireLock('test:offline:lock', 1000);
    assert.strictEqual(tok, 'local-bypass');
    assert.strictEqual(await cache.getJson('test:offline:key'), null);
    console.log('  ✅ Graceful Redis-offline fallback verified.');
  }

  // Test 4: Keyset / cursor pagination returns strictly disjoint ordered pages
  console.log('\nTest 4: Keyset/cursor pagination correctness');
  const activeSource = await prisma.trackedSource.findFirst({
    where: { platform: 'youtube', isActive: true },
    select: { userId: true },
  });
  if (activeSource) {
    const page1 = await videosService.getFeed(activeSource.userId, { cursor: 'start', limit: 5 });
    if (page1.videos.length === 5 && page1.pagination.hasMore && page1.pagination.nextCursor) {
      const page2 = await videosService.getFeed(activeSource.userId, {
        cursor: page1.pagination.nextCursor,
        limit: 5,
      });
      const ids1 = new Set(page1.videos.map((v) => v.id));
      for (const v of page2.videos) {
        assert.strictEqual(ids1.has(v.id), false, 'Cursor page 2 must not overlap page 1');
      }
      assert.strictEqual(page1.pagination.total, undefined, 'Cursor mode skips COUNT(*) total');
    }
    console.log('  ✅ Keyset/cursor pagination verified (disjoint pages, zero COUNT(*) overhead).');
  } else {
    console.log('  ⚠️ Skipped cursor DB check (no active sources in DB).');
  }

  // Verify helper handles empty batch cleanly
  assert.deepStrictEqual(await batchUpsertVideos([]), { createdCount: 0, totalProcessed: 0 });

  // Test 5: Hedged transcript retrieval & single-flight deduplication
  console.log('\nTest 5: Hedged transcript retrieval, abort cancellation, and single-flight deduplication');
  const origGetProviders = transcriptFactory.getProvidersInPriorityOrder.bind(transcriptFactory);
  const origFindTranscript = prisma.videoTranscript.findUnique.bind(prisma.videoTranscript);
  try {
    // 5a: Fast free youtube_captions beats hedge delay; Supadata is never called
    let supaCalled = 0;
    transcriptFactory.getProvidersInPriorityOrder = () => [
      {
        name: 'supadata',
        canHandle: async () => true,
        fetchTranscript: async () => {
          supaCalled += 1;
          return { segments: [{ start: 0, duration: 2, text: 'Paid fallback' }] };
        },
      },
      {
        name: 'youtube_captions',
        canHandle: async () => true,
        fetchTranscript: async () => {
          await new Promise((r) => setTimeout(r, 15));
          return { language: 'en', segments: [{ start: 0, duration: 2, text: 'Fast free caption' }] };
        },
      },
    ];
    const fastHit = await transcriptService._retrieveFromProviders('hedgeFast01', {}, []);
    assert.strictEqual(fastHit.providerName, 'youtube_captions');
    assert.strictEqual(supaCalled, 0, 'Paid Supadata must not be triggered when fast free captions succeed');

    // 5b: Failed primary triggers Supadata immediately without waiting full 450ms hedge delay
    transcriptFactory.getProvidersInPriorityOrder = () => [
      {
        name: 'youtube_captions',
        canHandle: async () => true,
        fetchTranscript: async () => {
          await new Promise((r) => setTimeout(r, 10));
          throw new Error('Captions blocked');
        },
      },
      {
        name: 'supadata',
        canHandle: async () => true,
        fetchTranscript: async () => ({
          language: 'en',
          segments: [{ start: 0, duration: 2, text: 'Immediate fallback' }],
        }),
      },
    ];
    const tEarlyStart = Date.now();
    const earlyHit = await transcriptService._retrieveFromProviders('hedgeFail01', {}, []);
    const earlyMs = Date.now() - tEarlyStart;
    assert.strictEqual(earlyHit.providerName, 'supadata');
    assert.ok(earlyMs < 250, `Expected immediate early Supadata rescue (<250ms), took ${earlyMs}ms`);

    // 5c: Slow stalling primary (>450ms) gets hedged by Supadata and receives AbortController signal
    let primaryAborted = false;
    transcriptFactory.getProvidersInPriorityOrder = () => [
      {
        name: 'youtube_captions',
        canHandle: async () => true,
        fetchTranscript: (_vid, opts) =>
          new Promise((resolve, reject) => {
            const timer = setTimeout(() => resolve({ segments: [{ start: 0, duration: 1, text: 'too late' }] }), 1500);
            opts?.signal?.addEventListener('abort', () => {
              clearTimeout(timer);
              primaryAborted = true;
              const err = new Error('aborted');
              err.name = 'CanceledError';
              reject(err);
            });
          }),
      },
      {
        name: 'supadata',
        canHandle: async () => true,
        fetchTranscript: async () => {
          await new Promise((r) => setTimeout(r, 20));
          return { language: 'en', segments: [{ start: 0, duration: 2, text: 'Hedge winner' }] };
        },
      },
    ];
    const hedgeHit = await transcriptService._retrieveFromProviders('hedgeSlow01', {}, []);
    assert.strictEqual(hedgeHit.providerName, 'supadata');
    assert.strictEqual(primaryAborted, true, 'Slow losing provider must be aborted cleanly');

    // 5d: Single-flight _inFlight deduplication collapses concurrent callers
    let dbLookups = 0;
    prisma.videoTranscript.findUnique = async () => {
      dbLookups += 1;
      await new Promise((r) => setTimeout(r, 40));
      return {
        videoId: 'dedupTest01',
        language: 'en',
        source: 'youtube_captions',
        segments: [{ start: 0, duration: 2, text: 'Deduped' }],
        fullText: 'Deduped',
        status: 'completed',
      };
    };
    const [r1, r2, r3] = await Promise.all([
      transcriptService.getOrFetchTranscript('dedupTest01'),
      transcriptService.getOrFetchTranscript('dedupTest01'),
      transcriptService.getOrFetchTranscript('dedupTest01'),
    ]);
    assert.strictEqual(dbLookups, 1, 'Concurrent identical getOrFetchTranscript calls must share 1 in-flight execution');
    assert.strictEqual(r1.transcript.fullText, 'Deduped');
    assert.strictEqual(r2.transcript.fullText, 'Deduped');
    assert.strictEqual(r3.transcript.fullText, 'Deduped');
    await cache.del('cache:transcript:dedupTest01');
    console.log('  ✅ Hedged transcript racing, abort cleanup, and single-flight deduplication verified.');
  } finally {
    transcriptFactory.getProvidersInPriorityOrder = origGetProviders;
    prisma.videoTranscript.findUnique = origFindTranscript;
  }

  // Test 6: Multi-key Gemini rotation, cooldown, streaming, and AIService failover
  console.log('\nTest 6: Multi-key Gemini/OpenAI rotation, cooldown, streaming chunks, and provider failover');
  const gemini = new GeminiProvider(['key-1', 'key-2'], 'gemini-test-model');
  gemini._clients.set('key-1', {
    getGenerativeModel: () => ({
      generateContent: async () => {
        throw new Error('429 RESOURCE_EXHAUSTED');
      },
    }),
  });
  gemini._clients.set('key-2', {
    getGenerativeModel: () => ({
      generateContent: async () => ({
        response: { text: () => JSON.stringify({ overview: 'key-2-ok' }) },
      }),
      generateContentStream: async () => ({
        stream: (async function* () {
          yield { text: () => '{"overview":' };
          yield { text: () => '"stream-ok"}' };
        })(),
      }),
    }),
  });
  const rotatedRes = await gemini.generateStructuredJson({ prompt: 'test' });
  assert.deepStrictEqual(rotatedRes, { overview: 'key-2-ok' });
  assert.ok((gemini._cooldownUntil.get('key-1') || 0) > Date.now(), 'Throttled key-1 must enter cooldown');
  assert.deepStrictEqual(gemini._pickHealthyKeys(), ['key-2'], 'Cooldown must exclude throttled key-1');

  const deltas = [];
  const streamedRes = await gemini.generateStructuredJson({
    prompt: 'stream-test',
    onDelta: (_d, acc) => deltas.push(acc),
  });
  assert.deepStrictEqual(streamedRes, { overview: 'stream-ok' });
  assert.deepStrictEqual(deltas, ['{"overview":', '{"overview":"stream-ok"}']);

  // OpenAI multi-key rotation
  const openai = new OpenAIProvider(['oa-1', 'oa-2'], 'gpt-4o-mini');
  openai._clients.set('oa-1', {
    chat: {
      completions: {
        create: async () => {
          const e = new Error('rate limit');
          e.status = 429;
          throw e;
        },
      },
    },
  });
  openai._clients.set('oa-2', {
    chat: {
      completions: {
        create: async () => ({
          choices: [{ message: { content: JSON.stringify({ provider: 'openai-key-2' }) } }],
        }),
      },
    },
  });
  assert.deepStrictEqual(await openai.generateStructuredJson({ prompt: 'oa' }), { provider: 'openai-key-2' });

  // AIService automatic failover from throttled Gemini -> OpenAI
  const origGeminiProv = aiService.providers.get('gemini');
  const origOpenAIProv = aiService.providers.get('openai');
  const origActiveName = aiService.activeProviderName;
  try {
    aiService.registerProvider({
      name: 'gemini',
      modelName: 'fake',
      client: {},
      generateStructuredJson: async () => {
        throw new Error('Gemini 429 RESOURCE_EXHAUSTED');
      },
    });
    aiService.registerProvider({
      name: 'openai',
      modelName: 'fake-oa',
      client: {},
      generateStructuredJson: async () => ({ overview: 'failover-success' }),
    });
    aiService.setActiveProvider('gemini');
    const failoverOut = await aiService.generateStructuredJson({ prompt: 'failover' });
    assert.deepStrictEqual(failoverOut, { overview: 'failover-success' });
    console.log('  ✅ Multi-key rotation, cooldown skip, token streaming, and OpenAI failover verified.');
  } finally {
    aiService.registerProvider(origGeminiProv);
    aiService.registerProvider(origOpenAIProv);
    aiService.setActiveProvider(origActiveName);
  }

  // Test 7: aiStream live event bus & unsubscribe lifecycle
  console.log('\nTest 7: aiStream event publish, subscribe, and clean unsubscribe');
  const receivedEvents = [];
  const unsub = aiStream.subscribe('streamVid01', (ev) => receivedEvents.push(ev));
  aiStream.publish('streamVid01', { stage: 'generating_summary' });
  aiStream.publish('streamVid01', { stage: 'streaming', chars: 128 });
  aiStream.publish('streamVid01', { stage: 'completed', summary: { overview: 'done' } });
  unsub();
  aiStream.publish('streamVid01', { stage: 'ignored_after_unsub' });
  assert.deepStrictEqual(
    receivedEvents.map((e) => e.stage),
    ['generating_summary', 'streaming', 'completed']
  );
  console.log('  ✅ aiStream event bus verified.');

  // Test 8: Smart BullMQ stale-job guard avoids duplicating queued jobs
  console.log('\nTest 8: Smart BullMQ stale-job guard prevents duplicate enqueues under load');
  const origVideoFindUnique = prisma.video.findUnique.bind(prisma.video);
  const origHasActive = videosService._hasActiveQueueJob.bind(videosService);
  const origEnqueue = videosService._enqueueOrRunPipeline.bind(videosService);
  try {
    let enqueueCalls = 0;
    prisma.video.findUnique = async () => ({
      videoId: 'staleGuard01',
      title: 'Queued Video',
      channelId: 'ch1',
      videoUrl: 'https://youtube.com/watch?v=staleGuard01',
      summaryStatus: 'processing',
      updatedAt: new Date(Date.now() - 60000), // >45s old
      summary: null,
    });
    videosService._enqueueOrRunPipeline = async () => {
      enqueueCalls += 1;
      return { message: 'requeued', status: 'processing' };
    };

    // When BullMQ job is actively waiting/running in queue -> must NOT re-enqueue
    videosService._hasActiveQueueJob = async () => true;
    const queuedResp = await videosService.requestSummarization('staleGuard01');
    assert.strictEqual(queuedResp.status, 'processing');
    assert.strictEqual(enqueueCalls, 0, 'Must not duplicate actively queued BullMQ job even after 45s');

    // When no BullMQ job exists (>45s stalled) -> must recover cleanly
    videosService._hasActiveQueueJob = async () => false;
    const recoveredResp = await videosService.requestSummarization('staleGuard01');
    assert.strictEqual(recoveredResp.message, 'requeued');
    assert.strictEqual(enqueueCalls, 1, 'Must recover stalled job when no BullMQ job is active');
    console.log('  ✅ Smart BullMQ stale-job guard verified.');
  } finally {
    prisma.video.findUnique = origVideoFindUnique;
    videosService._hasActiveQueueJob = origHasActive;
    videosService._enqueueOrRunPipeline = origEnqueue;
  }

  await aiStream.closeStreamSubscriber();
  await prisma.$disconnect();
  await closeRedisClients();
  console.log('\n🎉 All Performance Optimization Tests Passed Successfully!');
}

runTests().catch(async (err) => {
  console.error('❌ Test failed:', err);
  await prisma.$disconnect().catch(() => {});
  await closeRedisClients().catch(() => {});
  process.exit(1);
});
