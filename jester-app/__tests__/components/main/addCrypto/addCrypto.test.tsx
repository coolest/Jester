import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddCrypto from '../../../../src/renderer/src/components/main/addCrypto/addCrypto';

describe('AddCrypto Component', () => {
  beforeEach(() => {
    // Clear any previous mock calls
    jest.clearAllMocks();
    
    // Ensure window.api exists and has necessary methods
    if (!window.api) {
      window.api = {
        addCrypto: jest.fn().mockResolvedValue({}),
        getCryptos: jest.fn().mockResolvedValue([]),
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
    } else {
      // Reset the mock if it already exists
      window.api.addCrypto = jest.fn().mockResolvedValue({});
    }
  });

  test('renders form elements correctly', () => {
    render(<AddCrypto />);
    
    // Check for the title
    expect(screen.getByText('Add Cryptocurrency')).toBeInTheDocument();
    
    // Check for form inputs
    expect(screen.getByLabelText(/Cryptocurrency ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/YouTube Video Link/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Subreddit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Twitter\(X\) Hashtag/i)).toBeInTheDocument();
    
    // Check for the submit button
    expect(screen.getByRole('button', { name: /Add Cryptocurrency/i })).toBeInTheDocument();
  });

  test('allows input values to be updated', () => {
    render(<AddCrypto />);
    
    // Get input elements
    const cryptoNameInput = screen.getByLabelText(/Cryptocurrency ID/i);
    const videoLinkInput = screen.getByLabelText(/YouTube Video Link/i);
    const subredditInput = screen.getByLabelText(/Subreddit/i);
    const hashtagInput = screen.getByLabelText(/Twitter\(X\) Hashtag/i);
    
    // Set input values
    fireEvent.change(cryptoNameInput, { target: { value: 'ETH' } });
    fireEvent.change(videoLinkInput, { target: { value: 'https://youtube.com/test' } });
    fireEvent.change(subredditInput, { target: { value: 'ethereum' } });
    fireEvent.change(hashtagInput, { target: { value: 'ethereum' } });
    
    // Check if input values are updated
    expect(cryptoNameInput).toHaveValue('ETH');
    expect(videoLinkInput).toHaveValue('https://youtube.com/test');
    expect(subredditInput).toHaveValue('ethereum');
    expect(hashtagInput).toHaveValue('ethereum');
  });

  test('calls addCrypto API when form is submitted', async () => {
    const mockOnAdd = jest.fn();
    
    render(<AddCrypto onAdd={mockOnAdd} />);
    
    // Set input values
    fireEvent.change(screen.getByLabelText(/Cryptocurrency ID/i), { target: { value: 'ETH' } });
    fireEvent.change(screen.getByLabelText(/YouTube Video Link/i), { target: { value: 'https://youtube.com/test' } });
    fireEvent.change(screen.getByLabelText(/Subreddit/i), { target: { value: 'ethereum' } });
    fireEvent.change(screen.getByLabelText(/Twitter\(X\) Hashtag/i), { target: { value: 'ethereum' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Add Cryptocurrency/i }));
    
    // Check if API was called with the correct data
    await waitFor(() => {
      expect(window.api.addCrypto).toHaveBeenCalledWith({
        cryptoName: 'ETH',
        videoLink: 'https://youtube.com/test',
        subreddit: 'ethereum',
        hashtag: 'ethereum',
        score: 0,
        img: 'null'
      });
    });
    
    // Check if onAdd callback was called
    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalled();
    });
  });
});