const bcrypt = require('bcryptjs');
const prisma = require('../../config/db');
const { signToken } = require('../../utils/jwt.util');

class AuthService {
  /**
   * Registers a new user in PostgreSQL.
   * @param {object} params
   * @param {string} params.email
   * @param {string} params.password
   */
  async register({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      const error = new Error('A user with this email address already exists');
      error.status = 409;
      error.name = 'ConflictError';
      throw error;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        notificationPreferences: {
          create: {
            platform: 'youtube',
            enabled: true,
          },
        },
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = signToken({ userId: user.id, email: user.email });

    return {
      user,
      token,
    };
  }

  /**
   * Authenticates user against PostgreSQL and returns signed JWT.
   * @param {object} params
   * @param {string} params.email
   * @param {string} params.password
   */
  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      const error = new Error('Invalid email or password');
      error.status = 401;
      error.name = 'UnauthorizedError';
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      const error = new Error('Invalid email or password');
      error.status = 401;
      error.name = 'UnauthorizedError';
      throw error;
    }

    const token = signToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };
  }

  /**
   * Retrieves profile of current user from PostgreSQL.
   * @param {string} userId
   */
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        connectedAccounts: {
          select: {
            id: true,
            platform: true,
            platformUserId: true,
            status: true,
            connectedAt: true,
          },
        },
        trackedSources: {
          select: {
            id: true,
            platform: true,
            sourceId: true,
            sourceName: true,
            createdAt: true,
          },
        },
        notificationPreferences: {
          select: {
            id: true,
            platform: true,
            enabled: true,
          },
        },
      },
    });

    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      error.name = 'NotFoundError';
      throw error;
    }

    return user;
  }
}

module.exports = new AuthService();
