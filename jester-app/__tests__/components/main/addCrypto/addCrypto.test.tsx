import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddCrypto from '../../../../src/renderer/src/components/main/addCrypto/addCrypto';

describe('AddCrypto Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock API call
    window.api.addCrypto.mockResolvedValue({ success: true });
  });

  test('renders form with all input fields and submit button', () => {
    render(<AddCrypto />);
    
    // Check if title is rendered
    expect(screen.getByText('Add Cryptocurrency')).toBeInTheDocument();
    
    // Check if all input fields are rendered
    expect(screen.getByLabelText(/Cryptocurrency ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/YouTube Video Link/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Subreddit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Twitter\(X\) Hashtag/i)).toBeInTheDocument();
    
    // Check if submit button is rendered
    expect(screen.getByText('Add Cryptocurrency', { selector: 'button' })).toBeInTheDocument();
  });

  test('updates state when input values change', () => {
    render(<AddCrypto />);
    
    // Get input fields
    const cryptoNameInput = screen.getByLabelText(/Cryptocurrency ID/i);
    const videoLinkInput = screen.getByLabelText(/YouTube Video Link/i);
    const subredditInput = screen.getByLabelText(/Subreddit/i);
    const hashtagInput = screen.getByLabelText(/Twitter\(X\) Hashtag/i);
    
    // Change input values
    fireEvent.change(cryptoNameInput, { target: { value: 'BTC' } });
    fireEvent.change(videoLinkInput, { target: { value: 'https://youtube.com/watch?v=123' } });
    fireEvent.change(subredditInput, { target: { value: 'bitcoin' } });
    fireEvent.change(hashtagInput, { target: { value: 'BTC' } });
    
    // Check if input values were updated
    expect(cryptoNameInput).toHaveValue('BTC');
    expect(videoLinkInput).toHaveValue('https://youtube.com/watch?v=123');
    expect(subredditInput).toHaveValue('bitcoin');
    expect(hashtagInput).toHaveValue('BTC');
  });

  test('calls API and clears form on successful submission', async () => {
    const mockOnAdd = jest.fn();
    render(<AddCrypto onAdd={mockOnAdd} />);
    
    // Fill out form
    fireEvent.change(screen.getByLabelText(/Cryptocurrency ID/i), { target: { value: 'BTC' } });
    fireEvent.change(screen.getByLabelText(/YouTube Video Link/i), { target: { value: 'https://youtube.com/watch?v=123' } });
    fireEvent.change(screen.getByLabelText(/Subreddit/i), { target: { value: 'bitcoin' } });
    fireEvent.change(screen.getByLabelText(/Twitter\(X\) Hashtag/i), { target: { value: 'BTC' } });
    
    // Submit form
    fireEvent.click(screen.getByText('Add Cryptocurrency', { selector: 'button' }));
    
    // Check if API was called with correct data
    expect(window.api.addCrypto).toHaveBeenCalledWith({
      cryptoName: 'BTC',
      videoLink: 'https://youtube.com/watch?v=123',
      subreddit: 'bitcoin',
      hashtag: 'BTC',
      score: 0,
      img: 'null'
    });
    
    // Wait for form to be cleared
    await waitFor(() => {
      expect(screen.getByLabelText(/Cryptocurrency ID/i)).toHaveValue('');
      expect(screen.getByLabelText(/YouTube Video Link/i)).toHaveValue('');
      expect(screen.getByLabelText(/Subreddit/i)).toHaveValue('');
      expect(screen.getByLabelText(/Twitter\(X\) Hashtag/i)).toHaveValue('');
    });
    
    // Check if onAdd callback was called
    expect(mockOnAdd).toHaveBeenCalled();
  });

  test('handles API errors gracefully', async () => {
    // Mock console.error to prevent error output in tests
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Mock API call to reject
    window.api.addCrypto.mockRejectedValue(new Error('API Error'));
    
    const mockOnAdd = jest.fn();
    render(<AddCrypto onAdd={mockOnAdd} />);
    
    // Fill out form
    fireEvent.change(screen.getByLabelText(/Cryptocurrency ID/i), { target: { value: 'BTC' } });
    fireEvent.change(screen.getByLabelText(/YouTube Video Link/i), { target: { value: 'https://youtube.com/watch?v=123' } });
    fireEvent.change(screen.getByLabelText(/Subreddit/i), { target: { value: 'bitcoin' } });
    fireEvent.change(screen.getByLabelText(/Twitter\(X\) Hashtag/i), { target: { value: 'BTC' } });
    
    // Submit form
    fireEvent.click(screen.getByText('Add Cryptocurrency', { selector: 'button' }));
    
    // Wait for API call to fail
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
    
    // Form values should remain (not cleared)
    expect(screen.getByLabelText(/Cryptocurrency ID/i)).toHaveValue('BTC');
    
    // onAdd callback should not have been called
    expect(mockOnAdd).not.toHaveBeenCalled();
    
    // Restore console.error
    console.error = originalConsoleError;
  });
});