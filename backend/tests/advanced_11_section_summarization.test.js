const assert = require('assert');
const { validateStructuredSummary } = require('../src/modules/ai/summarization.validator');
const summarizationService = require('../src/modules/ai/summarization.service');
const MockAIProvider = require('../src/modules/ai/providers/mock.provider');

async function runAdvancedSummarizationTests() {
  console.log('🧪 Starting Advanced 11-Section AI Summarization Tests...\n');

  // Test 1: Full 11-section validation
  console.log('Test 1: Validate complete 11-section schema adhering to approved requirements');
  const sample11SectionOutput = {
    overview: 'Nvidia co-founder Jensen Huang stepped down following an alleged extramarital scandal and national security scrutiny.',
    keyPoints: [
      'Jensen Huang announced his exit from Nvidia after 33 years as CEO.',
      'Scandal involves businesswoman Alice Huang and scrutinized links to Huawei.',
      'Trump administration counterintelligence probed potential restricted AI chip leaks to China.',
    ],
    importantConcepts: [
      {
        concept: 'Export-Control Red Flags',
        explanation: 'US regulatory scrutiny over whether advanced AI GPUs were diverted to blacklisted entities.',
      },
    ],
    detailedSummary: 'Full detailed chronological breakdown of the events.',
    conclusion: 'The video concludes that while personal misconduct triggered the resignation, national security probes dominate the story.',
    topicsCovered: ['Nvidia', 'Jensen Huang', 'Huawei', 'DeepSeek', 'US Chip Bans'],
    originalVideoUrl: 'https://www.youtube.com/watch?v=fLdsWgQSqXw',

    // Advanced 11 sections
    videoOverview: {
      title: "Jensen Huang's Exit: Honeytrap Scandal or Tech Treason?",
      channel: 'The Deshbhakt',
      duration: '18:42',
      mainSubject: 'Resignation of Nvidia CEO amidst espionage and export control probes',
      mainPurpose: 'Investigative tech geopolitical analysis',
      whatViewerLearns: 'Detailed breakdown of the timeline, key figures, national security implications, and facts vs allegations.',
    },
    backgroundAndContext: {
      whyDiscussed: 'Abrupt resignation of tech icon Jensen Huang after 33 years at Nvidia.',
      precedingEvents: 'US tightened AI chip bans on China; reports surfaced of an extramarital affair with Alice Huang.',
      keyEntities: ['Nvidia', 'Huawei', 'US Department of Commerce', 'Trump Administration'],
      historicalOrTechnicalContext: 'Nvidia holds >80% of the world AI chip supply. Alice Huang had investment ties to Chinese datacenter clusters.',
      whyItMatters: 'Decides the technological balance of power in the US-China AI rivalry.',
    },
    detailedBreakdown: [
      {
        timestampRange: '00:00 - 03:15',
        topic: 'The Exit Announcement & Stock Market Shock',
        explanation: 'Jensen Huang stepped down after reports surfaced of internal company misconduct and board confrontation.',
        developments: 'Nvidia board met in emergency session; market cap dropped $200B intraday.',
        keyFigures: ['Jensen Huang', 'Nvidia Board'],
        evidenceOrNumbers: '$200B market wipeout, 33-year tenure ending.',
        significance: 'First CEO change since Nvidia founding in 1993.',
      },
      {
        timestampRange: '03:16 - 08:30',
        topic: 'The Alice Huang Connection & Huawei Links',
        explanation: 'Investigating businesswoman Alice Huang and counterintelligence scrutiny over her corporate ties in Shenzhen.',
        developments: 'Congressional committees opened inquiries into whether Blackwell chips were illicitly exported.',
        keyFigures: ['Alice Huang', 'Huawei leadership'],
        evidenceOrNumbers: 'Customs manifests and shell companies identified.',
        significance: 'Elevates a personal affair into a potential national security breach.',
      },
    ],
    actualEventsAndClaims: {
      establishedFacts: [
        'Jensen Huang officially resigned as Nvidia CEO.',
        'US export restrictions legally prohibit selling advanced Blackwell chips to China.',
      ],
      speakerClaims: [
        'The speaker asserts that the timing coincides with sudden breakthroughs by Chinese AI firms.',
      ],
      allegationsAndAccusations: [
        'Allegations that Alice Huang acted as an intelligence asset to obtain restricted AI architecture.',
      ],
      opinionsAndInterpretations: [
        'The creator believes US semiconductor dominance faces its most severe vulnerability in decades.',
      ],
      unverifiedOrDisputed: [
        'Whether Jensen Huang had personal knowledge of any illegal hardware rerouting remains unverified.',
      ],
    },
    peopleAndOrganizations: [
      {
        name: 'Jensen Huang',
        role: 'Co-founder & Former CEO of Nvidia',
        context: 'Subject of resignation and executive ethics inquiry',
        connection: 'Central figure whose tenure ended amidst controversy',
      },
      {
        name: 'Alice Huang',
        role: 'Chinese businesswoman & datacenter investor',
        context: 'Alleged extramarital partner scrutinized for Huawei ties',
        connection: 'Source of national security counterintelligence inquiry',
      },
    ],
    pronunciationGuide: [
      {
        term: 'Jensen Huang',
        readablePhonetic: 'JEN-sən HWANG',
        ipa: '/ˈdʒɛnsən hwɑːŋ/',
        meaning: 'Co-founder and longtime leader of Nvidia',
        contextInVideo: 'Former CEO whose resignation triggered the discussion',
      },
      {
        term: 'Honeytrap',
        readablePhonetic: 'HUN-ee-trap',
        ipa: '/ˈhʌniˌtræp/',
        meaning: 'A covert espionage operation using romantic or sexual attraction to extract intelligence',
        contextInVideo: 'The allegation examined regarding Alice Huang and tech leaks',
      },
    ],
    importantStatements: [
      {
        statement: 'This is no longer a corporate HR matter; it is now an international trade and security crisis.',
        isDirectQuote: false,
        context: 'When transitioning from the personal scandal to congressional probes',
        significance: 'Defines the scope of the video',
      },
    ],
    examplesAndConnections: [
      {
        example: 'DeepSeek AI Model release',
        explanation: 'Low-cost Chinese AI model that challenged American AI cost assumptions',
        purpose: 'Used by the speaker to illustrate why hardware access is fiercely contested',
      },
    ],
    finalConclusion: {
      bottomLine: 'The resignation marks a seismic shift for Nvidia, but the true fallout depends on federal findings regarding chip diversion.',
      supportingArguments: [
        'Personal misconduct alone would not trigger White House counterintelligence briefings.',
        'US chip export enforcement will tighten significantly regardless of trial outcomes.',
      ],
      unansweredQuestions: 'Did any classified Blackwell GPU designs reach overseas data centers before the resignation?',
    },
    keyTakeaways: [
      'Jensen Huang stepped down after 33 years heading Nvidia.',
      'Personal scandal escalated into a federal counterintelligence inquiry.',
      'Scrutiny centers on Alice Huang and potential Huawei supply chain connections.',
      'Facts remain distinct from unverified espionage allegations.',
      'Global semiconductor markets and US-China AI race face major regulatory realignment.',
    ],
    importantTimestamps: [
      { timestamp: '00:00', label: 'Breaking Exit Announcement', seconds: 0 },
      { timestamp: '03:16', label: 'The Alice Huang Huawei Links', seconds: 196 },
      { timestamp: '12:45', label: 'Trump Administration Countermeasures', seconds: 765 },
      { timestamp: '17:10', label: 'Final Verdict & Summary', seconds: 1030 },
    ],
  };

  const validated = validateStructuredSummary(sample11SectionOutput);
  assert.strictEqual(validated.videoOverview.channel, 'The Deshbhakt');
  assert.strictEqual(validated.detailedBreakdown.length, 2);
  assert.strictEqual(validated.actualEventsAndClaims.establishedFacts.length, 2);
  assert.strictEqual(validated.actualEventsAndClaims.allegationsAndAccusations.length, 1);
  assert.strictEqual(validated.pronunciationGuide.length, 2);
  assert.strictEqual(validated.pronunciationGuide[0].readablePhonetic, 'JEN-sən HWANG');
  assert.strictEqual(validated.importantTimestamps.length, 4);
  console.log('  ✅ 11-section schema validated with complete epistemic & pronunciation structure.\n');

  // Test 2: Backward compatibility with legacy schema inputs
  console.log('Test 2: Verify backward compatibility with legacy 7-part input');
  const legacyInput = {
    overview: 'A standard overview of a technology lecture.',
    keyPoints: ['Point A', 'Point B', 'Point C'],
    importantConcepts: [{ concept: 'Neural Networks', explanation: 'Deep learning layers' }],
    detailedSummary: 'A paragraph detailing the summary of the video.',
    conclusion: 'Technology will advance steadily.',
    topicsCovered: ['AI', 'Tech'],
    originalVideoUrl: 'https://youtube.com/watch?v=123',
  };
  const validatedLegacy = validateStructuredSummary(legacyInput);
  assert.strictEqual(validatedLegacy.overview, legacyInput.overview);
  assert.deepStrictEqual(validatedLegacy.detailedBreakdown, []);
  assert.deepStrictEqual(validatedLegacy.pronunciationGuide, []);
  console.log('  ✅ Legacy inputs validate seamlessly without breaking.\n');

  // Test 3: Anti-hallucination rule enforcement
  console.log('Test 3: Anti-hallucination guard rejects metadata-only summarization');
  let rejected = false;
  try {
    await summarizationService.generateSummaryFromMetadata({ videoId: 'fake123' });
  } catch (err) {
    rejected = true;
    assert(err.message.includes('prohibited'));
  }
  assert.strictEqual(rejected, true, 'Metadata-only generation must throw an error');
  console.log('  ✅ Zero-hallucination policy strictly halts metadata-only summaries.\n');

  console.log('🎉 All Advanced 11-Section Summarization Tests Passed Successfully!');
}

runAdvancedSummarizationTests().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
