const assert = require('assert');
const crypto = require('crypto');
const youTubeService = require('../src/modules/integrations/youtube/youtube.service');
const webSubService = require('../src/modules/integrations/youtube/websub.service');
const config = require('../src/config');

async function runTests() {
  console.log('🧪 Starting Phase 2 YouTube Integration Tests...\n');

  // Test 1: YouTube OAuth URL Generation
  console.log('Test 1: Google OAuth2 URL Generation');
  config.google.clientId = 'test-client-id.apps.googleusercontent.com';
  const state = Buffer.from(JSON.stringify({ userId: 'user-123' })).toString('base64');
  const authUrl = youTubeService.getAuthUrl(state);

  assert.ok(authUrl.startsWith('https://accounts.google.com/o/oauth2/v2/auth'), 'Must use Google OAuth2 base URL');
  assert.ok(authUrl.includes('client_id=test-client-id.apps.googleusercontent.com'), 'Must contain client_id');
  assert.ok(authUrl.includes('https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube.readonly'), 'Must request youtube.readonly scope');
  assert.ok(authUrl.includes('access_type=offline'), 'Must request offline access for refresh token');
  console.log('  ✅ YouTube OAuth2 URL correctly configured with required scopes and parameters.');

  // Test 2: WebSub Hub Topic URL Generation
  console.log('\nTest 2: WebSub Topic URL Generation');
  const channelId = 'UC_x5XG1OV2P6uZZ5FSM9Ttw';
  const topicUrl = webSubService.getTopicUrl(channelId);
  assert.strictEqual(
    topicUrl,
    'https://www.youtube.com/xml/feeds/videos.xml?channel_id=UC_x5XG1OV2P6uZZ5FSM9Ttw',
    'Topic URL must point to YouTube channel Atom feed'
  );
  console.log('  ✅ Topic URL generation verified.');

  // Test 3: WebSub Atom XML Feed Parsing
  console.log('\nTest 3: WebSub Atom XML Feed Parsing');
  const mockAtomFeed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns="http://www.w3.org/2005/Atom">
  <link rel="hub" href="https://pubsubhubbub.appspot.com"/>
  <link rel="self" href="https://www.youtube.com/xml/feeds/videos.xml?channel_id=UC_x5XG1OV2P6uZZ5FSM9Ttw"/>
  <title>YouTube video feed</title>
  <updated>2026-11-11T10:00:00+00:00</updated>
  <entry>
    <id>yt:video:dQw4w9WgXcQ</id>
    <yt:videoId>dQw4w9WgXcQ</yt:videoId>
    <yt:channelId>UC_x5XG1OV2P6uZZ5FSM9Ttw</yt:channelId>
    <title>Building Scalable Node.js &amp; React Native Apps</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"/>
    <author>
      <name>Google Developers</name>
      <uri>https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw</uri>
    </author>
    <published>2026-11-11T09:45:00+00:00</published>
    <updated>2026-11-11T09:45:00+00:00</updated>
  </entry>
</feed>`;

  const entries = webSubService.parseAtomFeed(mockAtomFeed);
  assert.strictEqual(entries.length, 1, 'Should extract exactly 1 video entry');
  assert.strictEqual(entries[0].videoId, 'dQw4w9WgXcQ', 'Video ID must be extracted');
  assert.strictEqual(entries[0].channelId, 'UC_x5XG1OV2P6uZZ5FSM9Ttw', 'Channel ID must be extracted');
  assert.strictEqual(entries[0].title, 'Building Scalable Node.js & React Native Apps', 'Title must be decoded');
  assert.strictEqual(entries[0].videoUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Video URL must be present');
  assert.strictEqual(entries[0].channelName, 'Google Developers', 'Channel name must be extracted');
  console.log('  ✅ Atom feed parser successfully extracted YouTube video metadata.');

  // Test 4: WebSub HMAC-SHA1 Signature Verification
  console.log('\nTest 4: WebSub HMAC-SHA1 Signature Verification');
  const secret = config.websub.secret || 'websub_secret_key_sumora';
  config.websub.secret = secret;

  const validSignature = 'sha1=' + crypto.createHmac('sha1', secret).update(mockAtomFeed, 'utf8').digest('hex');
  const isValid = webSubService.verifySignature(mockAtomFeed, validSignature);
  assert.strictEqual(isValid, true, 'Valid signature must be verified successfully');

  const invalidSignature = 'sha1=' + crypto.createHmac('sha1', 'wrong_secret').update(mockAtomFeed, 'utf8').digest('hex');
  const isInvalid = webSubService.verifySignature(mockAtomFeed, invalidSignature);
  assert.strictEqual(isInvalid, false, 'Invalid signature must be rejected');

  const tamperedValid = webSubService.verifySignature(mockAtomFeed + 'tampered', validSignature);
  assert.strictEqual(tamperedValid, false, 'Tampered payload must be rejected');
  console.log('  ✅ WebSub HMAC signature verification passed.');

  // Test 5: WebSub Challenge Verification
  console.log('\nTest 5: WebSub Challenge Handshake');
  const webSubController = require('../src/modules/integrations/youtube/websub.controller');
  let responseStatus = null;
  let responseBody = null;
  const mockRes = {
    status: (code) => {
      responseStatus = code;
      return {
        send: (body) => {
          responseBody = body;
        },
      };
    },
  };
  const mockReq = {
    query: {
      'hub.mode': 'subscribe',
      'hub.topic': 'https://www.youtube.com/xml/feeds/videos.xml?channel_id=UC_x5XG1OV2P6uZZ5FSM9Ttw',
      'hub.challenge': 'random_hub_challenge_token_98765',
      'hub.lease_seconds': '864000',
    },
  };

  webSubController.verifyWebhook(mockReq, mockRes);
  assert.strictEqual(responseStatus, 200, 'Handshake must return 200 OK');
  assert.strictEqual(responseBody, 'random_hub_challenge_token_98765', 'Must echo back hub.challenge');
  console.log('  ✅ WebSub handshake verification passed.');

  console.log('\n🎉 All Phase 2 YouTube Integration Tests Passed Successfully!');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});

