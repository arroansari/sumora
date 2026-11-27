const prisma = require('../config/db');
const { verifyToken } = require('../utils/jwt.util');
const cache = require('../utils/cache.util');

const USER_CACHE_TTL_SEC = 300;

async function findUserByIdCached(userId) {
  const cacheKey = `cache:user:${userId}`;
  const cached = await cache.getJson(cacheKey);
  if (cached) return cached;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (user) {
    await cache.setJson(cacheKey, user, USER_CACHE_TTL_SEC);
  }
  return user;
}

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token is required in Bearer format',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }

    const userId = decoded?.userId || decoded?.id || decoded?.sub;
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token payload',
      });
    }

    const user = await findUserByIdCached(userId);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User account not found',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : req.query.token;

    if (token) {
      try {
        const decoded = verifyToken(token);
        const user = await findUserByIdCached(decoded.userId);
        if (user) {
          req.user = user;
        }
      } catch (err) {
        // invalid optional token; continue unauthenticated
      }
    }
    next();
  } catch (error) {
    next();
  }
}

module.exports = {
  authenticate,
  optionalAuthenticate,
};
