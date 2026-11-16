const assert = require('assert');

console.log('🧪 Starting Redis & BullMQ Configuration Tests...\n');

// Test 1: Standard host/port configuration
console.log('Test 1: Default Redis connection options');
delete process.env.REDIS_URL;
delete process.env.REDIS_TLS;
process.env.REDIS_HOST = '10.0.0.1';
process.env.REDIS_PORT = '6380';
process.env.REDIS_PASSWORD = 'secret_password';

// Clear module cache
delete require.cache[require.resolve('../src/config')];
delete require.cache[require.resolve('../src/jobs')];

const jobsModule1 = require('../src/jobs');
const opts1 = jobsModule1.connection;
assert.strictEqual(opts1.host, '10.0.0.1');
assert.strictEqual(opts1.port, 6380);
assert.strictEqual(opts1.password, 'secret_password');
assert.strictEqual(opts1.tls, undefined);
console.log('  ✅ Standard host/port config correctly parsed.\n');

// Test 2: Upstash / AWS ElastiCache rediss:// TLS URL
console.log('Test 2: Upstash / AWS ElastiCache rediss:// with TLS');
process.env.REDIS_URL = 'rediss://default:upstashpass123@us1-test-redis.upstash.io:6379';
process.env.REDIS_REJECT_UNAUTHORIZED = 'false';

delete require.cache[require.resolve('../src/config')];
delete require.cache[require.resolve('../src/jobs')];

const jobsModule2 = require('../src/jobs');
const opts2 = jobsModule2.connection;
assert.strictEqual(opts2.host, 'us1-test-redis.upstash.io');
assert.strictEqual(opts2.port, 6379);
assert.strictEqual(opts2.password, 'upstashpass123');
assert(opts2.tls !== undefined, 'TLS options must be present for rediss:// URL');
assert.strictEqual(opts2.tls.rejectUnauthorized, false, 'rejectUnauthorized should match config');
console.log('  ✅ Secure TLS rediss:// URL successfully parsed with TLS options.\n');

// Test 3: Standard redis:// URL
console.log('Test 3: Standard redis:// URL parsing');
process.env.REDIS_URL = 'redis://:mypass@redis-cache.internal:6379';

delete require.cache[require.resolve('../src/config')];
delete require.cache[require.resolve('../src/jobs')];

const jobsModule3 = require('../src/jobs');
const opts3 = jobsModule3.connection;
assert.strictEqual(opts3.host, 'redis-cache.internal');
assert.strictEqual(opts3.port, 6379);
assert.strictEqual(opts3.password, 'mypass');
console.log('  ✅ Standard redis:// URL successfully parsed.\n');

// Clean up
delete process.env.REDIS_URL;
delete process.env.REDIS_TLS;
delete process.env.REDIS_REJECT_UNAUTHORIZED;
process.env.REDIS_HOST = '127.0.0.1';
process.env.REDIS_PORT = '6379';

console.log('🎉 All Redis & BullMQ Configuration Tests Passed Successfully!');

