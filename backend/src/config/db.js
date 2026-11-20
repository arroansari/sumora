const { PrismaClient } = require('@prisma/client');
const config = require('./index');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    const logLevels = ['warn', 'error'];
    if (process.env.DEBUG_PRISMA === 'true') {
      logLevels.push('query', 'info');
    }
    global.__prisma = new PrismaClient({
      log: logLevels,
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;

