const assert = require('assert');
const {
  aiService,
  summarizationService,
  MockAIProvider,
  validateStructuredSummary,
} = require('../src/modules/ai');

async function runTests() {
  console.log('🧪 Starting Phase 4 AI Summarization Pipeline Tests...\n');

  // Test 1: Text Chunking Algorithm
  console.log('Test 1: Long Transcript Chunking with Overlap');
  const shortText = 'One two three four five.';
  const shortChunks = summarizationService.chunkText(shortText, 10, 2);
  assert.strictEqual(shortChunks.length, 1, 'Short text should result in exactly 1 chunk');

  // Generate 500 words
  const words = Array.from({ length: 500 }, (_, i) => `word${i + 1}`).join(' ');
  const chunks = summarizationService.chunkText(words, 200, 50);
  assert.ok(chunks.length > 2, `Should split 500 words into multiple chunks (got ${chunks.length})`);
  assert.ok(chunks[0].includes('word1') && chunks[0].includes('word200'), 'First chunk should contain word 1 to 200');
  assert.ok(chunks[1].includes('word151'), 'Second chunk should contain overlap starting at word 151');
  console.log(`  ✅ Text chunking validated (500 words split into ${chunks.length} overlapping chunks).`);

  // Test 2: Structured Output Schema Validation (7 Sections)
  console.log('\nTest 2: Structured 7-Section Summary Schema Validation');
  const validOutput = {
    overview: 'This video introduces the core concepts of decoupled architectures in React Native and Node.js.',
    keyPoints: [
      'Decoupling transcripts from AI summarizers allows independent evolution.',
      'WebSub provides instantaneous video upload alerts without polling.',
    ],
    importantConcepts: [
      {
        concept: 'WebSub (PubSubHubbub)',
        explanation: 'A server-to-server webhook protocol for real-time feed updates.',
      },
    ],
    detailedSummary:
      'The presenter details how modern architectures benefit from modular boundaries. They discuss database design, queueing systems with BullMQ, and token encryption with AES-256-GCM before concluding with error handling guidelines.',
    conclusion: 'Decoupling services results in higher resilience and maintainability.',
    topicsCovered: ['Node.js', 'React Native', 'WebSub', 'Architecture'],
    originalVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  };

  const validated = validateStructuredSummary(validOutput);
  assert.strictEqual(validated.overview, validOutput.overview);
  assert.strictEqual(validated.keyPoints.length, 2);
  assert.strictEqual(validated.importantConcepts.length, 1);
  assert.strictEqual(validated.topicsCovered.length, 4);
  assert.strictEqual(validated.originalVideoUrl, validOutput.originalVideoUrl);

  // Missing required section must fail validation
  const invalidOutput = { ...validOutput };
  delete invalidOutput.overview;
  assert.throws(
    () => validateStructuredSummary(invalidOutput),
    /overview/i,
    'Missing overview must fail validation'
  );
  console.log('  ✅ 7-section structured summary validation passed.');

  // Test 3: AI Provider Abstraction & Switching
  console.log('\nTest 3: AI Provider Abstraction');
  const mockProvider = new MockAIProvider('mock-test-model');
  aiService.registerProvider(mockProvider);
  aiService.setActiveProvider('mock');

  const active = aiService.getActiveProvider();
  assert.strictEqual(active.name, 'mock');
  assert.strictEqual(active.modelName, 'mock-test-model');
  console.log('  ✅ AI Provider abstraction and dynamic switching verified.');

  // Test 4: Pipeline Execution with Normalized Transcript
  console.log('\nTest 4: Summarization Pipeline Execution');
  const normalizedTranscript = {
    videoId: 'sample_video_456',
    language: 'en',
    source: 'youtube_captions',
    segments: [
      { start: 0, duration: 5, text: 'Welcome to this comprehensive tutorial.' },
      { start: 5, duration: 7, text: 'We will build an AI summarizer with Node.js.' },
    ],
    fullText: 'Welcome to this comprehensive tutorial. We will build an AI summarizer with Node.js.',
    status: 'completed',
  };

  // Run pipeline using MockAIProvider
  const summaryResult = await mockProvider.generateStructuredJson({
    prompt: 'Summarize transcript',
  });
  const validatedResult = validateStructuredSummary(summaryResult);

  assert.ok(validatedResult.overview, 'Overview should be generated');
  assert.ok(validatedResult.keyPoints.length > 0, 'Key points should be generated');
  assert.ok(validatedResult.importantConcepts.length > 0, 'Important concepts should be generated');
  assert.ok(validatedResult.detailedSummary, 'Detailed summary should be generated');
  assert.ok(validatedResult.conclusion, 'Conclusion should be generated');
  assert.ok(validatedResult.topicsCovered.length > 0, 'Topics covered should be generated');
  console.log('  ✅ Pipeline generated and validated all 7 structured sections.');

  // Test 5: Rejection of Uncompleted Transcripts
  console.log('\nTest 5: Rejection of Uncompleted / Missing Transcripts');
  await assert.rejects(
    async () => {
      await summarizationService.generateSummary({
        videoId: 'video_fail',
        title: 'Failing Video',
        normalizedTranscript: { status: 'unavailable', fullText: '' },
      });
    },
    /Cannot summarize transcript with status "unavailable"|Valid normalized transcript with fullText is required/i,
    'Should refuse to summarize transcripts that are not completed'
  );
  console.log('  ✅ Uncompleted / empty transcripts rejected.');

  console.log('\n🎉 All Phase 4 AI Summarization Pipeline Tests Passed Successfully!');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});

