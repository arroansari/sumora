const { getFastRedisClient, isRedisReady } = require('../config/redis');

/**
 * Non-blocking Redis cache-aside helper.
 * Always skips cleanly in test mode or when Redis is unavailable so outages
 * gracefully fall back to PostgreSQL with <1ms overhead and zero crashes.
 */
function canUseCache() {
  if (process.env.NODE_ENV === 'test' && process.env.ENABLE_REDIS_CACHE_IN_TEST !== 'true') {
    return false;
  }
  if (process.env.DISABLE_REDIS_CACHE === 'true') {
    return false;
  }
  getFastRedisClient();
  return isRedisReady();
}

async function getRaw(key) {
  if (!canUseCache()) return null;
  try {
    return await getFastRedisClient().get(key);
  } catch {
    return null;
  }
}

async function setRaw(key, rawValue, ttlSeconds = 60) {
  if (!canUseCache() || rawValue === undefined || rawValue === null) return false;
  try {
    await getFastRedisClient().set(key, rawValue, 'EX', ttlSeconds);
    return true;
  } catch {
    return false;
  }
}

async function getJson(key) {
  const raw = await getRaw(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function setJson(key, value, ttlSeconds = 60) {
  if (value === undefined || value === null) return false;
  return setRaw(key, JSON.stringify(value), ttlSeconds);
}

async function del(...keys) {
  const flat = keys.flat().filter(Boolean);
  if (!canUseCache() || flat.length === 0) return false;
  try {
    await getFastRedisClient().del(...flat);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads multiple epoch versions in a single Redis MGET roundtrip.
 * Initializes missing epochs to '0' once via NX so repeated reads hit Redis cleanly.
 */
async function getEpochs(...keys) {
  if (!canUseCache() || keys.length === 0) return keys.map(() => '0');
  try {
    const client = getFastRedisClient();
    const vals = await client.mget(...keys);
    const missingIndices = [];
    for (let i = 0; i < vals.length; i++) {
      if (vals[i] === null) missingIndices.push(i);
    }
    if (missingIndices.length > 0) {
      const pipeline = client.pipeline();
      for (const idx of missingIndices) {
        pipeline.set(keys[idx], '0', 'EX', 86400, 'NX');
      }
      pipeline.exec().catch(() => {});
    }
    return vals.map((v) => v || '0');
  } catch {
    return keys.map(() => '0');
  }
}

async function bumpEpochs(...keys) {
  const flat = keys.flat().filter(Boolean);
  if (!canUseCache() || flat.length === 0) return false;
  try {
    const pipeline = getFastRedisClient().pipeline();
    for (const k of flat) {
      pipeline.incr(k);
      pipeline.expire(k, 86400);
    }
    await pipeline.exec();
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  canUseCache,
  getRaw,
  setRaw,
  getJson,
  setJson,
  del,
  getEpochs,
  bumpEpochs,
};
