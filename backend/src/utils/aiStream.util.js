const { EventEmitter } = require('events');
const Redis = require('ioredis');
const config = require('../config');
const { getFastRedisClient, isRedisReady } = require('../config/redis');

const CHANNEL = 'ai:summary:events';
const localBus = new EventEmitter();
localBus.setMaxListeners(5000);

let subClient = null;
let subInitialized = false;

function ensureSubscriber() {
  if (subInitialized) return;
  if (process.env.NODE_ENV === 'test' && process.env.ENABLE_REDIS_STREAM_IN_TEST !== 'true') {
    return;
  }
  if (!isRedisReady()) return;

  subInitialized = true;
  try {
    const opts = {
      lazyConnect: true,
      enableReadyCheck: true,
      maxRetriesPerRequest: null,
      ...(config.redis.tls ? { tls: { rejectUnauthorized: config.redis.rejectUnauthorized } } : {}),
    };
    subClient = config.redis.url
      ? new Redis(config.redis.url, opts)
      : new Redis({ ...opts, host: config.redis.host, port: config.redis.port, password: config.redis.password });

    subClient.on('error', () => {});
    subClient.on('message', (_chan, msg) => {
      try {
        const event = JSON.parse(msg);
        if (event && event.videoId) {
          localBus.emit(`video:${event.videoId}`, event);
        }
      } catch {}
    });
    subClient.connect().then(() => subClient.subscribe(CHANNEL)).catch(() => {
      subInitialized = false;
    });
  } catch {
    subInitialized = false;
  }
}

function publish(videoId, payload) {
  if (!videoId) return;
  const event = { videoId, ts: Date.now(), ...payload };
  localBus.emit(`video:${videoId}`, event);

  if (isRedisReady()) {
    try {
      getFastRedisClient().publish(CHANNEL, JSON.stringify(event)).catch(() => {});
    } catch {}
  }
}

function subscribe(videoId, handler) {
  ensureSubscriber();
  const key = `video:${videoId}`;
  localBus.on(key, handler);
  return () => {
    localBus.off(key, handler);
  };
}

async function closeStreamSubscriber() {
  if (subClient) {
    try {
      await subClient.quit();
    } catch {
      try { subClient.disconnect(); } catch {}
    }
    subClient = null;
    subInitialized = false;
  }
}

module.exports = {
  publish,
  subscribe,
  closeStreamSubscriber,
};
