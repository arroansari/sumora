const assert = require('assert');
const {
  cleanSegmentText,
  decodeHtmlEntities,
  normalizeTranscript,
} = require('../src/modules/transcripts/transcript.processor');
const { validateNormalizedTranscript } = require('../src/modules/transcripts/transcript.validator');
const transcriptFactory = require('../src/modules/transcripts/transcript.factory');
const YouTubeCaptionsProvider = require('../src/modules/transcripts/providers/youtube-captions.provider');
const UserProvidedTranscriptProvider = require('../src/modules/transcripts/providers/user-provided-transcript.provider');
const { BaseTranscriptProvider, TranscriptUnavailableError } = require('../src/modules/transcripts/transcript.provider');

async function runTests() {
  console.log('🧪 Starting Phase 3 Transcript Retrieval Engine Tests...\n');

  // Test 1: HTML Entity Decoding & Caption Artifact Cleaning
  console.log('Test 1: Caption Cleaner & HTML Entity Decoding');
  const dirtyCaption = '  [Music] Welcome &amp; hello! &#39;It&#39;s great&#39; &quot;to build apps&quot; &lt;here&gt; [Applause] ♪  ';
  const cleaned = cleanSegmentText(dirtyCaption);
  assert.strictEqual(
    cleaned,
    "Welcome & hello! 'It's great' \"to build apps\" <here>",
    'Should remove [Music], [Applause], ♪ and unescape entities'
  );
  console.log('  ✅ Cleaned caption text correctly.');

  // Test 2: Transcript Normalizer
  console.log('\nTest 2: Transcript Normalization to Unified Format');
  const rawSegments = [
    { start: '0.000', duration: '3.450', text: 'Welcome to this tutorial on Sumora.' },
    { start: 3.45, duration: 4.12, text: ' [Music] ' }, // Should be skipped as empty
    { start: '7.570', duration: '5.200', text: 'We will explore decoupled transcript architectures.' },
  ];

  const normalized = normalizeTranscript({
    videoId: 'test_video_123',
    language: 'en',
    source: 'youtube_captions',
    rawSegments,
  });

  assert.strictEqual(normalized.videoId, 'test_video_123');
  assert.strictEqual(normalized.language, 'en');
  assert.strictEqual(normalized.source, 'youtube_captions');
  assert.strictEqual(normalized.status, 'completed');
  assert.strictEqual(normalized.segments.length, 2, 'Empty [Music] segment should be omitted');
  assert.strictEqual(normalized.segments[0].start, 0);
  assert.strictEqual(normalized.segments[0].duration, 3.45);
  assert.strictEqual(
    normalized.fullText,
    'Welcome to this tutorial on Sumora. We will explore decoupled transcript architectures.'
  );
  console.log('  ✅ Transcript normalization verified.');

  // Test 3: Schema Validation
  console.log('\nTest 3: Normalized Transcript Schema Validation');
  const validated = validateNormalizedTranscript(normalized);
  assert.ok(validated, 'Normalized transcript must pass Zod schema validation');

  assert.throws(
    () =>
      validateNormalizedTranscript({
        videoId: 'invalid',
        language: 'en',
        source: 'test',
        segments: [],
        fullText: 'too short',
        status: 'completed',
      }),
    /Transcript must contain at least one valid text segment/i,
    'Empty segments must fail validation'
  );
  console.log('  ✅ Strict schema validation passed.');

  // Test 4: Provider Factory Management
  console.log('\nTest 4: Provider Factory & Priority Management');
  const defaultOrder = transcriptFactory.getProvidersInPriorityOrder().map((p) => p.name);
  assert.deepStrictEqual(
    defaultOrder,
    ['youtube_captions', 'authorized_provider', 'user_provided'],
    'Factory must prioritize youtube_captions, authorized_provider, then user_provided by default'
  );

  // Test adding a custom provider
  class MockCustomProvider extends BaseTranscriptProvider {
    get name() {
      return 'custom_speech_to_text';
    }
    async canHandle() {
      return true;
    }
    async fetchTranscript() {
      return {
        language: 'en',
        segments: [{ start: 0, duration: 5, text: 'Custom provider text' }],
      };
    }
  }

  const customProvider = new MockCustomProvider();
  transcriptFactory.registerProvider(customProvider);
  assert.ok(transcriptFactory.getProvider('custom_speech_to_text'), 'Custom provider should be registered');

  // Change priority to make custom provider first
  transcriptFactory.setPriority(['custom_speech_to_text', 'youtube_captions', 'user_provided']);
  const newOrder = transcriptFactory.getProvidersInPriorityOrder().map((p) => p.name);
  assert.strictEqual(newOrder[0], 'custom_speech_to_text', 'Priority change must take effect');

  // Clean up
  transcriptFactory.unregisterProvider('custom_speech_to_text');
  transcriptFactory.setPriority(['youtube_captions', 'authorized_provider', 'user_provided']);
  console.log('  ✅ Provider registration, removal, and priority reconfiguration verified.');

  // Test 5: YouTube Captions Provider TimedText XML Parsing
  console.log('\nTest 5: YouTube TimedText XML Parser');
  const ytProvider = new YouTubeCaptionsProvider();
  const sampleTimedTextXml = `<?xml version="1.0" encoding="utf-8" ?>
<transcript>
  <text start="1.2" dur="4.1">Hello everyone and welcome back.</text>
  <text start="5.3" dur="3.8">In this video we discuss background jobs.</text>
</transcript>`;

  const ytResult = await ytProvider.fetchTranscript('test_yt_id', { mockXml: sampleTimedTextXml });
  assert.strictEqual(ytResult.segments.length, 2);
  assert.strictEqual(ytResult.segments[0].start, 1.2);
  assert.strictEqual(ytResult.segments[0].text, 'Hello everyone and welcome back.');
  console.log('  ✅ YouTube timed text parsing passed.');

  // Test 6: User Provided Provider (SRT & Plain Text)
  console.log('\nTest 6: User Provided Transcript Provider (SRT & Text)');
  const userProvider = new UserProvidedTranscriptProvider();

  // SRT parsing
  const sampleSrt = `1
00:00:01,000 --> 00:00:04,500
First subtitle line from user.

2
00:00:05,000 --> 00:00:09,000
Second subtitle line from user.`;

  const srtResult = await userProvider.fetchTranscript('test_video', { userTranscriptSrt: sampleSrt });
  assert.strictEqual(srtResult.segments.length, 2);
  assert.strictEqual(srtResult.segments[0].start, 1);
  assert.strictEqual(srtResult.segments[0].duration, 3.5);
  assert.strictEqual(srtResult.segments[0].text, 'First subtitle line from user.');

  // Plain text parsing
  const sampleText = 'Welcome to Sumora. This is a plain text transcript. It will be parsed into segments.';
  const textResult = await userProvider.fetchTranscript('test_video', { userTranscriptText: sampleText });
  assert.strictEqual(textResult.segments.length, 3);
  console.log('  ✅ User-provided SRT and plain-text fallback parsing passed.');

  console.log('\n🎉 All Phase 3 Transcript Engine Tests Passed Successfully!');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});

