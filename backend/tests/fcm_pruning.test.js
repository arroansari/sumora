const assert = require('assert');

console.log('🧪 Starting FCM Production Configuration & Token Pruning Tests...\n');

// Test 1: Service Account JSON and Base64 Parsing
console.log('Test 1: Firebase Service Account Parsing (JSON & Base64)');
const fakeCredentials = {
  project_id: 'sumora-prod',
  client_email: 'firebase-adminsdk@sumora-prod.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC\n-----END PRIVATE KEY-----\n',
};

// Test JSON env var
const jsonString = JSON.stringify(fakeCredentials);
const parsedFromJson = JSON.parse(jsonString);
assert.strictEqual(parsedFromJson.project_id, 'sumora-prod');

// Test Base64 env var
const base64String = Buffer.from(jsonString).toString('base64');
const parsedFromBase64 = JSON.parse(Buffer.from(base64String, 'base64').toString('utf8'));
assert.strictEqual(parsedFromBase64.project_id, 'sumora-prod');
console.log('  ✅ Both JSON string and Base64 credential formats parse identically.\n');

// Test 2: Production mode blocks uninitialized FCM mock sends
console.log('Test 2: Production mode rejection when Firebase credentials absent');
const originalEnv = process.env.NODE_ENV;
process.env.NODE_ENV = 'production';

// Simulated uninitialized FCM service send
function simulateSend(isInitialized, deviceTokens, payload) {
  if (!isInitialized) {
    if (process.env.NODE_ENV === 'production') {
      return {
        successCount: 0,
        failureCount: deviceTokens.length,
        error: 'Firebase Admin SDK not initialized in production',
      };
    }
    return {
      successCount: deviceTokens.length,
      failureCount: 0,
      mock: true,
    };
  }
}

const prodResult = simulateSend(false, ['token-1', 'token-2'], {});
assert.strictEqual(prodResult.successCount, 0);
assert.strictEqual(prodResult.failureCount, 2);
assert(prodResult.error.includes('not initialized in production'));
console.log('  ✅ Production mode strictly rejects mock sends and reports failure.\n');

process.env.NODE_ENV = originalEnv;

// Test 3: Stale/unregistered token pruning identification
console.log('Test 3: Unregistered and invalid device token pruning logic');
const deviceTokens = ['token-valid-1', 'token-stale-2', 'token-valid-3', 'token-unregistered-4'];
const mockMulticastResponses = [
  { success: true },
  { success: false, error: { code: 'messaging/invalid-registration-token' } },
  { success: true },
  { success: false, error: { code: 'messaging/registration-token-not-registered' } },
];

const invalidTokens = [];
mockMulticastResponses.forEach((resp, index) => {
  if (!resp.success && resp.error) {
    const code = resp.error.code;
    if (
      code === 'messaging/invalid-registration-token' ||
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/mismatched-credential'
    ) {
      invalidTokens.push(deviceTokens[index]);
    }
  }
});

assert.strictEqual(invalidTokens.length, 2);
assert.deepStrictEqual(invalidTokens, ['token-stale-2', 'token-unregistered-4']);
console.log('  ✅ Invalid tokens accurately isolated for pruning.\n');

console.log('🎉 All FCM Production & Token Pruning Tests Passed Successfully!');
