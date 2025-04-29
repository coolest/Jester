import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Settings from '../../../../src/renderer/src/components/main/pages/Settings';

describe('Settings Component', () => {
  // Mock API settings data
  const mockSettings = {
    apiSettings: {
      apiKey: 'test-api-key',
      refreshInterval: '30',  // should be a string to match select value
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
  };

  // Mock environment variables
  const mockEnvVars = {
    REDDIT_CLIENT_ID: 'reddit-client-id',
    REDDIT_CLIENT_SECRET: 'reddit-client-secret',
    REDDIT_USERNAME: 'reddit-username',
    REDDIT_PASSWORD: 'reddit-password',
    X_API_KEY: 'twitter-api-key',
    X_API_KEY_SECRET: 'twitter-api-secret',
    X_ACCESS_TOKEN: 'twitter-access-token',
    X_ACCESS_TOKEN_SECRET: 'twitter-access-token-secret',
    YT_KEY: 'youtube-api-key',
    DEBUG_MODE: '1',
    TEST_MODE: 'test'
  };

  // Mock crypto data
  const mockCryptos = [
    { id: 'btc', cryptoName: 'Bitcoin', score: 25 },
    { id: 'eth', cryptoName: 'Ethereum', score: 15 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up window.api mock with all required methods
    window.api = {
      addCrypto: jest.fn().mockResolvedValue({}),
      getCryptos: jest.fn().mockResolvedValue(mockCryptos),
      deleteCrypto: jest.fn().mockResolvedValue({}),
      getSettings: jest.fn().mockResolvedValue(mockSettings),
      saveSettings: jest.fn().mockResolvedValue(true),
      getEnvVariables: jest.fn().mockResolvedValue(mockEnvVars),
      updateEnvFile: jest.fn().mockResolvedValue(true),
      saveDbAuthFile: jest.fn().mockResolvedValue(true),
      checkDbAuthExists: jest.fn().mockResolvedValue(true),
      testRedditConnection: jest.fn().mockResolvedValue({ success: true }),
      testTwitterConnection: jest.fn().mockResolvedValue({ success: true }),
      testYoutubeConnection: jest.fn().mockResolvedValue({ success: true }),
      testDatabaseConnection: jest.fn().mockResolvedValue({ success: true }),
      getAllReports: jest.fn().mockResolvedValue({ success: true, reports: [] }),
      getReportById: jest.fn().mockResolvedValue({ success: true, resultData: [] }),    
      createReport: jest.fn(),  
    };

    // Mock window.confirm
    window.confirm = jest.fn().mockReturnValue(true);

    // Mock window.alert
    window.alert = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders settings component with title', async () => {
    await act(async () => {
      render(<Settings />);
    });

    await waitFor(() => {
      expect(screen.getByText('Application Settings')).toBeInTheDocument();
      expect(screen.getByText('API Settings')).toBeInTheDocument();
      expect(screen.getByText('Data Sources')).toBeInTheDocument();
      expect(screen.getByText('UI Preferences')).toBeInTheDocument();
    });
  });

  test('loads settings on component mount', async () => {
    await act(async () => {
      render(<Settings />);
    });

    await waitFor(() => {
      expect(window.api.getSettings).toHaveBeenCalled();
      expect(window.api.getEnvVariables).toHaveBeenCalled();
      expect(window.api.getCryptos).toHaveBeenCalled();

      const apiKeyInput = screen.getByLabelText(/API Key/i);
      expect(apiKeyInput).toHaveValue('test-api-key');
    });
  });

  test('handles tab switching correctly', async () => {
    await act(async () => {
      render(<Settings />);
    });

    await waitFor(() => {
      expect(screen.getByText('API Settings')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Reddit/i }));
    expect(await screen.findByText('Reddit API Authentication')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Twitter/i }));
    expect(await screen.findByText(/Twitter\/X API Authentication/i)).toBeInTheDocument();
  });

  test('allows changing API settings', async () => {
    await act(async () => {
      render(<Settings />);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/API Key/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Data Refresh Interval/i), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText(/Maximum Results Per Source/i), { target: { value: 200 } });

    fireEvent.click(screen.getByRole('button', { name: /Save All Settings/i }));

    await waitFor(() => {
      expect(window.api.saveSettings).toHaveBeenCalledWith(expect.objectContaining({
        apiSettings: expect.objectContaining({
          refreshInterval: '15',
          maxResults: 200,  // number, not string
        }),
      }));
    });
  });

  test('allows generating a new API key', async () => {
    await act(async () => {
      render(<Settings />);
    });

    const apiKeyInput = await screen.findByLabelText(/API Key/i);
    const initialApiKey = apiKeyInput.getAttribute('value');

    fireEvent.click(screen.getByRole('button', { name: /Generate New API Key/i }));

    expect(apiKeyInput.getAttribute('value')).not.toBe(initialApiKey);
  });

  test('allows toggling data sources', async () => {
    await act(async () => {
      render(<Settings />);
    });

    const redditToggle = await screen.findByLabelText(/Enable Reddit Analysis/i);
    fireEvent.click(redditToggle);

    expect(redditToggle).not.toBeChecked();
  });

  test('allows resetting settings to defaults', async () => {
    await act(async () => {
      render(<Settings />);
    });

    const resetButton = await screen.findByRole('button', { name: /Reset to Default/i });
    fireEvent.click(resetButton);

    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText(/Settings reset to defaults!/i)).toBeInTheDocument();
    });
  });

  test('allows testing service connections', async () => {
    await act(async () => {
      render(<Settings />);
    });

    fireEvent.click(await screen.findByRole('button', { name: /Reddit/i }));

    const testButton = await screen.findByRole('button', { name: /Test Connection/i });
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(window.api.testRedditConnection).toHaveBeenCalled();
    });

    // Change your assertion from "Testing connection" to the success message you actually show
    await waitFor(() => {
      expect(screen.getByText(/Successfully connected to reddit/i)).toBeInTheDocument();
    });
  });
});
