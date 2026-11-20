const app = require('./app');
const config = require('./config');
const workerManager = require('./jobs/worker.manager');
const schedulerService = require('./jobs/scheduler.service');

const server = app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(` Sumora Backend running on port ${config.port}`);
  console.log(` Environment: ${config.env}`);
  console.log(` Health Check: http://localhost:${config.port}/api/health`);
  console.log(`===============================================`);

  // In development or when explicitly enabled, start BullMQ workers in-process.
  // All channel syncing, transcript fetching, and AI summarization are strictly ON-DEMAND when the user taps.
  if (config.workers.runInProcess) {
    console.log('[Server] RUN_WORKERS_IN_PROCESS=true: Starting workers in-process (Strict On-Demand Mode)');
    workerManager.startAll();
    // Background feed sync loop disabled per user request: strictly on-demand on tap
  } else {
    console.log('[Server] RUN_WORKERS_IN_PROCESS=false: BullMQ workers running out-of-process');
  }

  // Warn about missing Google OAuth credentials at startup
  if (!config.google.clientId || !config.google.clientSecret) {
    console.warn(`[Config] ⚠  GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set.`);
    console.warn(`[Config]    YouTube OAuth will be unavailable until these are configured.`);
    console.warn(`[Config]    Set them in backend/.env from Google Cloud Console → APIs & Services → Credentials.`);
  }

  if (!config.ai.geminiApiKey && !config.ai.openaiApiKey) {
    console.warn(`[Config] ⚠  No AI API key set (GEMINI_API_KEY or OPENAI_API_KEY).`);
    console.warn(`[Config]    AI summarization will fall back to mock provider.`);
  }
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  schedulerService.stop();
  await workerManager.stopAll();
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received: shutting down gracefully');
  schedulerService.stop();
  await workerManager.stopAll();
  server.close(() => {
    process.exit(0);
  });
});

module.exports = server;
