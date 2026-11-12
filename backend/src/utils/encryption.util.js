const crypto = require('crypto');
const config = require('../config');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Returns a 32-byte Buffer from the configured encryption key.
 */
function getEncryptionKeyBuffer() {
  const key = config.encryption.key;
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY is not defined in configuration');
  }
  // If hex string of 64 chars (32 bytes), parse as hex
  if (/^[0-9a-fA-F]{64}$/.test(key)) {
    return Buffer.from(key, 'hex');
  }
  // Otherwise, hash key to ensure exactly 32 bytes
  return crypto.createHash('sha256').update(String(key)).digest();
}

/**
 * Encrypts a string using AES-256-GCM.
 * @param {string} text - Plain text to encrypt.
 * @returns {string} Encrypted string in format: iv:authTag:ciphertext (hex-encoded).
 */
function encrypt(text) {
  if (text === null || text === undefined) {
    return null;
  }
  const key = getEncryptionKeyBuffer();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a string previously encrypted with AES-256-GCM.
 * @param {string} encryptedString - String in format: iv:authTag:ciphertext (hex-encoded).
 * @returns {string} Decrypted plain text.
 */
function decrypt(encryptedString) {
  if (!encryptedString) {
    return null;
  }
  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted string format. Expected iv:authTag:ciphertext');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getEncryptionKeyBuffer();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = {
  encrypt,
  decrypt,
};

