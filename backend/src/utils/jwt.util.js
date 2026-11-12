const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generates a signed JWT for a given payload.
 * @param {object} payload - Data to embed in the token.
 * @param {object} [options] - Optional JWT options.
 * @returns {string} Signed JWT.
 */
function signToken(payload, options = {}) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    ...options,
  });
}

/**
 * Verifies and decodes a JWT.
 * @param {string} token - JWT token string.
 * @returns {object} Decoded payload.
 */
function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = {
  signToken,
  verifyToken,
};

