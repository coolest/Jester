// Import Jest DOM utilities using CommonJS
require('@testing-library/jest-dom');
import React from 'react';

// Add more comprehensive API mocking
if (!window.api) {
  Object.defineProperty(window, 'api', {
    value: {
      // Crypto operations
      addCrypto: jest.fn().mockResolvedValue({ id: 'test-id' }),
      getCryptos: jest.fn().mockResolvedValue([
        { 
          id: 'test-crypto-1', 
          cryptoName: 'Bitcoin', 
          videoLink: 'https://youtube.com/test',
          subreddit: 'bitcoin',
          hashtag: 'BTC',
          score: 25,
          img: 'test-image.png'
        }
      ]),
      deleteCrypto: jest.fn().mockResolvedValue(true),
      
      // Settings
      getSettings: jest.fn().mockResolvedValue({
        apiSettings: {
          apiKey: 'test-api-key',
          refreshInterval: 30,
          maxResults: 100
        },
        uiSettings: {
          theme: 'dark',
          language: 'en',
          compactView: false
        },
        dataSourceSettings: {
          enableReddit: true,
          enableTwitter: true,
          enableYoutube: true,
          redditPostsToAnalyze: 100,
          twitterPostsToAnalyze: 200,
          youtubeVideosToAnalyze: 50
        }
      }),
      saveSettings: jest.fn().mockResolvedValue(true),
      
      // Environment variables
      getEnvVariables: jest.fn().mockResolvedValue({
        REDDIT_CLIENT_ID: 'test-reddit-id',
        REDDIT_CLIENT_SECRET: 'test-reddit-secret',
        REDDIT_USERNAME: 'test-reddit-user',
        REDDIT_PASSWORD: 'test-reddit-pass',
        X_API_KEY: 'test-twitter-key',
        X_API_KEY_SECRET: 'test-twitter-secret',
        X_ACCESS_TOKEN: 'test-twitter-token',
        X_ACCESS_TOKEN_SECRET: 'test-twitter-token-secret',
        YT_KEY: 'test-youtube-key',
        DEBUG_MODE: '1',
        TEST_MODE: 'test'
      }),
      updateEnvFile: jest.fn().mockResolvedValue(true),
      
      // Database auth
      saveDbAuthFile: jest.fn().mockResolvedValue(true),
      checkDbAuthExists: jest.fn().mockResolvedValue(true),
      
      // Connection testing
      testRedditConnection: jest.fn().mockResolvedValue({ success: true, message: 'Connected successfully' }),
      testTwitterConnection: jest.fn().mockResolvedValue({ success: true, message: 'Connected successfully' }),
      testYoutubeConnection: jest.fn().mockResolvedValue({ success: true, message: 'Connected successfully' }),
      testDatabaseConnection: jest.fn().mockResolvedValue({ success: true, message: 'Connected successfully' })
    },
    writable: true,
    configurable: true
  });
}

// Mock other window properties
if (!window.electron) {
  Object.defineProperty(window, 'electron', {
    value: {
      ipcRenderer: {
        on: jest.fn(),
        send: jest.fn(),
        invoke: jest.fn()
      }
    },
    writable: true,
    configurable: true
  });
}

// Mock window resize functionality
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    })),
    writable: true,
    configurable: true
  });
}

// If your code uses ResizeObserver and it doesn't exist yet
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  }));
}

// Mock for recharts (if used in your components)
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => children,
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
    Line: () => <div data-testid="recharts-line" />,
    Bar: () => <div data-testid="recharts-bar" />,
    XAxis: () => <div data-testid="recharts-xaxis" />,
    YAxis: () => <div data-testid="recharts-yaxis" />,
    CartesianGrid: () => <div data-testid="recharts-grid" />,
    Tooltip: () => <div data-testid="recharts-tooltip" />,
    Legend: () => <div data-testid="recharts-legend" />
  };
});

// Mock Lucide React icons
jest.mock('lucide-react', () => {
  return {
    Home: () => <div data-testid="icon-home">Home Icon</div>,
    PieChart: () => <div data-testid="icon-piechart">PieChart Icon</div>,
    Settings: () => <div data-testid="icon-settings">Settings Icon</div>,
    Bell: () => <div data-testid="icon-bell">Bell Icon</div>,
    HelpCircle: () => <div data-testid="icon-help">Help Icon</div>,
    FileText: () => <div data-testid="icon-filetext">FileText Icon</div>,
    Calendar: () => <div data-testid="icon-calendar">Calendar Icon</div>,
    ChevronDown: () => <div data-testid="icon-chevrondown">ChevronDown Icon</div>,
    Plus: () => <div data-testid="icon-plus">Plus Icon</div>,
    BarChart2: () => <div data-testid="icon-barchart2">BarChart2 Icon</div>
  };
});