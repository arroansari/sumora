import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ThemeProvider } from '../src/context/ThemeContext';
import { AuthProvider } from '../src/context/AuthContext';
import { LoginScreen } from '../src/screens/auth/LoginScreen';
import { RegisterScreen } from '../src/screens/auth/RegisterScreen';
import { HomeScreen } from '../src/screens/home/HomeScreen';
import { SummaryDetailScreen } from '../src/screens/summaries/SummaryDetailScreen';

describe('React Native Screens', () => {
  const wrap = (component: React.ReactElement) => (
    <ThemeProvider>
      <AuthProvider>{component}</AuthProvider>
    </ThemeProvider>
  );

  test('LoginScreen renders correctly', async () => {
    const mockNav: any = { navigate: jest.fn() };
    let tree: any;
    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(wrap(<LoginScreen navigation={mockNav} route={{} as any} />));
    });
    expect(tree).toBeDefined();
  });

  test('RegisterScreen renders correctly', async () => {
    const mockNav: any = { navigate: jest.fn() };
    let tree: any;
    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(wrap(<RegisterScreen navigation={mockNav} route={{} as any} />));
    });
    expect(tree).toBeDefined();
  });

  test('HomeScreen renders feed correctly', async () => {
    const mockNav: any = { navigate: jest.fn() };
    let tree: any;
    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(wrap(<HomeScreen navigation={mockNav} />));
    });
    expect(tree).toBeDefined();
  });

  test('SummaryDetailScreen renders with videoId param', async () => {
    const mockRoute: any = {
      params: {
        videoId: 'dQw4w9WgXcQ',
        videoTitle: 'Sample Tech Overview',
      },
    };
    let tree: any;
    await ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        wrap(<SummaryDetailScreen navigation={{} as any} route={mockRoute} />)
      );
    });
    expect(tree).toBeDefined();
  });
});

