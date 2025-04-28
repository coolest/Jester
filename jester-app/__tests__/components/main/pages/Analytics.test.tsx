import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Analytics from '../../../../src/renderer/src/components/main/pages/Analytics';

describe('Analytics Component', () => {
  const mockCryptos = [
    { id: '1', cryptoName: 'Bitcoin', subreddit: 'bitcoin', hashtag: 'BTC', score: 65 },
    { id: '2', cryptoName: 'Ethereum', subreddit: 'ethereum', hashtag: 'ETH', score: 55 }
  ];
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock API calls
    window.api.getCryptos.mockResolvedValue(mockCryptos);
  });

  test('renders loading state initially', () => {
    render(<Analytics selectedCryptoId="1" />);
    
    // Check if loading indicator is displayed
    expect(screen.getByText(/loading sentiment data/i)).toBeInTheDocument();
  });

  test('loads and displays crypto data after loading', async () => {
    render(<Analytics selectedCryptoId="1" />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading sentiment data/i)).not.toBeInTheDocument();
    });
    
    // Check if title is displayed
    expect(screen.getByText(/social sentiment analysis/i)).toBeInTheDocument();
    
    // Check if sentiment score is displayed
    expect(screen.getByText(/overall sentiment score/i)).toBeInTheDocument();
    
    // Check if sentiment chart is displayed
    expect(screen.getByText(/sentiment trend/i)).toBeInTheDocument();
    
    // Check if platform data is displayed
    expect(screen.getByText(/sentiment by platform/i)).toBeInTheDocument();
    
    // Check if platform names are displayed in table
    expect(screen.getByText('Reddit')).toBeInTheDocument();
    expect(screen.getByText('Twitter')).toBeInTheDocument();
    expect(screen.getByText('YouTube')).toBeInTheDocument();
  });

  test('uses selected crypto ID to display correct data', async () => {
    render(<Analytics selectedCryptoId="2" />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading sentiment data/i)).not.toBeInTheDocument();
    });
    
    // Check if the data is for Ethereum (the second crypto)
    // Since the mock implementation in setupTests might generate random data,
    // we'll check for the specific subreddit in insights which should be ethereum
    expect(screen.getByText(/r\/ethereum/i)).toBeInTheDocument();
  });

  test('changes timeframe when buttons are clicked', async () => {
    render(<Analytics selectedCryptoId="1" />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading sentiment data/i)).not.toBeInTheDocument();
    });
    
    // Check default timeframe (1W should be active)
    expect(screen.getByText('1W').closest('button')).toHaveClass('active');
    
    // Click 24H button
    fireEvent.click(screen.getByText('24H'));
    
    // Check if 24H is now active
    expect(screen.getByText('24H').closest('button')).toHaveClass('active');
    expect(screen.getByText('1W').closest('button')).not.toHaveClass('active');
    
    // Click 1M button
    fireEvent.click(screen.getByText('1M'));
    
    // Check if 1M is now active
    expect(screen.getByText('1M').closest('button')).toHaveClass('active');
    expect(screen.getByText('24H').closest('button')).not.toHaveClass('active');
    
    // Click 3M button
    fireEvent.click(screen.getByText('3M'));
    
    // Check if 3M is now active
    expect(screen.getByText('3M').closest('button')).toHaveClass('active');
    expect(screen.getByText('1M').closest('button')).not.toHaveClass('active');
  });

  test('updates when selected crypto changes', async () => {
    const { rerender } = render(<Analytics selectedCryptoId="1" />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading sentiment data/i)).not.toBeInTheDocument();
    });
    
    // Check if Bitcoin data is shown
    expect(screen.getByText(/r\/bitcoin/i)).toBeInTheDocument();
    
    // Change selected crypto
    rerender(<Analytics selectedCryptoId="2" />);
    
    // Should show loading again briefly
    expect(screen.getByText(/loading sentiment data/i)).toBeInTheDocument();
    
    // Wait for loading to complete again
    await waitFor(() => {
      expect(screen.queryByText(/loading sentiment data/i)).not.toBeInTheDocument();
    });
    
    // Check if Ethereum data is shown
    expect(screen.getByText(/r\/ethereum/i)).toBeInTheDocument();
  });

  test('navigates to new report page when add button is clicked', async () => {
    const mockNavigate = jest.fn();
    render(<Analytics selectedCryptoId="1" onNavigate={mockNavigate} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading sentiment data/i)).not.toBeInTheDocument();
    });
    
    // Find the add button (Plus icon) and click it
    const addButton = screen.getByTitle('Create new analysis');
    fireEvent.click(addButton);
    
    // Check if navigation was called with correct route
    expect(mockNavigate).toHaveBeenCalledWith('newReport');
  });

  test('handles empty crypto list gracefully', async () => {
    // Mock empty crypto list
    window.api.getCryptos.mockResolvedValue([]);
    
    render(<Analytics selectedCryptoId="" />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading sentiment data/i)).not.toBeInTheDocument();
    });
    
    // Should display dropdown with "No cryptocurrencies added" option
    expect(screen.getByText('No cryptocurrencies added')).toBeInTheDocument();
  });

  test('calculates sentiment class correctly based on score', async () => {
    render(<Analytics selectedCryptoId="1" />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading sentiment data/i)).not.toBeInTheDocument();
    });
    
    // Check the sentiment score element
    const scoreElement = screen.getByText('65', { selector: '.sentiment-score' });
    
    // Bitcoin has a score of 65, which should be in the "positive" range
    expect(scoreElement).toHaveClass('positive');
    expect(screen.getByText('Positive')).toBeInTheDocument(); // Label text
  });
});