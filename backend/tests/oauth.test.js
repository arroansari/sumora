const assert = require('assert');
const { signOAuthState, verifyOAuthState } = require('../src/utils/oauth.util');

console.log('🧪 Starting OAuth Security & State Verification Tests...\n');

// Test 1: Sign and verify valid state
console.log('Test 1: Sign and verify valid OAuth state');
const state = signOAuthState({ userId: 'user-12345', platform: 'reddit' });
assert(typeof state === 'string' && state.length > 20, 'State must be a non-empty string');
const decoded = verifyOAuthState(state);
assert.strictEqual(decoded.userId, 'user-12345', 'UserId should match');
assert.strictEqual(decoded.platform, 'reddit', 'Platform should match');
console.log('  ✅ Valid state signing and verification passed.\n');

// Test 2: Tampered state rejection
console.log('Test 2: Tampered state payload rejection');
const raw = Buffer.from(state, 'base64url').toString('utf8');
const parsed = JSON.parse(raw);
const tamperedData = JSON.stringify({ ...JSON.parse(parsed.data), userId: 'victim-user' });
const tamperedToken = Buffer.from(JSON.stringify({ data: tamperedData, sig: parsed.sig })).toString('base64url');
const tamperedDecoded = verifyOAuthState(tamperedToken);
assert.strictEqual(tamperedDecoded, null, 'Tampered state must return null');
console.log('  ✅ Tampered state successfully rejected.\n');

// Test 3: Garbage/invalid string handling
console.log('Test 3: Malformed state rejection');
assert.strictEqual(verifyOAuthState('not-a-valid-token'), null);
assert.strictEqual(verifyOAuthState(''), null);
assert.strictEqual(verifyOAuthState(null), null);
console.log('  ✅ Malformed inputs safely rejected.\n');

console.log('🎉 All OAuth Security Tests Passed Successfully!');
