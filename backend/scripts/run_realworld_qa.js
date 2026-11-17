const fs = require('fs');
const path = require('path');
const assert = require('assert');
const prisma = require('../src/config/db');
const summarizationService = require('../src/modules/ai/summarization.service');
const { validateStructuredSummary } = require('../src/modules/ai/summarization.validator');
const aiService = require('../src/modules/ai/ai.service');
const GeminiProvider = require('../src/modules/ai/providers/gemini.provider');

// Set active provider to Gemini with gemini-3.1-flash-lite default
const geminiProvider = new GeminiProvider(undefined, 'gemini-3.1-flash-lite');
aiService.registerProvider(geminiProvider);
aiService.setActiveProvider('gemini');

// --- Test Datasets with Authentic Ground-Truth Content ---

// 1. Short Video (~10-12 mins): "Next-Gen AI Chips & The Memory Wall" (Computer Architecture)
const shortVideo = {
  videoId: 'qa_short_10m',
  title: 'Breaking the Memory Wall: How HBM3e & Optical Interconnects Power Next-Gen AI',
  channelName: 'Semiconductor Deep Dive',
  duration: '11:45',
  videoUrl: 'https://youtube.com/watch?v=qa_short_10m',
  segments: [
    { start: 0, duration: 25, text: 'Welcome back. Today we are addressing the single biggest bottleneck in modern AI accelerators: the memory wall.' },
    { start: 25, duration: 35, text: 'While compute throughput from companies like Nvidia and AMD has scaled dramatically with Hopper and Blackwell architectures, memory bandwidth has lagged behind.' },
    { start: 60, duration: 40, text: 'In 2024, training a frontier model requires petabytes of weights distributed across clusters. The processor spends up to 60 percent of its cycles idling, waiting for data from DRAM.' },
    { start: 100, duration: 45, text: 'This phenomenon, first coined by Wulf and McKee back in 1995, is what we call the Memory Wall. Compute capacity grows at roughly 3.1x every two years, but memory bandwidth only grows at 1.4x.' },
    { start: 145, duration: 50, text: 'To solve this, memory manufacturers like SK Hynix, Micron, and Samsung developed High Bandwidth Memory, specifically HBM3e and the upcoming HBM4.' },
    { start: 195, duration: 45, text: 'HBM stacks DRAM dies vertically using Through-Silicon Vias or TSVs, placed on a silicon interposer right next to the GPU logic die. This provides over 8 Terabytes per second of bandwidth.' },
    { start: 240, duration: 50, text: 'However, HBM is extraordinarily expensive. Packaging yields at TSMC using CoWoS, or Chip-on-Wafer-on-Substrate, remain the primary bottleneck limiting global AI server delivery.' },
    { start: 290, duration: 50, text: 'Let us look at a real-world example: Nvidia B200 accelerator. It features 192 gigabytes of HBM3e across two reticle-sized compute dies, delivering 8 Terabytes per second.' },
    { start: 340, duration: 45, text: 'Critics and competitor Cerebras claim that wafer-scale engines are the only true solution, arguing that off-chip memory access is fundamentally broken.' },
    { start: 385, duration: 55, text: 'Furthermore, Ayar Labs and Celestial AI are pioneering optical interconnects and co-packaged optics or CPO. Replacing copper traces with photons cuts transmission energy by 80 percent.' },
    { start: 440, duration: 50, text: 'Our opinion is that copper will remain dominant inside the server rack through 2026, but optical interconnects will become mandatory for cluster-level scale-out by 2027.' },
    { start: 490, duration: 55, text: 'Dr. Lisa Su from AMD noted in a recent keynote: Memory is no longer just a peripheral component; memory is the computer.' },
    { start: 545, duration: 60, text: 'In summary, overcoming the memory wall is the defining engineering challenge of this decade. Advances in TSV stacking, HBM4 16-high stacks, and silicon photonics will determine who leads the AI race.' },
    { start: 605, duration: 60, text: 'Key questions remain: Will TSMC maintain packaging hegemony, and can optical interconnects achieve enterprise manufacturing reliability before copper hits the thermal wall?' }
  ]
};

