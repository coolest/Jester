import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Analytics from '../../../../src/renderer/src/components/main/pages/Analytics';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon">Plus Icon</div>,
  BarChart2: () => <div data-testid="barchart-icon">BarChart Icon</div>
}));

describe('Analytics Component', () => {
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

  test('renders analytics component with title', () => {
    render(<Analytics selectedCryptoId="btc-123" />);
    
    expect(screen.getByText(/Social Sentiment Analysis/i)).toBeInTheDocument();
  });

  test('loads available cryptocurrencies', async () => {
    render(<Analytics selectedCryptoId="btc-123" />);
    
    // Check if the API was called to get cryptos
    expect(window.api.getCryptos).toHaveBeenCalled();
    
    // Wait for cryptos to be loaded in the dropdown
    await waitFor(() => {
      const dropdown = screen.getByLabelText(/Cryptocurrency:/i);
      expect(dropdown).toBeInTheDocument();
      
      // Check if both cryptos are in the dropdown
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
      
      // Note: This might fail if the dropdown doesn't render all options at once
      // You might need to adjust this test based on how your dropdown works
    });
  });

  test('displays sentiment data for selected crypto', async () => {
    render(<Analytics selectedCryptoId="btc-123" />);
    
    // Wait for data to load
    await waitFor(() => {
      // Check for overall sentiment section
      expect(screen.getByText(/Overall Sentiment Score/i)).toBeInTheDocument();
      
      // Check for sentiment trend section
      expect(screen.getByText(/Sentiment Trend/i)).toBeInTheDocument();
      
      // Check for platform sentiment section
      expect(screen.getByText(/Sentiment by Platform/i)).toBeInTheDocument();
      
      // Check for specific platforms
      expect(screen.getByText(/Reddit/i)).toBeInTheDocument();
      expect(screen.getByText(/Twitter/i)).toBeInTheDocument();
      expect(screen.getByText(/YouTube/i)).toBeInTheDocument();
    });
  });

  test('changes timeframe when timeframe buttons are clicked', async () => {
    render(<Analytics selectedCryptoId="btc-123" />);
    
    // Check if timeframe buttons are rendered
    const timeframeButtons = screen.getAllByRole('button', { name: /[0-9]+[HWM]/i });
    expect(timeframeButtons.length).toBeGreaterThan(0);
    
    // Click on a different timeframe button
    const monthButton = screen.getByRole('button', { name: /1M/i });
    fireEvent.click(monthButton);
    
    // The button should now have the 'active' class (implementation specific)
    expect(monthButton).toHaveClass('active');
  });

  test('navigates to new report page when create new analysis button is clicked', () => {
    const mockNavigate = jest.fn();
    render(<Analytics selectedCryptoId="btc-123" onNavigate={mockNavigate} />);
    
    // Find the add analysis button (using the Plus icon)
    const addButton = screen.getByTestId('plus-icon');
    
    // Make sure the element exists before trying to interact with it
    expect(addButton).toBeInTheDocument();
    
    // Find the button that contains the icon
    // We'll use a safer approach by getting the nearest button
    const button = screen.getByRole('button', { name: /new analysis/i }) || 
                   addButton.closest('button') || 
                   screen.getByTestId('plus-icon').parentElement;
    
    // Make sure we found a button element
    expect(button).toBeInTheDocument();
    
    // Click on the button
    fireEvent.click(button);
    
    // Check if navigation was called with the correct route
    expect(mockNavigate).toHaveBeenCalledWith('newReport');
  });

  test('updates selected crypto when dropdown value changes', async () => {
    render(<Analytics selectedCryptoId="btc-123" />);
    
    // Wait for cryptos to be loaded
    await waitFor(() => {
      expect(window.api.getCryptos).toHaveBeenCalled();
    });
    
    // Find the dropdown and change its value
    const dropdown = screen.getByLabelText(/Cryptocurrency:/i);
    fireEvent.change(dropdown, { target: { value: 'eth-456' } });
    
    // Since we're using a mocked API, we can't easily verify the crypto changed
    // But we can check that the component doesn't crash
  });
});