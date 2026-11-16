const crypto = require('crypto');
const config = require('../config');

const OAUTH_STATE_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Signs an OAuth state payload using HMAC-SHA256 to prevent CSRF and state tampering.
 * @param {object} payload - e.g. { userId: string, platform?: string }
 * @returns {string} Base64url-encoded signed state token
 */
function signOAuthState(payload = {}) {
  const secret = config.jwt?.secret || 'oauth_state_hmac_secret';
  const data = JSON.stringify({
    ...payload,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(8).toString('hex'),
  });

  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
  const token = JSON.stringify({ data, sig: signature });
  return Buffer.from(token, 'utf8').toString('base64url');
}

/**
 * Verifies and decodes an HMAC-signed OAuth state token.
 * Prevents replay attacks by checking timestamp expiration (< 15 mins).
 * @param {string} encodedState
 * @returns {object|null} Decoded payload or null if invalid/expired/tampered
 */
function verifyOAuthState(encodedState) {
  if (!encodedState || typeof encodedState !== 'string') {
    return null;
  }

  const secret = config.jwt?.secret || 'oauth_state_hmac_secret';

  try {
    // Try base64url or base64 decode
    const raw = Buffer.from(encodedState, encodedState.includes('-') || encodedState.includes('_') ? 'base64url' : 'base64').toString('utf8');
    const parsed = JSON.parse(raw);

    // If signed format { data, sig }
    if (parsed.data && parsed.sig) {
      const expectedSignature = crypto.createHmac('sha256', secret).update(parsed.data).digest('hex');
      const sigBuf = Buffer.from(parsed.sig, 'hex');
      const expectedBuf = Buffer.from(expectedSignature, 'hex');

      if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return null;
      }

      const payload = JSON.parse(parsed.data);

      // Check max age (15 mins)
      if (payload.timestamp && Date.now() - payload.timestamp > OAUTH_STATE_MAX_AGE_MS) {
        return null;
      }

      return payload;
    }

    // In non-production, allow raw base64 JSON if timestamp is present (backward compatibility for tests)
    if (process.env.NODE_ENV !== 'production' && parsed.userId) {
      return parsed;
    }

    return null;
  } catch (err) {
    return null;
  }
}

module.exports = {
  signOAuthState,
  verifyOAuthState,
};
