import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Analytics from '../../../../src/renderer/src/components/main/pages/Analytics';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon">Plus Icon</div>,
  RefreshCw: () => <div data-testid="refresh-icon">Refresh Icon</div>,
  AlertTriangle: () => <div data-testid="alert-icon">Alert Icon</div>
}));

// Mock recharts (LineChart and dependencies)
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  CartesianGrid: () => <div>CartesianGrid</div>,
  XAxis: () => <div>X-Axis</div>,
  YAxis: () => <div>Y-Axis</div>,
  Tooltip: () => <div>Tooltip</div>,
  Legend: () => <div>Legend</div>,
  Line: () => <div>Line</div>
}));

const mockCryptos = [
  {
    id: 'btc-123',
    cryptoName: 'Bitcoin',
    videoLink: 'https://youtube.com/bitcoin',
    subreddit: 'bitcoin',
    hashtag: 'BTC',
    score: 25,
    img: 'bitcoin.png'
  }
];

const mockReports = [
  {
    id: 'report-1',
    cryptoId: 'btc-123',
    cryptoName: 'Bitcoin',
    reportName: 'Bitcoin Report',
    timeRange: { startDate: '1714500000', endDate: '1714600000' },
    platforms: { reddit: true, twitter: true, youtube: true },
    status: 'completed',
    resultFilePath: '',
    createdAt: new Date().toISOString()
  }
];

const mockResultData = [
  { timestamp: 1714500000, reddit: 70, twitter: 60, youtube: 80 },
  { timestamp: 1714600000, reddit: 75, twitter: 65, youtube: 85 }
];

describe('Analytics Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    window.api = {
      addCrypto: jest.fn(),
      getCryptos: jest.fn().mockResolvedValue(mockCryptos),
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
      getAllReports: jest.fn().mockResolvedValue({ success: true, reports: mockReports }),
      getReportById: jest.fn().mockResolvedValue({ success: true, resultData: mockResultData }),
      createReport: jest.fn(),
    };
  });

  test('renders analytics page and loads cryptos', async () => {
    render(<Analytics selectedCryptoId="btc-123" />);

    await waitFor(() => {
      expect(window.api.getCryptos).toHaveBeenCalled();
    });

    expect(screen.getByText('Social Sentiment Analysis')).toBeInTheDocument();
    expect(screen.getByLabelText('Cryptocurrency:')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bitcoin' })).toBeInTheDocument();
  });

  test('shows loading indicator initially', async () => {
    render(<Analytics selectedCryptoId="btc-123" />);

    expect(screen.getByText('Loading sentiment data...')).toBeInTheDocument();
  });

  test('loads and displays recent report data', async () => {
    render(<Analytics selectedCryptoId="btc-123" />);

    await waitFor(() => {
      expect(window.api.getAllReports).toHaveBeenCalled();
    });

    expect(screen.getByText('Bitcoin Report')).toBeInTheDocument();
    expect(screen.getByText('Sentiment Trends')).toBeInTheDocument();
    expect(screen.getByText('Platform Sentiment')).toBeInTheDocument();
  });

  test('shows no report message if no data is available', async () => {
    window.api.getAllReports = jest.fn().mockResolvedValue({ success: true, reports: [] });

    render(<Analytics selectedCryptoId="btc-123" />);

    await waitFor(() => {
      expect(window.api.getAllReports).toHaveBeenCalled();
    });

    expect(screen.getByText('No sentiment analysis available for Bitcoin')).toBeInTheDocument();
  });

  test('handles errors during crypto loading', async () => {
    window.api.getCryptos = jest.fn().mockRejectedValue(new Error('Failed to load'));

    render(<Analytics selectedCryptoId="btc-123" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load cryptocurrencies. Please try again.')).toBeInTheDocument();
    });
  });

  test('handles errors during report loading', async () => {
    window.api.getAllReports = jest.fn().mockRejectedValue(new Error('Failed to load reports'));

    render(<Analytics selectedCryptoId="btc-123" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load reports. Please try again.')).toBeInTheDocument();
    });
  });

  test('allows creating new analysis', async () => {
    const navigateMock = jest.fn();
    render(<Analytics selectedCryptoId="btc-123" onNavigate={navigateMock} />);

    const createButton = await screen.findByTitle('Create new analysis');
    fireEvent.click(createButton);

    expect(navigateMock).toHaveBeenCalledWith('newReport');
  });

  test('allows viewing past analysis', async () => {
    const navigateMock = jest.fn();
    render(<Analytics selectedCryptoId="btc-123" onNavigate={navigateMock} />);

    const pastButton = await screen.findByTitle('View past analysis');
    fireEvent.click(pastButton);

    expect(navigateMock).toHaveBeenCalledWith('reports', { cryptoId: 'btc-123' });
  });
});
