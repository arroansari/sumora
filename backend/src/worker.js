/**
 * Sumora Background Worker Entrypoint
 *
 * Runs BullMQ workers out-of-process for production environments.
 * Decouples background processing (transcripts, AI summaries, push notifications)
 * from the HTTP request handling server.
 */

require('dotenv').config();
const workerManager = require('./jobs/worker.manager');
const schedulerService = require('./jobs/scheduler.service');

console.log('===============================================');
console.log(' Starting Sumora Background Workers (Out-of-Process)');
console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
console.log('===============================================');

async function start() {
  await workerManager.startAll();
  schedulerService.start();

  console.log('[Worker] Worker processes initialized and listening for jobs.');
}

start().catch((err) => {
  console.error('[Worker] Fatal error starting workers:', err);
  process.exit(1);
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n[Worker] ${signal} received: gracefully shutting down workers...`);
  schedulerService.stop();
  await workerManager.stopAll();
  console.log('[Worker] All workers closed. Exiting.');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

