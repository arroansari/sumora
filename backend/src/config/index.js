require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  databaseUrl: process.env.DATABASE_URL,
  redis: {
    url: process.env.REDIS_URL || undefined,
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === 'true' || (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('rediss://')),
    rejectUnauthorized: process.env.REDIS_REJECT_UNAUTHORIZED === 'true',
  },
  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
      : ['*'],
  },
  workers: {
    runInProcess: process.env.RUN_WORKERS_IN_PROCESS !== 'false',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'sumora_development_secret_key_12345',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  encryption: {
    key: process.env.TOKEN_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/integrations/youtube/callback',
  },
  websub: {
    secret: process.env.WEBSUB_SECRET || 'websub_secret_key_sumora',
    callbackUrl: process.env.WEBSUB_CALLBACK_URL || 'http://localhost:5000/api/webhooks/youtube',
  },
  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID || '',
    clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
    redirectUri: process.env.REDDIT_REDIRECT_URI || 'http://localhost:5000/api/auth/reddit/callback',
    userAgent: process.env.REDDIT_USER_AGENT || 'Sumora/1.0.0 (by /u/sumora_app)',
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'gemini',
    geminiApiKey: process.env.GEMINI_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
  },
};
