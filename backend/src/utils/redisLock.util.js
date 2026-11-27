const crypto = require('crypto');
const { getFastRedisClient, isRedisReady } = require('../config/redis');

const RELEASE_LUA = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
`;

/**
 * Attempts to acquire a distributed Redis lock atomically via SET NX PX.
 * Returns a lock token string if acquired, null if already held by another worker,
 * or 'local-bypass' if Redis is unavailable (graceful degradation).
 */
async function acquireLock(key, ttlMs = 30000) {
  if (!isRedisReady()) {
    return 'local-bypass';
  }
  const client = getFastRedisClient();
  const token = crypto.randomUUID();
  try {
    const res = await client.set(key, token, 'PX', ttlMs, 'NX');
    return res === 'OK' ? token : null;
  } catch {
    return 'local-bypass';
  }
}

async function releaseLock(key, token) {
  if (!token || token === 'local-bypass' || !isRedisReady()) {
    return true;
  }
  const client = getFastRedisClient();
  try {
    await client.eval(RELEASE_LUA, 1, key, token);
    return true;
  } catch {
    return false;
  }
}

/**
 * Runs fn only if the distributed lock is acquired.
 * If another process holds the lock, returns { skipped: true }.
 */
async function withDistributedLock(key, ttlMs, fn) {
  const token = await acquireLock(key, ttlMs);
  if (!token) {
    return { skipped: true };
  }
  try {
    return await fn();
  } finally {
    await releaseLock(key, token);
  }
}

module.exports = {
  acquireLock,
  releaseLock,
  withDistributedLock,
};
