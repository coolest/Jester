import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Settings from '../../../../src/renderer/src/components/main/pages/Settings';

describe('Settings Component', () => {
  // Mock API settings data
  const mockSettings = {
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
      testDatabaseConnection: jest.fn().mockResolvedValue({ success: true })
    };

    // Mock window.confirm
    window.confirm = jest.fn().mockReturnValue(true);
    
    // Mock window.alert
    window.alert = jest.fn();
  });

  afterEach(() => {
    // Restore original window.confirm and window.alert
    jest.restoreAllMocks();
  });

  test('renders settings component with title', async () => {
    render(<Settings />);
    
    // Check for the title
    expect(screen.getByText('Application Settings')).toBeInTheDocument();
    
    // Check for sections
    await waitFor(() => {
      expect(screen.getByText('API Settings')).toBeInTheDocument();
      expect(screen.getByText('Data Sources')).toBeInTheDocument();
      expect(screen.getByText('UI Preferences')).toBeInTheDocument();
    });
  });

  test('loads settings on component mount', async () => {
    render(<Settings />);
    
    // Check if API was called to get settings
    expect(window.api.getSettings).toHaveBeenCalled();
    expect(window.api.getEnvVariables).toHaveBeenCalled();
    expect(window.api.getCryptos).toHaveBeenCalled();
    
    // Wait for settings to load
    await waitFor(() => {
      // Check if API key field is populated
      const apiKeyInput = screen.getByLabelText(/API Key/i);
      expect(apiKeyInput).toHaveValue('test-api-key');
    });
  });

  test('handles tab switching correctly', async () => {
    render(<Settings />);
    
    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('API Settings')).toBeInTheDocument();
    });
    
    // Initially, general settings should be visible
    expect(screen.getByText('API Settings')).toBeInTheDocument();
    
    // Click on Reddit tab
    fireEvent.click(screen.getByRole('button', { name: /Reddit/i }));
    
    // Now Reddit settings should be visible
    expect(screen.getByText('Reddit API Authentication')).toBeInTheDocument();
    
    // Click on Twitter tab
    fireEvent.click(screen.getByRole('button', { name: /Twitter/i }));
    
    // Now Twitter settings should be visible
    expect(screen.getByText(/Twitter\/X API Authentication/i)).toBeInTheDocument();
  });

  test('allows changing API settings', async () => {
    render(<Settings />);
    
    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByLabelText(/API Key/i)).toBeInTheDocument();
    });
    
    // Find refresh interval dropdown and change its value
    const refreshIntervalSelect = screen.getByLabelText(/Data Refresh Interval/i);
    fireEvent.change(refreshIntervalSelect, { target: { value: '15' } });
    
    // Find max results input and change its value
    const maxResultsInput = screen.getByLabelText(/Maximum Results Per Source/i);
    fireEvent.change(maxResultsInput, { target: { value: '200' } });
    
    // Click save button
    fireEvent.click(screen.getByRole('button', { name: /Save All Settings/i }));
    
    // Check if API was called with updated settings
    await waitFor(() => {
      expect(window.api.saveSettings).toHaveBeenCalledWith(expect.objectContaining({
        apiSettings: expect.objectContaining({
          refreshInterval: '15',
          maxResults: '200'
        })
      }));
    });
  });

  test('allows generating a new API key', async () => {
    render(<Settings />);
    
    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByLabelText(/API Key/i)).toBeInTheDocument();
    });
    
    // Get initial API key value
    const apiKeyInput = screen.getByLabelText(/API Key/i);
    const initialApiKey = (apiKeyInput as HTMLInputElement).value;
    
    // Click generate new API key button
    fireEvent.click(screen.getByRole('button', { name: /Generate New API Key/i }));
    
    // Check if API key was changed
    expect((apiKeyInput as HTMLInputElement).value).not.toBe(initialApiKey);
  });

  test('allows toggling data sources', async () => {
    render(<Settings />);
    
    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByLabelText(/Enable Reddit Analysis/i)).toBeInTheDocument();
    });
    
    // Find Reddit toggle and uncheck it
    const redditToggle = screen.getByLabelText(/Enable Reddit Analysis/i);
    fireEvent.click(redditToggle);
    
    // Check if Reddit toggle is now unchecked
    expect(redditToggle).not.toBeChecked();
    expect(screen.queryByLabelText(/Reddit Posts to Analyze/i)).not.toBeInTheDocument();
  });

  test('allows resetting settings to defaults', async () => {
    render(<Settings />);
    
    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Reset to Default/i })).toBeInTheDocument();
    });
    
    // Click reset button
    fireEvent.click(screen.getByRole('button', { name: /Reset to Default/i }));
    
    // Check if confirmation dialog was shown
    expect(window.confirm).toHaveBeenCalled();
    
    // Since we mocked window.confirm to return true, settings should be reset
    await waitFor(() => {
      // We can't easily check the reset values, but we can check that the save status message appears
      expect(screen.getByText(/Settings reset to defaults!/i)).toBeInTheDocument();
    });
  });

  test('allows testing service connections', async () => {
    render(<Settings />);
    
    // Switch to Reddit tab
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /Reddit/i }));
    });
    
    // Wait for Reddit settings to load
    await waitFor(() => {
      expect(screen.getByText(/Reddit API Authentication/i)).toBeInTheDocument();
    });
    
    // Check if test connection button is available
    const testButton = screen.getByRole('button', { name: /Test Connection/i });
    expect(testButton).toBeInTheDocument();
    
    // Click test connection button
    fireEvent.click(testButton);
    
    // Check if API was called
    await waitFor(() => {
      expect(window.api.testRedditConnection).toHaveBeenCalled();
    });
    
    // Check if success message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Testing connection to reddit/i)).toBeInTheDocument();
    });
  });
});