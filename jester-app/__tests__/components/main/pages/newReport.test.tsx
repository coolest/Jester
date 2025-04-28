import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewReport from '../../../../src/renderer/src/components/main/pages/newReport';

describe('NewReport Component', () => {
  const mockCryptos = [
    { id: '1', cryptoName: 'Bitcoin', subreddit: 'bitcoin', hashtag: 'BTC', score: 65 },
    { id: '2', cryptoName: 'Ethereum', subreddit: 'ethereum', hashtag: 'ETH', score: 55 }
  ];
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock API calls
    window.api.getCryptos.mockResolvedValue(mockCryptos);
    
    // Mock date functions to ensure consistent output
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-04-27T12:00:00Z'));
  });
  
  afterEach(() => {
    // Restore timers
    jest.useRealTimers();
  });

  test('renders loading state initially', () => {
    render(<NewReport />);
    
    // Check if loading message is displayed
    expect(screen.getByText(/loading available cryptocurrencies/i)).toBeInTheDocument();
  });

  test('loads cryptocurrencies and pre-fills form', async () => {
    render(<NewReport />);
    
    // Wait for cryptocurrencies to load
    await waitFor(() => {
      expect(screen.queryByText(/loading available cryptocurrencies/i)).not.toBeInTheDocument();
    });
    
    // Check if report name is auto-generated
    expect(screen.getByLabelText(/report name/i)).toHaveValue('Bitcoin Analysis Report');
    
    // Check if cryptocurrency selector has options
    const cryptoSelect = screen.getByLabelText(/cryptocurrency/i);
    expect(cryptoSelect).toHaveValue('1'); // Bitcoin should be selected by default
    
    // Check date inputs
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);
    
    // End date should be today (2025-04-27)
    expect(endDateInput).toHaveValue('2025-04-27');
    
    // Start date should be 7 days ago (2025-04-20)
    expect(startDateInput).toHaveValue('2025-04-20');
  });

  test('changes report name when selected crypto changes', async () => {
    render(<NewReport />);
    
    // Wait for cryptocurrencies to load
    await waitFor(() => {
      expect(screen.queryByText(/loading available cryptocurrencies/i)).not.toBeInTheDocument();
    });
    
    // Check initial report name
    expect(screen.getByLabelText(/report name/i)).toHaveValue('Bitcoin Analysis Report');
    
    // Change selected cryptocurrency to Ethereum
    fireEvent.change(screen.getByLabelText(/cryptocurrency/i), { target: { value: '2' } });
    
    // Check if report name updates
    expect(screen.getByLabelText(/report name/i)).toHaveValue('Ethereum Analysis Report');
  });

  test('updates date range when presets are clicked', async () => {
    render(<NewReport />);
    
    // Wait for cryptocurrencies to load
    await waitFor(() => {
      expect(screen.queryByText(/loading available cryptocurrencies/i)).not.toBeInTheDocument();
    });
    
    // Get date inputs
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);
    
    // Initial values (7 days)
    expect(startDateInput).toHaveValue('2025-04-20');
    expect(endDateInput).toHaveValue('2025-04-27');
    
    // Click 30 days preset
    fireEvent.click(screen.getByText('Last 30 Days'));
    
    // Check if date range updates
    expect(startDateInput).toHaveValue('2025-03-28'); // 30 days ago
    expect(endDateInput).toHaveValue('2025-04-27'); // Still today
    
    // Click 90 days preset
    fireEvent.click(screen.getByText('Last 90 Days'));
    
    // Check if date range updates
    expect(startDateInput).toHaveValue('2025-01-27'); // 90 days ago
    expect(endDateInput).toHaveValue('2025-04-27'); // Still today
    
    // Click 7 days preset
    fireEvent.click(screen.getByText('Last 7 Days'));
    
    // Check if date range updates back to initial values
    expect(startDateInput).toHaveValue('2025-04-20');
    expect(endDateInput).toHaveValue('2025-04-27');
  });

  test('toggles advanced options when clicked', async () => {
    render(<NewReport />);
    
    // Wait for cryptocurrencies to load
    await waitFor(() => {
      expect(screen.queryByText(/loading available cryptocurrencies/i)).not.toBeInTheDocument();
    });
    
    // Advanced options should be hidden initially
    expect(screen.queryByText('Include Platforms')).not.toBeInTheDocument();
    
    // Click advanced options toggle
    fireEvent.click(screen.getByText('Advanced Options'));
    
    // Advanced options should be visible
    expect(screen.getByText('Include Platforms')).toBeInTheDocument();
    expect(screen.getByLabelText('Reddit')).toBeInTheDocument();
    expect(screen.getByLabelText('Twitter')).toBeInTheDocument();
    expect(screen.getByLabelText('YouTube')).toBeInTheDocument();
    
    // Click advanced options toggle again
    fireEvent.click(screen.getByText('Advanced Options'));
    
    // Advanced options should be hidden again
    expect(screen.queryByText('Include Platforms')).not.toBeInTheDocument();
  });

  test('toggles platform selection in advanced options', async () => {
    render(<NewReport />);
    
    // Wait for cryptocurrencies to load
    await waitFor(() => {
      expect(screen.queryByText(/loading available cryptocurrencies/i)).not.toBeInTheDocument();
    });
    
    // Open advanced options
    fireEvent.click(screen.getByText('Advanced Options'));
    
    // All platforms should be checked by default
    expect(screen.getByLabelText('Reddit')).toBeChecked();
    expect(screen.getByLabelText('Twitter')).toBeChecked();
    expect(screen.getByLabelText('YouTube')).toBeChecked();
    
    // Uncheck Reddit
    fireEvent.click(screen.getByLabelText('Reddit'));
    
    // Reddit should be unchecked
    expect(screen.getByLabelText('Reddit')).not.toBeChecked();
    expect(screen.getByLabelText('Twitter')).toBeChecked();
    expect(screen.getByLabelText('YouTube')).toBeChecked();
    
    // Uncheck Twitter
    fireEvent.click(screen.getByLabelText('Twitter'));
    
    // Twitter should be unchecked
    expect(screen.getByLabelText('Reddit')).not.toBeChecked();
    expect(screen.getByLabelText('Twitter')).not.toBeChecked();
    expect(screen.getByLabelText('YouTube')).toBeChecked();
    
    // Check Reddit again
    fireEvent.click(screen.getByLabelText('Reddit'));
    
    // Reddit should be checked again
    expect(screen.getByLabelText('Reddit')).toBeChecked();
    expect(screen.getByLabelText('Twitter')).not.toBeChecked();
    expect(screen.getByLabelText('YouTube')).toBeChecked();
  });

  test('submits report generation with correct parameters', async () => {
    // Mock window.alert
    const mockAlert = jest.fn();
    global.alert = mockAlert;
    
    // Mock console.log to check submission data
    const mockConsoleLog = jest.fn();
    const originalConsoleLog = console.log;
    console.log = mockConsoleLog;
    
    render(<NewReport />);
    
    // Wait for cryptocurrencies to load
    await waitFor(() => {
      expect(screen.queryByText(/loading available cryptocurrencies/i)).not.toBeInTheDocument();
    });
    
    // Change report name
    fireEvent.change(screen.getByLabelText(/report name/i), { target: { value: 'Custom Bitcoin Report' } });
    
    // Change date range
    fireEvent.click(screen.getByText('Last 30 Days'));
    
    // Open advanced options
    fireEvent.click(screen.getByText('Advanced Options'));
    
    // Uncheck Twitter
    fireEvent.click(screen.getByLabelText('Twitter'));
    
    // Click generate report button
    fireEvent.click(screen.getByText('Generate Report'));
    
    // Check if alert was shown
    expect(mockAlert).toHaveBeenCalledWith('Report generation initiated!');
    
    // Check if console.log was called with correct parameters
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Creating report with:',
      expect.objectContaining({
        cryptoId: '1',
        cryptoName: 'Bitcoin',
        reportName: 'Custom Bitcoin Report',
        dateRange: {
          startDate: '2025-03-28',
          endDate: '2025-04-27'
        },
        includePlatforms: {
          reddit: true,
          twitter: false,
          youtube: true
        }
      })
    );
    
    // Restore original functions
    console.log = originalConsoleLog;
  });

  test('handles empty crypto list gracefully', async () => {
    // Mock empty crypto list
    window.api.getCryptos.mockResolvedValue([]);
    
    render(<NewReport />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading available cryptocurrencies/i)).not.toBeInTheDocument();
    });
    
    // Should display dropdown with "No cryptocurrencies available" option
    expect(screen.getByText('No cryptocurrencies available')).toBeInTheDocument();
    
    // Generate Report button should still be present
    expect(screen.getByText('Generate Report')).toBeInTheDocument();
  });
});