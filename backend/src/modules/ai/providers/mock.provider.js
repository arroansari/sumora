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
    if (prompt.includes('SECTION TRANSCRIPT:')) {
      return {
        sectionIndex: 1,
        sectionSummary: 'Detailed overview of section concepts and discussions extracted from transcript.',
        sectionKeyPoints: [
          'Key point covering architecture decisions discussed in section.',
          'Key point covering performance and caching implementation.',
        ],
        sectionConcepts: ['Decoupled Architecture', 'BullMQ Queueing'],
      };
    }

    // Default full summary response
    return {
      overview:
        'This video provides a comprehensive exploration of building scalable applications with modular architectures, asynchronous background processing, and decoupled service layers.',
      keyPoints: [
        'Separation of concerns ensures components can scale and evolve independently.',
        'Asynchronous queue processing prevents webhook timeouts and balances server load.',
        'Normalized transcript structures allow seamless swapping of transcription engines without impacting AI summarization.',
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
    };
  }
}

module.exports = MockAIProvider;

