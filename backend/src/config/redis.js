const Redis = require('ioredis');
const config = require('./index');

let redisClient = null;

function getRedisClient() {
  if (!redisClient) {
    const options = {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    };

    if (config.redis.tls) {
      options.tls = {
        rejectUnauthorized: config.redis.rejectUnauthorized,
      };
    }

    if (config.redis.url) {
      redisClient = new Redis(config.redis.url, options);
    } else {
      redisClient = new Redis({
        ...options,
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
      });
    }

    redisClient.on('error', (err) => {
      console.warn('[Redis] Connection warning:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });
  }
  return redisClient;
}

module.exports = {
  getRedisClient,
  redisConfig: config.redis,
};

