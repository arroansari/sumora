const app = require('./app');
const config = require('./config');
const prisma = require('./config/db');
const { closeRedisClients } = require('./config/redis');
const { closeAllQueues } = require('./jobs');
const { closeStreamSubscriber } = require('./utils/aiStream.util');
const workerManager = require('./jobs/worker.manager');
const schedulerService = require('./jobs/scheduler.service');

const server = app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(` Sumora Backend running on port ${config.port} (pid=${process.pid})`);
  console.log(` Environment: ${config.env}`);
  console.log(` Health Check: http://localhost:${config.port}/api/health`);
  console.log(`===============================================`);

  // Under cluster mode (PM2 NODE_APP_INSTANCE or RUN_WORKERS_IN_PROCESS=false),
  // BullMQ workers run in the dedicated worker process so they don't duplicate N times.
  const isClusterWorker =
    process.env.NODE_APP_INSTANCE !== undefined && process.env.NODE_APP_INSTANCE !== '0';

  if (config.workers.runInProcess && !isClusterWorker) {
    console.log('[Server] RUN_WORKERS_IN_PROCESS=true: Starting workers in-process (Strict On-Demand Mode)');
    workerManager.startAll();
  } else {
    console.log('[Server] BullMQ workers decoupled (running out-of-process)');
  }

  // Warn about missing Google OAuth credentials at startup (only once on instance 0 / standalone)
  if (!isClusterWorker && (!config.google.clientId || !config.google.clientSecret)) {
    console.warn(`[Config] ⚠  GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set.`);
    console.warn(`[Config]    YouTube OAuth will be unavailable until these are configured.`);
    console.warn(`[Config]    Set them in backend/.env from Google Cloud Console → APIs & Services → Credentials.`);
  }

  if (!isClusterWorker && !config.ai.geminiApiKey && !config.ai.openaiApiKey) {
    console.warn(`[Config] ⚠  No AI API key set (GEMINI_API_KEY or OPENAI_API_KEY).`);
    console.warn(`[Config]    AI summarization will fall back to mock provider.`);
  }
});

// ALB / Reverse-Proxy Alignment & Socket Hardening:
// AWS ALB default idle timeout is 60s; Node keepAliveTimeout defaults to 5s, causing 502s.
server.keepAliveTimeout = parseInt(process.env.HTTP_KEEP_ALIVE_TIMEOUT_MS, 10) || 65000;
server.headersTimeout = parseInt(process.env.HTTP_HEADERS_TIMEOUT_MS, 10) || 66000;
server.requestTimeout = parseInt(process.env.HTTP_REQUEST_TIMEOUT_MS, 10) || 30000;
server.maxConnections = parseInt(process.env.HTTP_MAX_CONNECTIONS, 10) || 2000;

let isShuttingDown = false;
async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[Server pid=${process.pid}] ${signal} received: shutting down gracefully`);

  const forceExitTimer = setTimeout(() => {
    console.error(`[Server pid=${process.pid}] Forced exit after shutdown timeout`);
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  server.close(async () => {
    try {
      schedulerService.stop();
      await workerManager.stopAll();
      await closeAllQueues();
      await closeStreamSubscriber();
      await prisma.$disconnect();
      await closeRedisClients();
      console.log(`[Server pid=${process.pid}] Graceful shutdown complete`);
      process.exit(0);
    } catch (err) {
      console.error(`[Server pid=${process.pid}] Shutdown error:`, err.message);
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;
