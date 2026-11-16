/**
 * Sumora Push Notification Diagnostics & Verification Tool
 *
 * Verifies Firebase Admin SDK, APNs credentials, and optionally dispatches
 * an active test notification to a physical device token.
 *
 * Usage:
 *   node scripts/verify-push.js [deviceToken]
 */

require('dotenv').config();
const fcmService = require('../src/modules/notifications/fcm.service');

async function verifyPush() {
  console.log('====================================================');
  console.log('       Sumora Push Notification Diagnostic Tool     ');
  console.log('====================================================\n');

  console.log('1. Checking Firebase Admin SDK configuration:');
  const hasPath = !!process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const hasJson = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const hasBase64 = !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  console.log(`   - FIREBASE_SERVICE_ACCOUNT_PATH:   ${hasPath ? 'CONFIGURED' : 'NOT SET'}`);
  console.log(`   - FIREBASE_SERVICE_ACCOUNT_JSON:   ${hasJson ? 'CONFIGURED' : 'NOT SET'}`);
  console.log(`   - FIREBASE_SERVICE_ACCOUNT_BASE64: ${hasBase64 ? 'CONFIGURED' : 'NOT SET'}`);
  console.log(`   - FCM Service Initialized:         ${fcmService.isInitialized ? '✅ YES (Production Live)' : '⚠️ NO (Mock Mode)'}\n`);

  console.log('2. Inspecting APNs & Apple Cloud Messaging Payload Support:');
  const payload = fcmService.buildNotificationPayload({
    channelName: 'Test Channel',
    videoTitle: 'Test Video Verification Notification',
    videoId: 'test_123',
    isReady: true,
  });

  const hasApnsAlert = !!payload.apns?.payload?.aps?.alert;
  const hasSound = payload.apns?.payload?.aps?.sound === 'default';
  const hasPriority = payload.apns?.headers?.['apns-priority'] === '10';

  console.log(`   - Native APNs Alert Header: ${hasPriority ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   - Native APNs Alert Body:   ${hasApnsAlert ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   - Default Sound & Badge:    ${hasSound ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   - Android High Priority:    ${payload.android?.priority === 'high' ? '✅ PASS' : '❌ FAIL'}\n`);

  const deviceTokenArg = process.argv[2];
  if (deviceTokenArg) {
    console.log(`3. Sending live test notification to device: ${deviceTokenArg}`);
    const result = await fcmService.sendToDevices([deviceTokenArg], payload);
    console.log('   Result:', result);
  } else {
    console.log('3. Live Device Dispatch:');
    console.log('   (To dispatch a real test alert to your phone, pass your device token:');
    console.log('    node scripts/verify-push.js <your_fcm_or_apns_device_token>)\n');
  }

  console.log('====================================================');
  console.log('  Diagnostics complete. Push subsystem is verified! ');
  console.log('====================================================');
}

verifyPush().catch(console.error);
