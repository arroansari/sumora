const assert = require('assert');
const fcmService = require('../src/modules/notifications/fcm.service');

async function runTests() {
  console.log('🧪 Starting Phase 6 Notifications & Preferences Tests...\n');

  // Test 1: Notification Payload Formulation (Section 13 compliance)
  console.log('Test 1: Push Notification Payload Formatting (Section 13 Rules)');
  const readyPayload = fcmService.buildNotificationPayload({
    channelName: 'Fireship',
    videoTitle: 'React Native in 100 Seconds - Super Fast Overview',
    videoId: 'dQw4w9WgXcQ',
    isReady: true,
  });

  assert.strictEqual(
    readyPayload.notification.title,
    'New video from Fireship. Your AI summary is ready!',
    'Title must match exact ready notification text'
  );
  assert.ok(
    readyPayload.notification.body.includes('React Native in 100 Seconds'),
    'Body should contain truncated video title'
  );
  assert.strictEqual(
    readyPayload.data.videoId,
    'dQw4w9WgXcQ',
    'Payload must carry target videoId so mobile app navigates directly to summary detail'
  );
  assert.strictEqual(
    readyPayload.data.click_action,
    'OPEN_SUMMARY_DETAIL',
    'Click action should be defined for mobile deep navigation'
  );

  // Verify preparing payload
  const preparingPayload = fcmService.buildNotificationPayload({
    channelName: 'Lex Fridman',
    videoTitle: 'Episode 400 - AI and the Future of Engineering',
    videoId: 'lex_400',
    isReady: false,
  });

  assert.strictEqual(
    preparingPayload.notification.title,
    "New video from Lex Fridman. We're preparing your summary.",
    'Title must match preparing notification text when summary is in progress'
  );
  console.log('  ✅ Notification titles and payloads formatted strictly according to Section 13.');

  // Test 2: Multicast Push Dispatch
  console.log('\nTest 2: Multicast Push Dispatch to Registered Devices');
  const mockTokens = [
    'fcm_token_iphone_15_pro_abc123',
    'fcm_token_pixel_8_pro_def456',
    'fcm_token_galaxy_s24_ghi789',
  ];

  const sendResult = await fcmService.sendToDevices(mockTokens, readyPayload);
  assert.strictEqual(sendResult.successCount, 3, 'Should report 3 successful deliveries in dev/mock mode');
  assert.strictEqual(sendResult.failureCount, 0);
  console.log('  ✅ Multicast device delivery verified.');

  // Test 3: Empty Token List Handling
  console.log('\nTest 3: Empty Device List Handling');
  const emptyResult = await fcmService.sendToDevices([], readyPayload);
  assert.strictEqual(emptyResult.successCount, 0);
  assert.strictEqual(emptyResult.failureCount, 0);
  console.log('  ✅ Gracefully handles empty device lists.');

  console.log('\n🎉 All Phase 6 Notification Tests Passed Successfully!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});

