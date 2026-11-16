import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '../src/context/ThemeContext';
import { AuthProvider } from '../src/context/AuthContext';
import { PlatformProvider } from '../src/context/PlatformContext';
import { LoginScreen } from '../src/screens/auth/LoginScreen';
import { RegisterScreen } from '../src/screens/auth/RegisterScreen';
import { HomeScreen } from '../src/screens/home/HomeScreen';
import { SummaryDetailScreen } from '../src/screens/summaries/SummaryDetailScreen';

// Mock API service to prevent unresolved async network calls in tests
jest.mock('../src/services/api', () => {
  const actual = jest.requireActual('../src/services/api');
  return {
    ...actual,
    videosApi: {
      getFeed: jest.fn(() => Promise.resolve({ videos: [], pagination: { totalPages: 1 } })),
      getVideo: jest.fn((id) =>
        Promise.resolve({
          id,
          videoId: id,
          title: 'Mock Video',
          channelName: 'Mock Channel',
          summaryStatus: 'completed',
          summary: {
            overview: 'Mock Overview',
            keyPoints: ['Key Point 1'],
            importantConcepts: ['Concept 1'],
            detailedSummary: 'Detailed Summary',
            conclusion: 'Conclusion',
            topicsCovered: ['Tech'],
            aiProvider: 'Sumora Grounded Engine',
          },
        })
      ),
      triggerSummarize: jest.fn(() => Promise.resolve({ success: true })),
    },
    redditApi: {
      getFeed: jest.fn(() => Promise.resolve({ posts: [], pagination: { totalPages: 1 } })),
      listSources: jest.fn(() => Promise.resolve([])),
    },
    contentApi: {
      getFeed: jest.fn(() => Promise.resolve({ posts: [], totalPages: 1 })),
    },
    authApi: {
      login: jest.fn(() => Promise.resolve({ user: { id: '1', email: 'test@example.com' }, token: 'mock' })),
      register: jest.fn(() => Promise.resolve({ user: { id: '1', email: 'test@example.com' }, token: 'mock' })),
      getMe: jest.fn(() => Promise.resolve({ id: '1', email: 'test@example.com' })),
      logout: jest.fn(() => Promise.resolve()),
    },
  };
});

describe('React Native Screens', () => {
  const wrap = (component: React.ReactElement) => (
    <NavigationContainer>
      <ThemeProvider>
        <AuthProvider>
          <PlatformProvider>{component}</PlatformProvider>
        </AuthProvider>
      </ThemeProvider>
    </NavigationContainer>
  );

  test('LoginScreen renders correctly', async () => {
    const mockNav: any = { navigate: jest.fn() };
    let tree: any;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(wrap(<LoginScreen navigation={mockNav} route={{} as any} />));
    });
    expect(tree).toBeDefined();
    await ReactTestRenderer.act(async () => {
      tree.unmount();
    });
  });

  test('RegisterScreen renders correctly', async () => {
    const mockNav: any = { navigate: jest.fn() };
    let tree: any;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(wrap(<RegisterScreen navigation={mockNav} route={{} as any} />));
    });
    expect(tree).toBeDefined();
    await ReactTestRenderer.act(async () => {
      tree.unmount();
    });
  });

  test('HomeScreen renders feed correctly', async () => {
    const mockNav: any = { navigate: jest.fn(), addListener: jest.fn(() => jest.fn()) };
    let tree: any;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(wrap(<HomeScreen navigation={mockNav} />));
    });
    expect(tree).toBeDefined();
    await ReactTestRenderer.act(async () => {
      tree.unmount();
    });
  });

  test('SummaryDetailScreen renders with videoId param', async () => {
    const mockRoute: any = {
      params: {
        videoId: 'dQw4w9WgXcQ',
        videoTitle: 'Sample Tech Overview',
      },
    };
    let tree: any;
    await ReactTestRenderer.act(async () => {
      tree = ReactTestRenderer.create(
        wrap(<SummaryDetailScreen navigation={{ goBack: jest.fn() } as any} route={mockRoute} />)
      );
    });
    expect(tree).toBeDefined();
    await ReactTestRenderer.act(async () => {
      tree.unmount();
    });
  });
});
