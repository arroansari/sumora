import { MockSummary, MockChannel, MockNotification } from '../types/models.types';

// Clearly denoted as mock data for design scaffolding
export const MOCK_SUMMARIES: MockSummary[] = [
  {
    id: 'sum-1',
    source: 'YouTube',
    channelName: 'Lex Fridman',
    videoTitle: 'Sam Altman: OpenAI, GPT-5, Sora and Future of AI',
    headline: 'Discussion on scaling laws, compute bottlenecks, and multi-modal alignment progress.',
    keyPoints: [
      'Compute efficiency remains the principal bottleneck for training frontier systems.',
      'Sora models are world simulators with physical physics approximations.',
      'OpenAI roadmap leans heavily on autonomous agent workflows.',
    ],
    readingTimeMinutes: 4,
    publishedAgo: '2h ago',
    category: 'Technology',
  },
  {
    id: 'sum-2',
    source: 'YouTube',
    channelName: 'Marques Brownlee',
    videoTitle: 'The Reality of Smart Glasses & AI Hardware',
    headline: 'Reviewing current wearable optics, battery density constraints, and latency factors.',
    keyPoints: [
      'Audio-first wearable AI has higher daily retention than heads-up display models.',
      'Thermal dissipation on temples limits continuous compute to under 15 minutes.',
      'Cloud offloading introduces unacceptable roundtrip delay without 5G/Wi-Fi 7.',
    ],
    readingTimeMinutes: 3,
    publishedAgo: '5h ago',
    category: 'Hardware',
  },
  {
    id: 'sum-3',
    source: 'YouTube',
    channelName: 'Fireship',
    videoTitle: '10 React & Native Features You Should Know in 2026',
    headline: 'Quick breakdown of modern compiler enhancements, native modules, and state primitives.',
    keyPoints: [
      'React Compiler automatically memoizes dependency graphs.',
      'Static Hermes engine delivers sub-5ms TTI on modern ARM platforms.',
      'Bridgeless architecture eliminates serialization overhead entirely.',
    ],
    readingTimeMinutes: 2,
    publishedAgo: '1d ago',
    category: 'Engineering',
  },
];

export const MOCK_CHANNELS: MockChannel[] = [
  {
    id: 'chan-1',
    name: 'Lex Fridman',
    subscriberCount: '4.2M subscribers',
    category: 'Interviews & Deep Tech',
    avatarUrl: '',
    connected: true,
  },
  {
    id: 'chan-2',
    name: 'Marques Brownlee',
    subscriberCount: '18.5M subscribers',
    category: 'Consumer Electronics',
    avatarUrl: '',
    connected: true,
  },
  {
    id: 'chan-3',
    name: 'Fireship',
    subscriberCount: '3.1M subscribers',
    category: 'Programming & Web',
    avatarUrl: '',
    connected: false,
  },
  {
    id: 'chan-4',
    name: 'Huberman Lab',
    subscriberCount: '5.8M subscribers',
    category: 'Health & Neuroscience',
    avatarUrl: '',
    connected: true,
  },
];

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: 'notif-1',
    title: 'New Summary Ready',
    body: 'Lex Fridman dropped a new 3-hour episode. 4 min read available.',
    timestamp: '2 hours ago',
    isRead: false,
    type: 'summary',
  },
  {
    id: 'notif-2',
    title: 'Channel Ingest Complete',
    body: 'Successfully synced 12 subscriptions from your connected YouTube account.',
    timestamp: 'Yesterday',
    isRead: true,
    type: 'integration',
  },
];

