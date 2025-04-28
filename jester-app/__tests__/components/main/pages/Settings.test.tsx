import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Settings from '../../../../src/renderer/src/components/main/pages/Settings';

describe('Settings Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock API calls
    window.api.getSettings.mockResolvedValue({
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
        enableYoutube: false,
        redditPostsToAnalyze: 100,
        twitterPostsToAnalyze: 200,
        youtubeVideosToAnalyze: 50
      }
    });
    
    window.api.getCryptos.mockResolvedValue([
      { id: '1', cryptoName: 'Bitcoin' },
      { id: '2', cryptoName: 'Ethereum' }
    ]);
    
    window.api.getEnvVariables.mockResolvedValue({
      REDDIT_CLIENT_ID: 'reddit-client-id',
      REDDIT_CLIENT_SECRET: 'reddit-client-secret',
      REDDIT_USERNAME: 'reddit-username',
      REDDIT_PASSWORD: 'reddit-password',
      X_API_KEY: 'twitter-api-key',
      X_API_KEY_SECRET: 'twitter-api-key-secret',
      X_ACCESS_TOKEN: 'twitter-access-token',
      X_ACCESS_TOKEN_SECRET: 'twitter-access-token-secret',
      YT_KEY: 'youtube-api-key'
    });
    
    window.api.checkDbAuthExists.mockResolvedValue(true);
    window.api.saveSettings.mockResolvedValue({ success: true });
    window.api.updateEnvFile.mockResolvedValue({ success: true });
  });

  test('renders settings page with sections', async () => {
    render(<Settings />);
    
    // Wait for settings to load
    await waitFor(() => {
      // Check if main sections are rendered
      expect(screen.getByText('Application Settings')).toBeInTheDocument();
      expect(screen.getByText('API Settings')).toBeInTheDocument();
      expect(screen.getByText('Data Sources')).toBeInTheDocument();
      expect(screen.getByText('UI Preferences')).toBeInTheDocument();
    });
    
    // Check if settings tabs are rendered
    expect(screen.getByText('General Settings')).toBeInTheDocument();
    expect(screen.getByText('Reddit')).toBeInTheDocument();
    expect(screen.getByText('Twitter')).toBeInTheDocument();
    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
  });

  test('loads and displays saved settings', async () => {
    render(<Settings />);
    
    // Wait for settings to load
    await waitFor(() => {
      // API Settings
      expect(screen.getByLabelText('API Key')).toHaveValue('test-api-key');
      expect(screen.getByLabelText('Data Refresh Interval (minutes)')).toHaveValue('30');
      expect(screen.getByLabelText('Maximum Results Per Source')).toHaveValue(100);
      
      // Data Sources
      expect(screen.getByLabelText('Enable Reddit Analysis')).toBeChecked();
      expect(screen.getByLabelText('Enable Twitter Analysis')).toBeChecked();
      expect(screen.getByLabelText('Enable YouTube Analysis')).not.toBeChecked();
      
      // UI Preferences
      expect(screen.getByLabelText('Application Theme')).toHaveValue('dark');
      expect(screen.getByLabelText('Language')).toHaveValue('en');
      expect(screen.getByLabelText('Use Compact View')).not.toBeChecked();
    });
  });

  test('displays cryptocurrency count', async () => {
    render(<Settings />);
    
    // Wait for settings to load
    await waitFor(() => {
      // Check if crypto count is displayed
      expect(screen.getByText('2 Cryptocurrencies Tracked')).toBeInTheDocument();
    });
  });

  test('switches between settings tabs', async () => {
    render(<Settings />);
    
    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByText('API Settings')).toBeInTheDocument();
    });
    
    // Initially, general settings should be visible
    expect(screen.getByText('API Settings')).toBeInTheDocument();
    expect(screen.queryByText('Reddit API Authentication')).not.toBeInTheDocument();
    
    // Click Reddit tab
    fireEvent.click(screen.getByText('Reddit'));
    
    // Reddit settings should be visible
    expect(screen.getByText('Reddit API Authentication')).toBeInTheDocument();
    expect(screen.queryByText('API Settings')).not.toBeInTheDocument();
    
    // Check if Reddit credentials are loaded
    expect(screen.getByLabelText('Client ID')).toHaveValue('reddit-client-id');
    expect(screen.getByLabelText('Client Secret')).toHaveValue('reddit-client-secret');
    expect(screen.getByLabelText('Reddit Username')).toHaveValue('reddit-username');
    expect(screen.getByLabelText('Reddit Password')).toHaveValue('reddit-password');
    
    // Click Twitter tab
    fireEvent.click(screen.getByText('Twitter'));
    
    // Twitter settings should be visible
    expect(screen.getByText('Twitter/X API Authentication')).toBeInTheDocument();
    expect(screen.queryByText('Reddit API Authentication')).not.toBeInTheDocument();
    
    // Check if Twitter credentials are loaded
    expect(screen.getByLabelText('API Key')).toHaveValue('twitter-api-key');
    expect(screen.getByLabelText('API Key Secret')).toHaveValue('twitter-api-key-secret');
    expect(screen.getByLabelText('Access Token')).toHaveValue('twitter-access-token');
    expect(screen.getByLabelText('Access Token Secret')).toHaveValue('twitter-access-token-secret');
    
    // Click YouTube tab
    fireEvent.click(screen.getByText('YouTube'));
    
    // YouTube settings should be visible
    expect(screen.getByText('YouTube API Authentication')).toBeInTheDocument();
    expect(screen.queryByText('Twitter/X API Authentication')).not.toBeInTheDocument();
    
    // Check if YouTube credentials are loaded
    expect(screen.getByLabelText('API Key')).toHaveValue('youtube-api-key');
    
    // Click Database tab
    fireEvent.click(screen.getByText('Database'));
    
    // Database settings should be visible
    expect(screen.getByText('Database Authentication')).toBeInTheDocument();
    expect(screen.queryByText('YouTube API Authentication')).not.toBeInTheDocument();
    
    // Check if DB auth file status is displayed
    expect(screen.getByText('db_auth.json (File Exists)')).toBeInTheDocument();
    
    // Click General Settings tab
    fireEvent.click(screen.getByText('General Settings'));
    
    // General settings should be visible again
    expect(screen.getByText('API Settings')).toBeInTheDocument();
    expect(screen.queryByText('Database Authentication')).not.toBeInTheDocument();
  });

  test('updates settings when inputs change', async () => {
    render(<Settings />);
    
    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByLabelText('API Key')).toBeInTheDocument();
    });
    
    // Change API Settings
    fireEvent.change(screen.getByLabelText('Data Refresh Interval (minutes)'), { target: { value: '60' } });
    fireEvent.change(screen.getByLabelText('Maximum Results Per Source'), { target: { value: '200' } });
    
    // Change Data Sources
    fireEvent.click(screen.getByLabelText('Enable YouTube Analysis')); // Check it
    fireEvent.change(screen.getByLabelText('Reddit Posts to Analyze'), { target: { value: '150' } });
    
    // Change UI Preferences
    fireEvent.change(screen.getByLabelText('Application Theme'), { target: { value: 'light' } });
    fireEvent.click(screen.getByLabelText('Use Compact View')); // Check it
    
    // Verify changes were applied to form state
    expect(screen.getByLabelText('Data Refresh Interval (minutes)')).toHaveValue('60');
    expect(screen.getByLabelText('Maximum Results Per Source')).toHaveValue(200);
    expect(screen.getByLabelText('Enable YouTube Analysis')).toBeChecked();
    expect(screen.getByLabelText('Reddit Posts to Analyze')).toHaveValue(150);
    expect(screen.getByLabelText('Application Theme')).toHaveValue('light');
    expect(screen.getByLabelText('Use Compact View')).toBeChecked();
  });

  test('saves settings when save button is clicked', async () => {
    render(<Settings />);
    
    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByLabelText('API Key')).toBeInTheDocument();
    });
    
    // Make some changes
    fireEvent.change(screen.getByLabelText('Data Refresh Interval (minutes)'), { target: { value: '60' } });
    fireEvent.click(screen.getByLabelText('Enable YouTube Analysis')); // Check it
    
    // Click save button
    fireEvent.click(screen.getByText('Save All Settings'));
    
    // Check if saveSettings was called with updated settings
    await waitFor(() => {
      expect(window.api.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          apiSettings: expect.objectContaining({
            refreshInterval: 60
          }),
          dataSourceSettings: expect.objectContaining({
            enableYoutube: true
          })
        })
      );
    });
    
    // Check if updateEnvFile was called
    expect(window.api.updateEnvFile).toHaveBeenCalled();
    
    // Check if success message is displayed
    expect(screen.getByText(/settings saved successfully/i)).toBeInTheDocument();
  });

  test('resets settings when reset button is clicked', async () => {
    // Mock confirm to return true
    global.confirm = jest.fn(() => true);
    
    render(<Settings />);
    
    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByLabelText('API Key')).toBeInTheDocument();
    });
    
    // Make some changes first
    fireEvent.change(screen.getByLabelText('Data Refresh Interval (minutes)'), { target: { value: '60' } });
    
    // Click reset button
    fireEvent.click(screen.getByText('Reset to Default'));
    
    // Check if confirm was called
    expect(global.confirm).toHaveBeenCalled();
    
    // Check if settings were reset
    await waitFor(() => {
      expect(screen.getByLabelText('Data Refresh Interval (minutes)')).toHaveValue('30');
      expect(screen.getByLabelText('Maximum Results Per Source')).toHaveValue(100);
    });
    
    // Check if success message is displayed
    expect(screen.getByText('Settings reset to defaults!')).toBeInTheDocument();
  });

  test('shows/hides passwords when toggle is clicked', async () => {
    render(<Settings />);
    
    // Switch to Reddit tab
    fireEvent.click(screen.getByText('Reddit'));
    
    // Wait for Reddit settings to load
    await waitFor(() => {
      expect(screen.getByLabelText('Client Secret')).toBeInTheDocument();
    });
    
    // Password fields should be masked by default
    expect(screen.getByLabelText('Client Secret')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Reddit Password')).toHaveAttribute('type', 'password');
    
    // Click show passwords button
    fireEvent.click(screen.getByText('Show Passwords'));
    
    // Password fields should be visible
    expect(screen.getByLabelText('Client Secret')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Reddit Password')).toHaveAttribute('type', 'text');
    
    // Click hide passwords button
    fireEvent.click(screen.getByText('Hide Passwords'));
    
    // Password fields should be masked again
    expect(screen.getByLabelText('Client Secret')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Reddit Password')).toHaveAttribute('type', 'password');
  });

  test('tests API connections when test buttons are clicked', async () => {
    // Mock the connection test functions
    window.api.testRedditConnection.mockResolvedValue({ success: true, message: 'Connected successfully!' });
    window.api.testTwitterConnection.mockResolvedValue({ success: true, message: 'Connected successfully!' });
    window.api.testYoutubeConnection.mockResolvedValue({ success: true, message: 'Connected successfully!' });
    window.api.testDatabaseConnection.mockResolvedValue({ success: true, message: 'Connected successfully!' });
    
    render(<Settings />);
    
    // Test Reddit connection
    fireEvent.click(screen.getByText('Reddit'));
    
    await waitFor(() => {
      expect(screen.getByText('Test Connection')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Test Connection'));
    
    // Check if testRedditConnection was called
    await waitFor(() => {
      expect(window.api.testRedditConnection).toHaveBeenCalled();
    });
    
    // Check if success message is displayed
    expect(screen.getByText('Successfully connected to reddit!')).toBeInTheDocument();
    
    // Test Twitter connection
    fireEvent.click(screen.getByText('Twitter'));
    
    await waitFor(() => {
      expect(screen.getByText('Test Connection')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Test Connection'));
    
    // Check if testTwitterConnection was called
    await waitFor(() => {
      expect(window.api.testTwitterConnection).toHaveBeenCalled();
    });
    
    // Test YouTube connection
    fireEvent.click(screen.getByText('YouTube'));
    
    await waitFor(() => {
      expect(screen.getByText('Test Connection')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Test Connection'));
    
    // Check if testYoutubeConnection was called
    await waitFor(() => {
      expect(window.api.testYoutubeConnection).toHaveBeenCalled();
    });
    
    // Test Database connection
    fireEvent.click(screen.getByText('Database'));
    
    await waitFor(() => {
      expect(screen.getByText('Test Database Connection')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Test Database Connection'));
    
    // Check if testDatabaseConnection was called
    await waitFor(() => {
      expect(window.api.testDatabaseConnection).toHaveBeenCalled();
    });
  });

  test('handles API connection test failures', async () => {
    // Mock the connection test function to fail
    window.api.testRedditConnection.mockRejectedValue(new Error('Connection failed: Invalid credentials'));
    
    render(<Settings />);
    
    // Test Reddit connection
    fireEvent.click(screen.getByText('Reddit'));
    
    await waitFor(() => {
      expect(screen.getByText('Test Connection')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Test Connection'));
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to connect to reddit/i)).toBeInTheDocument();
    });
  });

  test('handles database file upload', async () => {
    render(<Settings />);
    
    // Switch to Database tab
    fireEvent.click(screen.getByText('Database'));
    
    // Wait for Database settings to load
    await waitFor(() => {
      expect(screen.getByText('Database Authentication')).toBeInTheDocument();
    });
    
    // Mock FileReader
    const mockFileReader = {
      onload: null,
      readAsText: jest.fn(function() {
        setTimeout(() => {
          this.onload({ target: { result: '{"type":"service_account"}' } });
        }, 0);
      })
    };
    global.FileReader = jest.fn(() => mockFileReader);
    
    // Create a test file
    const testFile = new File(['{"type":"service_account"}'], 'test-db-auth.json', { type: 'application/json' });
    
    // Click Select File button
    const selectFileButton = screen.getByText('Select File');
    
    // Create a mock for fileInputRef.current
    const fileInput = { click: jest.fn() };
    jest.spyOn(React, 'useRef').mockReturnValue({ current: fileInput });
    
    fireEvent.click(selectFileButton);
    
    // Simulate file selection
    // Since we can't directly test the file input (it's hidden), we'll mock the onChange handler
    const handleDbAuthFileChange = jest.fn();
    // This part would need adjustment based on how your component is structured
    
    // Save settings with the file
    fireEvent.click(screen.getByText('Save All Settings'));
    
    // Check if saveDbAuthFile was called
    await waitFor(() => {
      expect(window.api.saveDbAuthFile).toHaveBeenCalled();
    });
  });

  test('handles danger zone functionality', async () => {
    // Mock alert to check if it's called
    global.alert = jest.fn();
    // Mock confirm to return true
    global.confirm = jest.fn(() => true);
    
    render(<Settings />);
    
    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    });
    
    // Click clear data button
    fireEvent.click(screen.getByText('Clear All Cryptocurrency Data'));
    
    // Check if confirm was called
    expect(global.confirm).toHaveBeenCalled();
    
    // Check if alert was called (confirmation message)
    expect(global.alert).toHaveBeenCalledWith('All cryptocurrency data has been cleared.');
  });

  test('generates new API key when button is clicked', async () => {
    // Mock Math.random to return predictable values
    const originalMathRandom = Math.random;
    Math.random = jest.fn(() => 0.5);
    
    render(<Settings />);
    
    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByText('Generate New API Key')).toBeInTheDocument();
    });
    
    // API Key should be masked initially
    const apiKeyInput = screen.getByLabelText('API Key');
    expect(apiKeyInput).toHaveAttribute('type', 'password');
    
    // Click generate new API key button
    fireEvent.click(screen.getByText('Generate New API Key'));
    
    // API Key should be visible after generation
    expect(apiKeyInput).toHaveAttribute('type', 'text');
    
    // New API key should be generated with predictable pattern (due to mocked Math.random)
    expect(apiKeyInput).toHaveValue(expect.stringContaining('88888888-8888-8888-8888-888888888888'));
    
    // Restore Math.random
    Math.random = originalMathRandom;
  });
})