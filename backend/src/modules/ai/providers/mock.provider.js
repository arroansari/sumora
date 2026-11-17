const { BaseAIProvider } = require('../ai.provider');

class MockAIProvider extends BaseAIProvider {
  constructor(modelName = 'mock-llm-v1') {
    super();
    this._modelName = modelName;
  }

  get name() {
    return 'mock';
  }

  get modelName() {
    return this._modelName;
  }

  async generateStructuredJson({ prompt }) {
    // If Reddit debate prompt, return 4-part consensus format
    if (prompt.includes('Reddit') || prompt.includes('consensus') || prompt.includes('takeaways')) {
      return {
        consensus:
          'The community largely agrees on the transformative potential of this initiative while emphasizing the need for realistic execution standards.',
        takeaways: [
          'Community Consensus: Majority perspective confirms substantial long-term value and operational benefits.',
          'Top Skepticism: Key pushback centers around unverified edge cases and historical project delays.',
          'Key Facts & Impact: Discussion highlights empirical benchmarks and real-world deployment challenges.',
          'Community Verdict: Cautious optimism with ongoing demand for open benchmarks and independent verification.',
        ],
        contrarianViews: [
          'Unresolved regulatory scrutiny could stall mass adoption.',
          'High initial transition costs for legacy infrastructure.',
        ],
        fullSummary:
          'This community thread analyzed the primary developments and trade-offs. While the majority of commenters agreed on the upside, vocal dissent from experienced contributors stressed critical implementation barriers that must be resolved.',
      };
    }

    // If chunk prompt, return intermediate format
    if (prompt.includes('TRANSCRIPT SECTION:') || prompt.includes('SECTION TRANSCRIPT:')) {
      return {
        sectionIndex: 1,
        timestampRange: '00:00 - 15:00',
        topic: 'Architecture & Decoupled Services',
        detailedNotes:
          'Comprehensive examination of decoupled service boundaries, asynchronous BullMQ processing, and token encryption with AES-256-GCM. The speaker demonstrates how decoupling prevents bottlenecks and eliminates cascading failures across distributed microservices.',
        keyFigures: ['System Architect', 'Core Team'],
        claimsAndAllegations: [
          'Direct HTTP WebSub processing causes timeouts under viral spikes without queues.',
          'Grounded AI prompts prevent model hallucinations on missing data.',
        ],
        terminology: [
          {
            term: 'BullMQ',
            phonetic: 'BOOL-em-kyoo',
            meaning: 'Redis-backed message queue for robust background job execution.',
          },
        ],
        examples: ['Handling 10,000 concurrent YouTube webhook alerts without dropped events.'],
      };
    }

    // Default full summary response with all 11 sections
    return {
      overview:
        'This video provides a comprehensive exploration of building scalable applications with modular architectures, asynchronous background processing, and decoupled service layers.',
      keyPoints: [
        'Separation of concerns ensures components can scale and evolve independently.',
        'Asynchronous queue processing prevents webhook timeouts and balances server load.',
        'Normalized transcript structures allow seamless swapping of transcription engines without impacting AI summarization.',
        'Token encryption at rest safeguards OAuth credentials against database leaks.',
        'Strict epistemic classification prevents conflating opinions with verified facts.',
      ],
      importantConcepts: [
        {
          concept: 'Decoupled Service Architecture',
          explanation:
            'A design pattern where components operate independently without direct internal dependencies on other service implementations.',
        },
        {
          concept: 'Map-Reduce Summarization',
          explanation:
            'Breaking long transcripts into smaller chunks for intermediate summaries before synthesizing a unified conclusion.',
        },
      ],
      detailedSummary:
        'The speaker begins by discussing the challenges of processing high-volume social media activities. They outline the drawbacks of synchronous HTTP handling and advocate for message queue architectures like BullMQ. The talk concludes with best practices for testing, token encryption, and grounded AI prompts that avoid hallucinations.',
      conclusion:
        'By adhering to modular service patterns and asynchronous workflows, applications remain robust, resilient to provider failures, and cost-efficient.',
      topicsCovered: ['Node.js', 'React Native', 'Asynchronous Processing', 'AI Summarization', 'Architecture'],
      originalVideoUrl: 'https://www.youtube.com/watch?v=sample',

      // 11-section advanced fields
      videoOverview: {
        title: 'Building Scalable Full-Stack Systems with Grounded AI',
        channel: 'Tech Engineering Channel',
        duration: '24:10',
        mainSubject: 'Architectural patterns for asynchronous pipelines and grounded LLM summarization',
        mainPurpose: 'Technical instructional tutorial and system design review',
        whatViewerLearns:
          'How to architect resilient Node.js backends that handle high-volume streaming data, avoid timeouts using message queues, and generate grounded summaries without hallucinating facts.',
      },
      backgroundAndContext: {
        whyDiscussed: 'Developers struggle with timeouts when webhook payloads trigger expensive AI tasks.',
        precedingEvents: 'Release of high-frequency social media APIs and tighter rate limits on cloud LLMs.',
        keyEntities: ['Node.js', 'Redis', 'BullMQ', 'Google Generative AI', 'PostgreSQL'],
        historicalOrTechnicalContext:
          'Synchronous microservices fail under peak load. Decoupled worker queues distribute load smoothly over time.',
        whyItMatters: 'Ensures production stability and predictability under heavy enterprise workloads.',
      },
      detailedBreakdown: [
        {
          timestampRange: '00:00 - 08:30',
          topic: 'The Pitfalls of Synchronous Ingestion',
          explanation:
            'The presenter explains why synchronous HTTP handling of webhooks leads to catastrophic timeout cascades when external AI APIs take 10+ seconds to respond.',
          developments: 'Benchmark tests reveal a 45% failure rate under concurrent load spikes.',
          keyFigures: ['Lead Architect'],
          evidenceOrNumbers: '45% failure rate, 30-second gateway timeout thresholds.',
          significance: 'Establishes the foundational necessity of asynchronous worker queues.',
        },
        {
          timestampRange: '08:31 - 18:45',
          topic: 'Worker Queues and Resilient BullMQ Architecture',
          explanation:
            'Detailed walkthrough of configuring BullMQ with exponential backoff, dead-letter queues, and idempotency keys to prevent duplicate runs.',
          developments: 'Implemented 3-retry maximum with exponential jitter.',
          keyFigures: ['Core Team'],
          evidenceOrNumbers: 'Zero dropped jobs across 10,000 simulated webhook pushes.',
          significance: 'Provides the concrete implementation blueprint for developers.',
        },
        {
          timestampRange: '18:46 - 24:10',
          topic: 'Grounded 11-Section Distillation & Epistemic Rigor',
          explanation:
            'Demonstrates how strict epistemic classification prevents LLM hallucinations, ensuring quotes and claims are verified against authentic transcripts.',
          developments: 'Integrated schema validation via Zod with zero-hallucination policy guardrails.',
          keyFigures: ['AI Evaluation Board'],
          evidenceOrNumbers: '100% schema compliance score across validation suites.',
          significance: 'Guarantees reliable analytical output for enterprise consumers.',
        },
      ],
      actualEventsAndClaims: {
        establishedFacts: [
          'Redis-backed message queues decouple HTTP response latency from background execution.',
          'AES-256-GCM provides authenticated encryption preventing ciphertext tampering.',
        ],
        speakerClaims: [
          'Decoupled architectures reduce operational maintenance costs by up to 60%.',
        ],
        allegationsAndAccusations: [],
        opinionsAndInterpretations: [
          'The speaker predicts that serverless functions without dedicated queue backbones will become obsolete for AI pipelines.',
        ],
        unverifiedOrDisputed: [],
      },
      peopleAndOrganizations: [
        {
          name: 'Tech Engineering Team',
          role: 'Software Architecture Guild',
          context: 'Presented the production case study and benchmarks',
          connection: 'Architects of the decoupled summarization engine',
        },
      ],
      pronunciationGuide: [
        {
          term: 'BullMQ',
          readablePhonetic: 'BOOL-em-kyoo',
          ipa: '/bʊl ɛm kjuː/',
          meaning: 'A fast, robust TypeScript/Node.js job queue backed by Redis',
          contextInVideo: 'Used for asynchronous background job scheduling and task resilience',
        },
      ],
      importantStatements: [
        {
          statement: 'Never perform AI generation in the synchronous request-response cycle.',
          isDirectQuote: true,
          context: 'During the system design section at 04:15',
          significance: 'Core architectural commandment of the video',
        },
      ],
      examplesAndConnections: [
        {
          example: 'Simulated 10,000 webhook load test',
          explanation: 'Subjecting the ingestion pipeline to concurrent peak traffic',
          purpose: 'Demonstrates zero dropped requests under queue buffering',
        },
      ],
      finalConclusion: {
        bottomLine:
          'Decoupled microservice architectures and grounded AI validation are essential for reliable, high-volume production summarization.',
        supportingArguments: [
          'Asynchronous queueing eliminates webhook gateway timeouts completely.',
          'Grounded prompts and epistemic schemas eliminate hallucinations on missing transcripts.',
        ],
        unansweredQuestions:
          'How will upcoming multi-modal video APIs handle token limits for multi-hour video streams?',
      },
      keyTakeaways: [
        'Decouple webhook ingestion from expensive AI generation using Redis worker queues.',
        'Apply exponential backoff and idempotency keys to avoid duplicate executions.',
        'Use authenticated encryption (AES-256-GCM) for all platform tokens stored at rest.',
        'Enforce strict epistemic separation between facts, claims, and allegations.',
        'Reject metadata-only summarization when transcripts are unavailable to preserve zero hallucination.',
      ],
      importantTimestamps: [
        { timestamp: '00:00', label: 'Introduction & Ingestion Challenges', seconds: 0 },
        { timestamp: '08:31', label: 'BullMQ Queue Implementation', seconds: 511 },
        { timestamp: '18:46', label: 'Epistemic Grounding & Verification', seconds: 1126 },
        { timestamp: '23:15', label: 'Summary & Best Practices', seconds: 1395 },
      ],
    };
  }
}

module.exports = MockAIProvider;

