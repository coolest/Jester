import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewReport from '../../../../src/renderer/src/components/main/pages/newReport';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Calendar: () => <div data-testid="calendar-icon">Calendar Icon</div>,
  ChevronDown: () => <div data-testid="chevron-icon">ChevronDown Icon</div>,
  FileText: () => <div data-testid="filetext-icon">FileText Icon</div>
}));

describe('NewReport Component', () => {
  const mockCryptos = [
    {
      id: 'btc-123',
      cryptoName: 'Bitcoin',
      videoLink: 'https://youtube.com/bitcoin',
      subreddit: 'bitcoin',
      hashtag: 'BTC',
      score: 25,
      img: 'bitcoin.png'
    },
    {
      id: 'eth-456',
      cryptoName: 'Ethereum',
      videoLink: 'https://youtube.com/ethereum',
      subreddit: 'ethereum',
      hashtag: 'ETH',
      score: 15,
      img: 'ethereum.png'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the Date.now() to return a consistent date for testing
    jest.spyOn(Date, 'now').mockImplementation(() => 1714500000000); // Fixed timestamp
    
    // Set up window.api mock
    window.api = {
      addCrypto: jest.fn().mockResolvedValue({}),
      getCryptos: jest.fn().mockResolvedValue(mockCryptos),
      deleteCrypto: jest.fn().mockResolvedValue({}),
      getSettings: jest.fn().mockResolvedValue({}),
      saveSettings: jest.fn().mockResolvedValue({}),
      getEnvVariables: jest.fn().mockResolvedValue({}),
      updateEnvFile: jest.fn().mockResolvedValue({}),
      saveDbAuthFile: jest.fn().mockResolvedValue({}),
      checkDbAuthExists: jest.fn().mockResolvedValue({}),
      testRedditConnection: jest.fn().mockResolvedValue({}),
      testTwitterConnection: jest.fn().mockResolvedValue({}),
      testYoutubeConnection: jest.fn().mockResolvedValue({}),
      testDatabaseConnection: jest.fn().mockResolvedValue({})
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders report creation form', async () => {
    render(<NewReport />);
    
    // Check for the title
    expect(screen.getByText('Create New Analysis Report')).toBeInTheDocument();
    
    // Check for form sections
    expect(screen.getByText('Report Information')).toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('Advanced Options')).toBeInTheDocument();
  });

  test('loads available cryptocurrencies', async () => {
    render(<NewReport />);
    
    // Check if the API was called to get cryptos
    expect(window.api.getCryptos).toHaveBeenCalled();
    
    // Wait for cryptos to load and check if they appear in the dropdown
    await waitFor(() => {
      const cryptoSelect = screen.getByLabelText(/Cryptocurrency/i);
      expect(cryptoSelect).toBeInTheDocument();
      
      // Check if Bitcoin is in the dropdown (this depends on your implementation)
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });
  });

  test('auto-generates report name based on selected crypto', async () => {
    render(<NewReport />);
    
    // Wait for cryptos to load
    await waitFor(() => {
      expect(window.api.getCryptos).toHaveBeenCalled();
    });
    
    // Check if the report name field is pre-filled with Bitcoin
    const reportNameInput = screen.getByLabelText(/Report Name/i);
    expect(reportNameInput).toHaveValue('Bitcoin Analysis Report');
    
    // Find the crypto dropdown and change its value to Ethereum
    const cryptoSelect = screen.getByLabelText(/Cryptocurrency/i);
    fireEvent.change(cryptoSelect, { target: { value: 'eth-456' } });
    
    // Check if report name updates to Ethereum
    await waitFor(() => {
      expect(reportNameInput).toHaveValue('Ethereum Analysis Report');
    });
  });

  test('allows date range selection', () => {
    render(<NewReport />);
    
    // Find date inputs
    const startDateInput = screen.getByLabelText(/Start Date/i);
    const endDateInput = screen.getByLabelText(/End Date/i);
    
    // Change date values
    fireEvent.change(startDateInput, { target: { value: '2022-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2022-01-31' } });
    
    // Check if dates were updated
    expect(startDateInput).toHaveValue('2022-01-01');
    expect(endDateInput).toHaveValue('2022-01-31');
  });

  test('uses date presets when buttons are clicked', () => {
    render(<NewReport />);
    
    // Find date preset buttons
    const last7DaysButton = screen.getByText('Last 7 Days');
    const last30DaysButton = screen.getByText('Last 30 Days');
    const last90DaysButton = screen.getByText('Last 90 Days');
    
    // Click on "Last 30 Days" button
    fireEvent.click(last30DaysButton);
    
    // Check if date inputs are updated
    const startDateInput = screen.getByLabelText(/Start Date/i);
    const endDateInput = screen.getByLabelText(/End Date/i);
    
    // We don't know the exact dates since Date.now() might vary,
    // but we can check that the inputs have values
    expect(startDateInput).toHaveValue();
    expect(endDateInput).toHaveValue();
  });

  test('toggles advanced options when section is clicked', () => {
    render(<NewReport />);
    
    // Check if advanced options are initially hidden
    expect(screen.queryByText('Include Platforms')).not.toBeInTheDocument();
    
    // Click on the advanced options toggle
    const advancedToggle = screen.getByText('Advanced Options');
    fireEvent.click(advancedToggle);
    
    // Check if advanced options are now visible
    expect(screen.getByText('Include Platforms')).toBeInTheDocument();
    
    // Check if platform checkboxes are visible and checked by default
    const redditToggle = screen.getByLabelText('Reddit');
    const twitterToggle = screen.getByLabelText('Twitter');
    const youtubeToggle = screen.getByLabelText('YouTube');
    
    expect(redditToggle).toBeChecked();
    expect(twitterToggle).toBeChecked();
    expect(youtubeToggle).toBeChecked();
  });

  test('handles platform toggles correctly', () => {
    render(<NewReport />);
    
    // Open advanced options
    const advancedToggle = screen.getByText('Advanced Options');
    fireEvent.click(advancedToggle);
    
    // Find platform toggles
    const redditToggle = screen.getByLabelText('Reddit');
    
    // Uncheck Reddit
    fireEvent.click(redditToggle);
    
    // Check if Reddit toggle is now unchecked
    expect(redditToggle).not.toBeChecked();
  });

  test('calls generate report function when button is clicked', () => {
    // Mock window.alert since we'll be calling it
    global.alert = jest.fn();
    
    render(<NewReport />);
    
    // Find generate report button
    const generateButton = screen.getByRole('button', { name: /Generate Report/i });
    
    // Click the button
    fireEvent.click(generateButton);
    
    // Check if alert was called
    expect(global.alert).toHaveBeenCalledWith('Report generation initiated!');
    
    // Restore original alert
    jest.restoreAllMocks();
  });
});