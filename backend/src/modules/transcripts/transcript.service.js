const prisma = require('../../config/db');
const cache = require('../../utils/cache.util');
const transcriptFactory = require('./transcript.factory');
const { validateRawSegments, validateNormalizedTranscript } = require('./transcript.validator');
const { normalizeTranscript } = require('./transcript.processor');

const HEDGE_DELAY_MS =
  process.env.TRANSCRIPT_HEDGE_DELAY_MS !== undefined
    ? parseInt(process.env.TRANSCRIPT_HEDGE_DELAY_MS, 10)
    : 450;

class TranscriptService {
  constructor() {
    this._inFlight = new Map();
  }

  async _tryProvider(provider, videoId, options, providerErrors) {
    try {
      const canHandle = await provider.canHandle(videoId, options);
      if (!canHandle) return null;

      console.log(`[TranscriptService] Attempting provider "${provider.name}" for video ${videoId}...`);
      const result = await provider.fetchTranscript(videoId, options);
      if (result && validateRawSegments(result.segments)) {
        console.log(`[TranscriptService] Retrieved transcript via "${provider.name}"`);
        return { data: result, providerName: provider.name };
      }
      return null;
    } catch (err) {
      if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
        providerErrors.push({ provider: provider.name, message: err.message });
        console.warn(`[TranscriptService] Provider "${provider.name}" failed: ${err.message}`);
      }
      return null;
    }
  }

  /**
   * Hedged parallel retrieval: starts free YouTube captions immediately and launches
   * Supadata after HEDGE_DELAY_MS (default 450ms) if captions haven't resolved yet.
   * Whichever succeeds first aborts the other cleanly — cutting worst-case 17s serial
   * waterfalls down to ~0.3–1.2s and saving paid Supadata credits when public captions exist.
   */
  async _retrieveFromProviders(videoId, options, providerErrors) {
    const providers = transcriptFactory.getProvidersInPriorityOrder();
    const hasExplicitInput = Boolean(
      options.userTranscriptText ||
        options.userTranscriptSrt ||
        options.partnerApiUrl ||
        options.authorizedTranscriptFeed ||
        options.mockXml
    );

    if (hasExplicitInput) {
      for (const provider of providers) {
        const hit = await this._tryProvider(provider, videoId, options, providerErrors);
        if (hit) return hit;
      }
      return null;
    }

    const ytProvider = providers.find((p) => p.name === 'youtube_captions');
    const supadataProvider = providers.find((p) => p.name === 'supadata');
    const otherProviders = providers.filter(
      (p) => p.name !== 'youtube_captions' && p.name !== 'supadata'
    );

    if (ytProvider && supadataProvider) {
      const ytController = new AbortController();
      const supaController = new AbortController();
      let settled = false;
      let hedgeTimer = null;

      const raceResult = await new Promise((resolve) => {
        let pending = 2;

        const finishSuccess = (hit, cancelController) => {
          if (settled) return;
          settled = true;
          if (hedgeTimer) clearTimeout(hedgeTimer);
          try {
            cancelController.abort();
          } catch {}
          resolve(hit);
        };

        const finishMiss = () => {
          pending -= 1;
          if (!settled && pending <= 0) {
            resolve(null);
          }
        };

        let supadataStarted = false;

        // 2. Paid Supadata hedges after brief delay (or immediately if captions fail early)
        const startSupadata = () => {
          if (supadataStarted) return;
          supadataStarted = true;
          if (hedgeTimer) {
            clearTimeout(hedgeTimer);
            hedgeTimer = null;
          }
          if (settled) {
            finishMiss();
            return;
          }
          this._tryProvider(supadataProvider, videoId, { ...options, signal: supaController.signal }, providerErrors)
            .then((hit) => {
              if (hit) finishSuccess(hit, ytController);
              else finishMiss();
            });
        };

        // 1. Free YouTube captions attempt starts immediately
        this._tryProvider(ytProvider, videoId, { ...options, signal: ytController.signal }, providerErrors)
          .then((hit) => {
            if (hit) {
              finishSuccess(hit, supaController);
            } else {
              startSupadata();
              finishMiss();
            }
          });

        if (HEDGE_DELAY_MS <= 0) {
          startSupadata();
        } else {
          hedgeTimer = setTimeout(startSupadata, HEDGE_DELAY_MS);
        }
      });

      if (raceResult) return raceResult;
    }

    // Fallback: try any remaining/non-raced providers sequentially
    const fallbackList = ytProvider && supadataProvider ? otherProviders : providers;
    for (const provider of fallbackList) {
      const hit = await this._tryProvider(provider, videoId, options, providerErrors);
      if (hit) return hit;
    }
    return null;
  }

  /**
   * Retrieves, normalizes, and persists a transcript for a video using hedged providers
   * and single-flight deduplication so concurrent requests for the same videoId share 1 fetch.
   */
  async getOrFetchTranscript(videoId, options = {}) {
    const hasManualInput = Boolean(options.userTranscriptText || options.userTranscriptSrt);
    const cacheKey = `cache:transcript:${videoId}`;

    // 1. Check Redis cache first unless user is manually submitting a new transcript
    if (!hasManualInput) {
      const cached = await cache.getJson(cacheKey);
      if (cached) {
        return { transcript: cached, status: 'completed' };
      }
    }

    // 2. Single-flight deduplication for concurrent fetches of the same videoId
    if (!hasManualInput && this._inFlight.has(videoId)) {
      return this._inFlight.get(videoId);
    }

    const workPromise = (async () => {
      // 3. Check if normalized transcript already exists in PostgreSQL
      const existing = await prisma.videoTranscript.findUnique({
        where: { videoId },
      });

      if (existing && existing.status === 'completed' && !hasManualInput) {
        const payload = {
          videoId: existing.videoId,
          language: existing.language,
          source: existing.source,
          segments: existing.segments,
          fullText: existing.fullText,
          status: existing.status,
        };
        await cache.setJson(cacheKey, payload, 3600);
        return {
          transcript: payload,
          status: 'completed',
        };
      }

      // 4. Update Video status to 'fetching_transcript'
      await prisma.video
        .updateMany({
          where: { videoId },
          data: { transcriptStatus: 'fetching_transcript' },
        })
        .catch(() => {});

      const providerErrors = [];
      const retrieved = await this._retrieveFromProviders(videoId, options, providerErrors);

      // 5. Handle unavailable transcript
      if (!retrieved) {
        console.warn(`[TranscriptService] All transcript providers failed for video ${videoId}`);

        await prisma.video
          .updateMany({
            where: { videoId },
            data: {
              transcriptStatus: 'transcript_unavailable',
              summaryStatus: 'transcript_unavailable',
            },
          })
          .catch(() => {});

        return {
          transcript: null,
          status: 'transcript_unavailable',
          message: 'An accessible transcript could not be retrieved, so a summary cannot be generated yet.',
          providerErrors,
        };
      }

      // 6. Clean, format, normalize, and validate schema
      const normalized = normalizeTranscript({
        videoId,
        language: retrieved.data.language || 'en',
        source: retrieved.providerName,
        rawSegments: retrieved.data.segments,
      });
      validateNormalizedTranscript(normalized);

      // 7. Persist to PostgreSQL (VideoTranscript) and update Video status
      const savedTranscript = await prisma.videoTranscript.upsert({
        where: { videoId },
        create: {
          videoId,
          language: normalized.language,
          source: normalized.source,
          segments: normalized.segments,
          fullText: normalized.fullText,
          status: 'completed',
        },
        update: {
          language: normalized.language,
          source: normalized.source,
          segments: normalized.segments,
          fullText: normalized.fullText,
          status: 'completed',
        },
      });

      await prisma.video
        .updateMany({
          where: { videoId },
          data: { transcriptStatus: 'completed' },
        })
        .catch(() => {});

      const payload = {
        videoId: savedTranscript.videoId,
        language: savedTranscript.language,
        source: savedTranscript.source,
        segments: savedTranscript.segments,
        fullText: savedTranscript.fullText,
        status: savedTranscript.status,
      };
      await cache.setJson(cacheKey, payload, 3600);
      await cache.del(`cache:video:detail:${videoId}`);
      await cache.bumpEpochs('cache:videos:global_epoch');

      return {
        transcript: payload,
        status: 'completed',
      };
    })();

    if (!hasManualInput) {
      this._inFlight.set(videoId, workPromise);
      try {
        return await workPromise;
      } finally {
        this._inFlight.delete(videoId);
      }
    }

    return workPromise;
  }

  /**
   * Allows manual submission of a transcript by user or creator.
   */
  async submitUserTranscript(videoId, { text, srt, language = 'en' }) {
    return this.getOrFetchTranscript(videoId, {
      userTranscriptText: text,
      userTranscriptSrt: srt,
      language,
    });
  }
}

module.exports = new TranscriptService();