// 2. Medium Video (~28 mins, ~5,000 words): "The Global Energy Grid Crisis of AI Datacenters"
// Generates authentic simulated transcript with chronological progression across 4 sections
function generateMediumVideo() {
  const segments = [];
  let t = 0;
  const sections = [
    { title: 'The Explosive Power Demands of AI Clusters', duration: 420, topic: 'datacenter electricity draw, gigawatt facilities, and grid constraints in Virginia and Dublin' },
    { title: 'Nuclear Renaissance & Small Modular Reactors', duration: 420, topic: 'Microsoft restarting Three Mile Island, Amazon and Google investing in Kairos Power and SMR technology' },
    { title: 'Transmission Bottlenecks & Regulatory Permitting', duration: 420, topic: 'FERC regulations, interconnect queue backlogs spanning 5 to 7 years, transformer shortages' },
    { title: 'Future Scenarios & Geopolitical Relocation', duration: 420, topic: 'datacenter migration to Nordic countries, geothermal in Iceland, and geopolitical energy vulnerabilities' },
  ];

  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const sec = sections[sIdx];
    const wordsPerSec = 1300; // ~5,200 words total across 4 sections
    for (let i = 0; i < 30; i++) {
      const start = t;
      const dur = sec.duration / 30;
      t += dur;
      segments.push({
        start: Math.round(start),
        duration: Math.round(dur),
        text: `Segment ${sIdx + 1}.${i + 1} on ${sec.title}: Discussing ${sec.topic}. Analysis reveals critical data points: 1 gigawatt datacenter requires equivalent power of 750,000 homes. PJM Interconnection grid queue exceeds 200 gigawatts. Jensen Huang and Sam Altman argue that compute will be constrained by electrons, not silicon. The speaker claims that US utilities are ill-prepared, alleging regulatory capture by incumbent energy monopolies. Experts dispute whether nuclear SMRs will deploy commercially before 2030.`
      });
    }
  }

  return {
    videoId: 'qa_medium_30m',
    title: 'The AI Energy Crisis: How Gigawatt Datacenters Are Pushing Power Grids to the Brink',
    channelName: 'Global Tech & Energy Review',
    duration: '28:00',
    videoUrl: 'https://youtube.com/watch?v=qa_medium_30m',
    segments,
  };
}

// 3. Long Video (~60 mins, ~11,000 words): "Comprehensive AI Safety, Alignment, and Model Governance Symposium"
function generateLongVideo() {
  const segments = [];
  let t = 0;
  const sections = [
    { title: 'Opening Remarks & State of Frontier Models', duration: 600, topic: 'frontier capability scaling, emergence of reasoning models, test-time compute' },
    { title: 'Mechanistic Interpretability & Representation Engineering', duration: 600, topic: 'Anthropic Golden Gate Claude feature steering, dictionary learning, SAE sparse autoencoders' },
    { title: 'Reinforcement Learning from Human & AI Feedback (RLHF/RLAIF)', duration: 600, topic: 'reward hacking, sycophancy, scalable oversight, debate protocol' },
    { title: 'Biological & Cyber Threat Risk Models', duration: 600, topic: 'CBRN threat evaluations, automated vulnerability discovery, red-teaming methodologies' },
    { title: 'International Treaties & Legislative Mandates', duration: 600, topic: 'EU AI Act compliance, White House Executive Order, UK AI Safety Institute evals' },
    { title: 'Closing Panel: The Horizon of Autonomous Agents', duration: 600, topic: 'economic impact, recursive self-improvement, alignment verification benchmarks' },
  ];

  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const sec = sections[sIdx];
    for (let i = 0; i < 35; i++) {
      const start = t;
      const dur = sec.duration / 35;
      t += dur;
      segments.push({
        start: Math.round(start),
        duration: Math.round(dur),
        text: `Symposium Session ${sIdx + 1} (${sec.title}): In-depth evaluation regarding ${sec.topic}. Key participants include Dario Amodei, Demis Hassabis, and Professor Stuart Russell. Verified benchmark shows 94 percent accuracy on reasoning benchmarks with test-time compute. The panel alleges that frontier labs rush deployments ahead of safety red-teaming. The consensus bottom line is that empirical mechanistic interpretability must precede the deployment of autonomous recursive agents.`
      });
    }
  }

  return {
    videoId: 'qa_long_60m',
    title: 'Frontier AI Safety & Alignment Symposium: Architecture, Risks, and Governance',
    channelName: 'Center for AI Governance',
    duration: '60:00',
    videoUrl: 'https://youtube.com/watch?v=qa_long_60m',
    segments,
  };
}

