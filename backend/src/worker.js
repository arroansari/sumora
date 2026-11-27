/**
 * Sumora Background Worker Entrypoint
 *
 * Runs BullMQ workers out-of-process for production environments.
 * Decouples background processing (transcripts, AI summaries, push notifications)
 * from the HTTP request handling server.
 */

require('dotenv').config();
const prisma = require('./config/db');
const { closeRedisClients } = require('./config/redis');
const { closeAllQueues } = require('./jobs');
const { closeStreamSubscriber } = require('./utils/aiStream.util');
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

let isShuttingDown = false;
const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n[Worker] ${signal} received: gracefully shutting down workers...`);

  const forceExitTimer = setTimeout(() => {
    console.error('[Worker] Forced exit after shutdown timeout');
    process.exit(1);
  }, 15000);
  forceExitTimer.unref();

  try {
    schedulerService.stop();
    await workerManager.stopAll();
    await closeAllQueues();
    await closeStreamSubscriber();
    await prisma.$disconnect();
    await closeRedisClients();
    console.log('[Worker] All workers closed. Exiting.');
    process.exit(0);
  } catch (err) {
    console.error('[Worker] Shutdown error:', err.message);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
