const { PrismaClient } = require('@prisma/client');
const config = require('./index');

function buildDatasourceUrl() {
  const rawUrl = config.databaseUrl || process.env.DATABASE_URL;
  if (!rawUrl) return undefined;

  const limit = process.env.PRISMA_CONNECTION_LIMIT;
  if (!limit) return rawUrl;

  try {
    const parsed = new URL(rawUrl);
    if (!parsed.searchParams.has('connection_limit')) {
      parsed.searchParams.set('connection_limit', String(limit));
    }
    if (!parsed.searchParams.has('pool_timeout') && process.env.PRISMA_POOL_TIMEOUT) {
      parsed.searchParams.set('pool_timeout', String(process.env.PRISMA_POOL_TIMEOUT));
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

let prisma;

const datasourceUrl = buildDatasourceUrl();
const clientOpts = datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {};

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient(clientOpts);
} else {
  if (!global.__prisma) {
    const logLevels = ['warn', 'error'];
    if (process.env.DEBUG_PRISMA === 'true') {
      logLevels.push('query', 'info');
    }
    global.__prisma = new PrismaClient({
      ...clientOpts,
      log: logLevels,
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