async function runQA() {
  console.log('================================================================');
  console.log('🚀 SUMORA ENGINE REAL-WORLD QUALITY ASSURANCE TEST SUITE');
  console.log('================================================================\n');

  const testResults = [];

  // Upsert test Video row to satisfy foreign key constraints
  async function ensureVideoExists(v) {
    try {
      await prisma.video.upsert({
        where: { videoId: v.videoId },
        create: {
          videoId: v.videoId,
          channelId: 'channel_' + v.videoId,
          title: v.title,
          videoUrl: v.videoUrl,
          publishedAt: new Date(),
          summaryStatus: 'pending',
          transcriptStatus: 'completed',
        },
        update: {
          title: v.title,
          videoUrl: v.videoUrl,
        },
      });
    } catch (_) {}
  }

  // -------------------------------------------------------------
  // Test 1: Short Video (~10-12 minutes)
  // -------------------------------------------------------------
  console.log('--- TEST 1: Short Video (11:45) - Single Pass Grounding ---');
  await ensureVideoExists(shortVideo);
  const shortTranscript = {
    videoId: shortVideo.videoId,
    language: 'en',
    source: 'authorized_provider',
    segments: shortVideo.segments,
    fullText: shortVideo.segments.map(s => s.text).join(' '),
    status: 'completed',
  };

  const t1Start = Date.now();
  let shortSummary;
  try {
    shortSummary = await summarizationService.generateSummary({
      videoId: shortVideo.videoId,
      title: shortVideo.title,
      channelName: shortVideo.channelName,
      videoUrl: shortVideo.videoUrl,
      normalizedTranscript: shortTranscript,
    });
    console.log(`✅ Short Video Distilled Successfully in ${Date.now() - t1Start}ms`);
  } catch (err) {
    console.error('❌ Short Video Failed:', err.message);
    throw err;
  }

  // Validate Short Video Requirements
  assert.ok(shortSummary.videoOverview, 'Section 1: videoOverview must exist');
  assert.ok(shortSummary.backgroundAndContext, 'Section 2: backgroundAndContext must exist');
  assert.ok(shortSummary.keyTakeaways?.length >= 3, 'Section 3: keyTakeaways must have >=3 items');
  assert.ok(shortSummary.actualEventsAndClaims?.establishedFacts?.length > 0, 'Section 4: establishedFacts must exist');
  assert.ok(shortSummary.pronunciationGuide?.length > 0, 'Section 5: pronunciationGuide must identify technical terms');
  assert.ok(shortSummary.detailedBreakdown?.length > 0, 'Section 6: detailedBreakdown must have chronological entries');
  assert.ok(shortSummary.peopleAndOrganizations?.length > 0, 'Section 7: peopleAndOrganizations must exist');
  assert.ok(shortSummary.importantStatements?.length > 0, 'Section 8: importantStatements must exist');
  assert.ok(shortSummary.examplesAndConnections?.length > 0, 'Section 9: examplesAndConnections must exist');
  assert.ok(shortSummary.finalConclusion?.bottomLine, 'Section 10: finalConclusion bottomLine must exist');
  assert.ok(shortSummary.importantTimestamps?.length > 0, 'Section 11: importantTimestamps must exist');

  testResults.push({
    name: 'Short Video (11:45)',
    videoId: shortVideo.videoId,
    wordCount: shortTranscript.fullText.split(/\s+/).length,
    inputTokens: shortSummary.inputTokens,
    outputTokens: shortSummary.outputTokens,
    processingCost: shortSummary.processingCost,
    durationMs: shortSummary.processingDurationMs,
    breakdownCount: shortSummary.detailedBreakdown.length,
    timestampsCount: shortSummary.importantTimestamps.length,
    pronunciationsCount: shortSummary.pronunciationGuide.length,
  });

  // -------------------------------------------------------------
  // Test 2: Medium Video (~28-30 minutes, Map-Reduce Chunks)
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Medium Video (28:00) - Multi-Chunk Map-Reduce ---');
  const mediumVideo = generateMediumVideo();
  await ensureVideoExists(mediumVideo);
  const mediumTranscript = {
    videoId: mediumVideo.videoId,
    language: 'en',
    source: 'authorized_provider',
    segments: mediumVideo.segments,
    fullText: mediumVideo.segments.map(s => s.text).join(' '),
    status: 'completed',
  };

  const t2Start = Date.now();
  let mediumSummary;
  try {
    mediumSummary = await summarizationService.generateSummary({
      videoId: mediumVideo.videoId,
      title: mediumVideo.title,
      channelName: mediumVideo.channelName,
      videoUrl: mediumVideo.videoUrl,
      normalizedTranscript: mediumTranscript,
    });
    console.log(`✅ Medium Video Distilled Successfully in ${Date.now() - t2Start}ms`);
  } catch (err) {
    console.error('❌ Medium Video Failed:', err.message);
    throw err;
  }

  // Validate Context Preservation Across Chunks
  assert.ok(mediumSummary.detailedBreakdown.length >= 2, 'Medium video must produce multiple detailed breakdown sections');
  assert.ok(mediumSummary.actualEventsAndClaims.establishedFacts.length > 0, 'Must preserve established facts from across chunks');
  assert.ok(mediumSummary.finalConclusion.bottomLine, 'Must synthesize master bottom line from chunks');

  testResults.push({
    name: 'Medium Video (28:00)',
    videoId: mediumVideo.videoId,
    wordCount: mediumTranscript.fullText.split(/\s+/).length,
    inputTokens: mediumSummary.inputTokens,
    outputTokens: mediumSummary.outputTokens,
    processingCost: mediumSummary.processingCost,
    durationMs: mediumSummary.processingDurationMs,
    breakdownCount: mediumSummary.detailedBreakdown.length,
    timestampsCount: mediumSummary.importantTimestamps.length,
    pronunciationsCount: mediumSummary.pronunciationGuide.length,
  });

  // -------------------------------------------------------------
  // Test 3: Long Video (~60 minutes, 6 Chunks)
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Long Video (60:00) - Extensive Map-Reduce ---');
  const longVideo = generateLongVideo();
  await ensureVideoExists(longVideo);
  const longTranscript = {
    videoId: longVideo.videoId,
    language: 'en',
    source: 'authorized_provider',
    segments: longVideo.segments,
    fullText: longVideo.segments.map(s => s.text).join(' '),
    status: 'completed',
  };

  const t3Start = Date.now();
  let longSummary;
  try {
    longSummary = await summarizationService.generateSummary({
      videoId: longVideo.videoId,
      title: longVideo.title,
      channelName: longVideo.channelName,
      videoUrl: longVideo.videoUrl,
      normalizedTranscript: longTranscript,
    });
    console.log(`✅ Long Video Distilled Successfully in ${Date.now() - t3Start}ms`);
  } catch (err) {
    console.error('❌ Long Video Failed:', err.message);
    throw err;
  }

  assert.ok(longSummary.detailedBreakdown.length >= 3, 'Long video must preserve all chronological phases');
  assert.ok(longSummary.keyTakeaways.length >= 5, 'Long video must yield at least 5 key takeaways');

  testResults.push({
    name: 'Long Video (60:00)',
    videoId: longVideo.videoId,
    wordCount: longTranscript.fullText.split(/\s+/).length,
    inputTokens: longSummary.inputTokens,
    outputTokens: longSummary.outputTokens,
    processingCost: longSummary.processingCost,
    durationMs: longSummary.processingDurationMs,
    breakdownCount: longSummary.detailedBreakdown.length,
    timestampsCount: longSummary.importantTimestamps.length,
    pronunciationsCount: longSummary.pronunciationGuide.length,
  });

  // -------------------------------------------------------------
  // Test 4: Anti-Hallucination & Incomplete Transcript Rejection
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Anti-Hallucination & Incomplete Transcript Rejection ---');
  let rejectedUnavailable = false;
  try {
    await summarizationService.generateSummary({
      videoId: 'failing_vid',
      title: 'Should Fail',
      normalizedTranscript: { status: 'unavailable', fullText: '' },
    });
  } catch (e) {
    rejectedUnavailable = true;
    console.log('✅ Correctly rejected uncompleted transcript:', e.message);
  }
  assert.strictEqual(rejectedUnavailable, true);

  // Write full summary samples to output file for manual inspection
  const reportPath = path.join(__dirname, '../tests/qa_test_report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        testDate: new Date().toISOString(),
        metrics: testResults,
        samples: {
          shortVideo: shortSummary,
          mediumVideo: mediumSummary,
          longVideo: longSummary,
        },
      },
      null,
      2
    )
  );
  console.log(`\n📄 Detailed QA Report saved to ${reportPath}`);

  console.log('\n================================================================');
  console.log('📊 REAL-WORLD QUALITY ASSURANCE SUMMARY RESULTS');
  console.log('================================================================');
  console.table(testResults);
}

runQA().catch((e) => {
  console.error('\n❌ QA Test Suite Failed:', e);
  process.exit(1);
});
