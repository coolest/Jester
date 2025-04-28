import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CryptoList from '../../../../src/renderer/src/components/main/cryptoList/cryptoList';

describe('CryptoList Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock API calls
    window.api.getCryptos.mockResolvedValue([
      { id: '1', cryptoName: 'Bitcoin', subreddit: 'bitcoin', hashtag: 'BTC', videoLink: 'https://youtube.com/v1', score: 70 },
      { id: '2', cryptoName: 'Ethereum', subreddit: 'ethereum', hashtag: 'ETH', videoLink: 'https://youtube.com/v2', score: 60 }
    ]);
    window.api.deleteCrypto.mockResolvedValue({ success: true });
  });

  test('renders cryptocurrency list with data from API', async () => {
    render(<CryptoList />);
    
    // Check if component is loading
    await waitFor(() => {
      // Check title with count of cryptocurrencies
      expect(screen.getByText('Stored Cryptocurrencies (2)')).toBeInTheDocument();
      
      // Check if crypto items are rendered
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
      
      // Check if subreddit, hashtag, and video links are displayed
      expect(screen.getByText('Subreddit: r/bitcoin')).toBeInTheDocument();
      expect(screen.getByText('Twitter Hashtag: BTC')).toBeInTheDocument();
      expect(screen.getByText('YouTube Link: https://youtube.com/v1')).toBeInTheDocument();
      
      expect(screen.getByText('Subreddit: r/ethereum')).toBeInTheDocument();
      expect(screen.getByText('Twitter Hashtag: ETH')).toBeInTheDocument();
      expect(screen.getByText('YouTube Link: https://youtube.com/v2')).toBeInTheDocument();
    });
  });

  test('deletes crypto when delete button is clicked', async () => {
    const mockOnDelete = jest.fn();
    render(<CryptoList onDelete={mockOnDelete} />);
    
    // Wait for list to load
    await waitFor(() => {
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });
    
    // Find delete buttons and click the first one
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    // Check if API was called with correct ID
    expect(window.api.deleteCrypto).toHaveBeenCalledWith('1');
    
    // Check if onDelete callback was called
    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalled();
    });
  });

  test('handles edit mode for cryptocurrency', async () => {
    render(<CryptoList />);
    
    // Wait for list to load
    await waitFor(() => {
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });
    
    // Find edit buttons and click the first one
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    // Check if edit form is displayed
    expect(screen.getByText('Edit Bitcoin')).toBeInTheDocument();
    
    // Check if form fields are prefilled with crypto data
    expect(screen.getByLabelText('Name:').value).toBe('Bitcoin');
    expect(screen.getByLabelText('Subreddit:').value).toBe('bitcoin');
    expect(screen.getByLabelText('Twitter Hashtag:').value).toBe('BTC');
    expect(screen.getByLabelText('YouTube Link:').value).toBe('https://youtube.com/v1');
    
    // Modify a field
    fireEvent.change(screen.getByLabelText('Subreddit:'), { target: { value: 'btc' } });
    
    // Submit the edit form
    fireEvent.click(screen.getByText('Save'));
    
    // Check if API calls were made correctly (delete then add)
    expect(window.api.deleteCrypto).toHaveBeenCalledWith('1');
    await waitFor(() => {
      expect(window.api.addCrypto).toHaveBeenCalledWith(expect.objectContaining({
        id: '1',
        cryptoName: 'Bitcoin',
        subreddit: 'btc', // Updated value
        hashtag: 'BTC',
        videoLink: 'https://youtube.com/v1'
      }));
    });
  });

  test('cancels edit mode without saving', async () => {
    render(<CryptoList />);
    
    // Wait for list to load
    await waitFor(() => {
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });
    
    // Find edit buttons and click the first one
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    // Check if edit form is displayed
    expect(screen.getByText('Edit Bitcoin')).toBeInTheDocument();
    
    // Click cancel button
    fireEvent.click(screen.getByText('Cancel'));
    
    // Check if edit form is no longer displayed
    expect(screen.queryByText('Edit Bitcoin')).not.toBeInTheDocument();
    
    // Check that no API calls were made
    expect(window.api.deleteCrypto).not.toHaveBeenCalled();
    expect(window.api.addCrypto).not.toHaveBeenCalled();
  });
  test('handles loading state correctly', async () => {
    // Mock the API to delay response to show loading state
    window.api.getCryptos.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve([
        { id: '1', cryptoName: 'Bitcoin', subreddit: 'bitcoin', hashtag: 'BTC', videoLink: 'https://youtube.com/v1', score: 70 },
        { id: '2', cryptoName: 'Ethereum', subreddit: 'ethereum', hashtag: 'ETH', videoLink: 'https://youtube.com/v2', score: 60 }
      ]), 100))
    );
    
    render(<CryptoList />);
    
    // Initially, there should be no crypto items yet
    expect(screen.queryByText('Bitcoin')).not.toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });
  });

  test('handles empty list of cryptocurrencies', async () => {
    // Mock API to return empty array
    window.api.getCryptos.mockResolvedValueOnce([]);
    
    render(<CryptoList />);
    
    // Wait for component to load
    await waitFor(() => {
      // Should show empty state or zero count
      expect(screen.getByText('Stored Cryptocurrencies (0)')).toBeInTheDocument();
    });
    
    // No crypto items should be displayed
    expect(screen.queryByText('Bitcoin')).not.toBeInTheDocument();
    expect(screen.queryByText('Ethereum')).not.toBeInTheDocument();
  });

  test('handles API error when fetching cryptos', async () => {
    // Mock console.error to prevent error output in tests
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Mock API to reject
    window.api.getCryptos.mockRejectedValueOnce(new Error('Failed to fetch cryptocurrencies'));
    
    render(<CryptoList />);
    
    // Wait for component to attempt loading
    await waitFor(() => {
      // Should log the error
      expect(console.error).toHaveBeenCalled();
    });
    
    // Restore console.error
    console.error = originalConsoleError;
  });

  test('correctly updates list after editing a cryptocurrency', async () => {
    // Mock API responses for edit flow
    window.api.deleteCrypto.mockResolvedValueOnce({ success: true });
    window.api.addCrypto.mockResolvedValueOnce({ success: true });
    
    // Second getCryptos call should return updated data
    window.api.getCryptos
      .mockResolvedValueOnce([
        { id: '1', cryptoName: 'Bitcoin', subreddit: 'bitcoin', hashtag: 'BTC', videoLink: 'https://youtube.com/v1', score: 70 },
        { id: '2', cryptoName: 'Ethereum', subreddit: 'ethereum', hashtag: 'ETH', videoLink: 'https://youtube.com/v2', score: 60 }
      ])
      .mockResolvedValueOnce([
        { id: '1', cryptoName: 'Bitcoin', subreddit: 'btc', hashtag: 'BTC', videoLink: 'https://youtube.com/v1', score: 70 },
        { id: '2', cryptoName: 'Ethereum', subreddit: 'ethereum', hashtag: 'ETH', videoLink: 'https://youtube.com/v2', score: 60 }
      ]);
    
    const mockOnDelete = jest.fn();
    render(<CryptoList onDelete={mockOnDelete} />);
    
    // Wait for list to load
    await waitFor(() => {
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });
    
    // Verify initial state
    expect(screen.getByText('Subreddit: r/bitcoin')).toBeInTheDocument();
    
    // Find edit buttons and click the first one
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    // Modify the subreddit field
    fireEvent.change(screen.getByLabelText('Subreddit:'), { target: { value: 'btc' } });
    
    // Submit the edit form
    fireEvent.click(screen.getByText('Save'));
    
    // Callback should be triggered after successful edit
    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalled();
    });
    
    // Refetch the list to verify update
    await waitFor(() => {
      expect(screen.getByText('Subreddit: r/btc')).toBeInTheDocument();
    });
  });

  test('validates edit form before submission', async () => {
    render(<CryptoList />);
    
    // Wait for list to load
    await waitFor(() => {
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });
    
    // Find edit buttons and click the first one
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    // Clear required fields
    fireEvent.change(screen.getByLabelText('Name:'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Subreddit:'), { target: { value: '' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Save'));
    
    // API should not be called if validation fails
    expect(window.api.deleteCrypto).not.toHaveBeenCalled();
    expect(window.api.addCrypto).not.toHaveBeenCalled();
    
    // Form should still be in edit mode
    expect(screen.getByText('Edit Bitcoin')).toBeInTheDocument();
  });

  test('handles API error during cryptocurrency deletion', async () => {
    // Mock console.error to prevent error output in tests
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Mock API to reject
    window.api.deleteCrypto.mockRejectedValueOnce(new Error('Failed to delete cryptocurrency'));
    
    render(<CryptoList />);
    
    // Wait for list to load
    await waitFor(() => {
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });
    
    // Find delete buttons and click the first one
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    // Wait for error to be caught
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
    
    // Restore console.error
    console.error = originalConsoleError;
  });
});
