import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AddCrypto from '../../../../src/renderer/src/components/main/addCrypto/addCrypto'; // <-- fix the path!

// Fix window.api typing
declare global {
  interface Window {
    api: any;
  }
}

describe('AddCrypto Component', () => {
  beforeEach(() => {
    window.api = {
      addCrypto: jest.fn().mockResolvedValue({}),
      getCryptos: jest.fn(),
      deleteCrypto: jest.fn(),
      getSettings: jest.fn(),
      saveSettings: jest.fn(),
      getEnvVariables: jest.fn(),
      updateEnvFile: jest.fn(),
      saveDbAuthFile: jest.fn(),
      checkDbAuthExists: jest.fn(),
      testRedditConnection: jest.fn(),
      testTwitterConnection: jest.fn(),
      testYoutubeConnection: jest.fn(),
      testDatabaseConnection: jest.fn(),
      createAnalysis: jest.fn(),
      getReports: jest.fn(),
      getReportLog: jest.fn(),
    };
  });

  it('renders and submits correctly', async () => {
    render(<AddCrypto />);

    fireEvent.change(screen.getByLabelText(/Cryptocurrency ID/i), { target: { value: 'ETH' } });
    fireEvent.change(screen.getByLabelText(/YouTube Video Link/i), { target: { value: 'https://youtube.com/test' } });
    fireEvent.change(screen.getByLabelText(/Subreddit/i), { target: { value: 'ethereum' } });
    fireEvent.change(screen.getByLabelText(/Twitter\(X\) Hashtag/i), { target: { value: 'ethereum' } });

    fireEvent.click(screen.getByRole('button', { name: /Add Cryptocurrency/i }));

    expect(window.api.addCrypto).toHaveBeenCalledTimes(1);
    expect(window.api.addCrypto).toHaveBeenCalledWith({
      cryptoName: 'ETH',
      videoLink: 'https://youtube.com/test',
      subreddit: 'ethereum',
      hashtag: 'ethereum',
      score: 0,
      img: 'null'
    });
  });
});
