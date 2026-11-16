/* eslint-env jest */
jest.mock('@react-native-async-storage/async-storage', () => {
  let store = {};
  return {
    getItem: jest.fn((key) => Promise.resolve(store[key] || null)),
    setItem: jest.fn((key, val) => {
      store[key] = String(val);
      return Promise.resolve(null);
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
      return Promise.resolve(null);
    }),
    clear: jest.fn(() => {
      store = {};
      return Promise.resolve(null);
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
    multiGet: jest.fn((keys) => Promise.resolve(keys.map((k) => [k, store[k] || null]))),
    multiSet: jest.fn((pairs) => {
      pairs.forEach(([k, v]) => {
        store[k] = String(v);
      });
      return Promise.resolve(null);
    }),
    multiRemove: jest.fn((keys) => {
      keys.forEach((k) => {
        delete store[k];
      });
      return Promise.resolve(null);
    }),
  };
});

// Mock FastImage
jest.mock('@d11/react-native-fast-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockFastImage = (props) => React.createElement(View, props);
  MockFastImage.resizeMode = {
    contain: 'contain',
    cover: 'cover',
    stretch: 'stretch',
    center: 'center',
  };
  MockFastImage.priority = {
    low: 'low',
    normal: 'normal',
    high: 'high',
  };
  MockFastImage.cacheControl = {
    immutable: 'immutable',
    web: 'web',
    cacheOnly: 'cacheOnly',
  };
  return MockFastImage;
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const mockInsets = { top: 47, bottom: 34, left: 0, right: 0 };
  const mockFrame = { x: 0, y: 0, width: 393, height: 852 };
  const mockInsetsContext = React.createContext(mockInsets);
  const mockFrameContext = React.createContext(mockFrame);

  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(mockInsets),
    SafeAreaInsetsContext: mockInsetsContext,
    SafeAreaFrameContext: mockFrameContext,
    SafeAreaView: ({ children, style, ...props }) => React.createElement(View, { style, ...props }, children),
    useSafeAreaInsets: () => mockInsets,
    useSafeAreaFrame: () => mockFrame,
    initialWindowMetrics: {
      insets: mockInsets,
      frame: mockFrame,
    },
  };
});

// Mock react-native-screens
jest.mock('react-native-screens', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    enableScreens: jest.fn(),
    ScreenContainer: ({ children }) => React.createElement(View, {}, children),
    Screen: ({ children }) => React.createElement(View, {}, children),
    ScreenStack: ({ children }) => React.createElement(View, {}, children),
    ScreenStackItem: ({ children }) => React.createElement(View, {}, children),
    ScreenStackHeaderConfig: () => null,
    ScreenStackHeaderSubview: ({ children }) => React.createElement(View, {}, children),
    SearchBar: () => null,
    compatibilityFlags: {
      usesNewAndroidHeaderHeightImplementation: false,
    },
  };
});
