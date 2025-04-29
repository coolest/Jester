import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CryptoList from '../../../../src/renderer/src/components/main/cryptoList/cryptoList';

describe('CryptoList Component', () => {
  const mockCryptos = [
    {
      id: 'crypto-1',
      cryptoName: 'Bitcoin',
      videoLink: 'https://youtube.com/bitcoin',
      subreddit: 'bitcoin',
      hashtag: 'BTC',
      score: 25,
      img: 'bitcoin.png'
    },
    {
      id: 'crypto-2',
      cryptoName: 'Ethereum',
      videoLink: 'https://youtube.com/ethereum',
      subreddit: 'ethereum',
      hashtag: 'ETH',
      score: 15,
      img: 'ethereum.png'
    }
  ];

  beforeEach(() => {
    // Clear any previous mock calls
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

  test('renders crypto list with stored cryptocurrencies', async () => {
    render(<CryptoList />);
    
    // Check if the API was called to get cryptos
    expect(window.api.getCryptos).toHaveBeenCalled();
    
    // Wait for cryptos to be loaded and displayed
    await waitFor(() => {
      expect(screen.getByText(/Stored Cryptocurrencies/)).toBeInTheDocument();
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
    });
  });

  test('displays crypto details correctly', async () => {
    render(<CryptoList />);
    
    // Wait for cryptos to be loaded
    await waitFor(() => {
      // Check if Bitcoin details are displayed
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
      expect(screen.getByText(/Subreddit: r\/bitcoin/i)).toBeInTheDocument();
      expect(screen.getByText(/Twitter Hashtag: BTC/i)).toBeInTheDocument();
      
      // Check if Ethereum details are displayed
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
      expect(screen.getByText(/Subreddit: r\/ethereum/i)).toBeInTheDocument();
      expect(screen.getByText(/Twitter Hashtag: ETH/i)).toBeInTheDocument();
    });
  });

  test('allows editing a crypto', async () => {
    render(<CryptoList />);
    
    // Wait for cryptos to be loaded
    await waitFor(() => {
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });
    
    // Find edit buttons (there should be one for each crypto)
    const editButtons = screen.getAllByText('Edit');
    
    // Click the first edit button
    fireEvent.click(editButtons[0]);
    
    // Check if edit form is displayed
    await waitFor(() => {
      expect(screen.getByText(/Edit Bitcoin/i)).toBeInTheDocument();
    });
    
    // Check if form inputs are pre-filled with crypto data
    const cryptoNameInput = screen.getByLabelText(/Name:/i);
    expect(cryptoNameInput).toHaveValue('Bitcoin');
  });

  test('allows deleting a crypto', async () => {
    const mockOnDelete = jest.fn();
    render(<CryptoList onDelete={mockOnDelete} />);
    
    // Wait for cryptos to be loaded
    await waitFor(() => {
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });
    
    // Find delete buttons
    const deleteButtons = screen.getAllByText('Delete');
    
    // Click the first delete button
    fireEvent.click(deleteButtons[0]);
    
    // Check if API was called to delete crypto
    await waitFor(() => {
      expect(window.api.deleteCrypto).toHaveBeenCalledWith('crypto-1');
    });
    
    // Check if the list was refreshed (getCryptos called again)
    await waitFor(() => {
      expect(window.api.getCryptos).toHaveBeenCalledTimes(2);
    });
    
    // Check if onDelete callback was called
    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalled();
    });
  });
});