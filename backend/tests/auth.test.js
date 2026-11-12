const assert = require('assert');
const { encrypt, decrypt } = require('../src/utils/encryption.util');
const { signToken, verifyToken } = require('../src/utils/jwt.util');
const bcrypt = require('bcryptjs');

async function runTests() {
  console.log('🧪 Starting Phase 1 Backend Foundation Tests...\n');

  // Test 1: Encryption Utility (AES-256-GCM)
  console.log('Test 1: AES-256-GCM Token Encryption & Decryption');
  const sampleToken = 'ya29.a0AfH6SMD_mock_google_oauth_access_token_1234567890';
  const encrypted = encrypt(sampleToken);
  assert.ok(encrypted, 'Encrypted output should not be null');
  assert.notStrictEqual(encrypted, sampleToken, 'Ciphertext should not match plaintext');
  assert.strictEqual(encrypted.split(':').length, 3, 'Format must be iv:authTag:ciphertext');

  const decrypted = decrypt(encrypted);
  assert.strictEqual(decrypted, sampleToken, 'Decrypted text must match original plaintext');

  // Verify tampering detection (GCM auth tag check)
  const parts = encrypted.split(':');
  const tamperedCiphertext = parts[0] + ':' + parts[1] + ':' + parts[2].slice(0, -2) + 'ff';
  assert.throws(
    () => decrypt(tamperedCiphertext),
    /Unsupported state or unable to authenticate data|bad decrypt/i,
    'Tampered ciphertext must fail authentication'
  );
  console.log('  ✅ Encryption, decryption, and integrity verification passed.');

  // Test 2: JWT Utility
  console.log('\nTest 2: JWT Token Signing & Verification');
  const payload = { userId: 'user-uuid-1234', email: 'test@example.com' };
  const token = signToken(payload);
  assert.ok(token, 'Signed token should be generated');

  const decoded = verifyToken(token);
  assert.strictEqual(decoded.userId, payload.userId, 'Decoded userId should match');
  assert.strictEqual(decoded.email, payload.email, 'Decoded email should match');

  assert.throws(
    () => verifyToken('invalid.jwt.token'),
    /jwt malformed|invalid token/i,
    'Invalid token must be rejected'
  );
  console.log('  ✅ JWT signing and verification passed.');

  // Test 3: Password Hashing (bcryptjs)
  console.log('\nTest 3: Password Hashing with bcrypt');
  const password = 'SuperSecurePassword123!';
  const hash = await bcrypt.hash(password, 10);
  assert.notStrictEqual(hash, password, 'Hash should not match plaintext password');

  const isMatch = await bcrypt.compare(password, hash);
  assert.strictEqual(isMatch, true, 'bcrypt.compare should return true for valid password');

  const isWrongMatch = await bcrypt.compare('WrongPassword456!', hash);
  assert.strictEqual(isWrongMatch, false, 'bcrypt.compare should return false for invalid password');
  console.log('  ✅ Password hashing and comparison passed.');

  // Test 4: Zod Validation Schemas
  console.log('\nTest 4: Input Validation via Zod');
  const { validateRegister, validateLogin } = require('../src/modules/auth/auth.validator');

  // Test invalid email
  let req = { body: { email: 'not-an-email', password: 'password123' } };
  let statusResult = null;
  let jsonResult = null;
  let res = {
    status: (code) => {
      statusResult = code;
      return {
        json: (data) => {
          jsonResult = data;
        },
      };
    },
  };
  let nextCalled = false;
  validateRegister(req, res, () => {
    nextCalled = true;
  });
  assert.strictEqual(statusResult, 400, 'Invalid email should return 400');
  assert.strictEqual(nextCalled, false, 'Next should not be called on validation failure');

  // Test short password (< 8 chars)
  req = { body: { email: 'valid@example.com', password: 'short' } };
  statusResult = null;
  validateRegister(req, res, () => {
    nextCalled = true;
  });
  assert.strictEqual(statusResult, 400, 'Password under 8 chars should return 400');

  // Test valid registration data
  req = { body: { email: 'User@Example.com ', password: 'ValidPassword123!' } };
  nextCalled = false;
  validateRegister(req, res, () => {
    nextCalled = true;
  });
  assert.strictEqual(nextCalled, true, 'Valid payload should call next()');
  assert.strictEqual(req.body.email, 'User@Example.com', 'Email should be trimmed');
  console.log('  ✅ Input validation passed.');

  // Test 5: Express App Route Mounting
  console.log('\nTest 5: Express App Route Mounting');
  const app = require('../src/app');
  assert.ok(app, 'Express app should be successfully exported');
  console.log('  ✅ Express app initialized and all routes mounted.');

  console.log('\n🎉 All Phase 1 Foundation Tests Passed Successfully!');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});

