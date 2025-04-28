import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Main } from '../../../src/renderer/src/components/main';

// Mock the child components to simplify testing
jest.mock('../../../src/renderer/src/components/main/header/NavBar', () => {
  return {
    __esModule: true,
    default: ({ onNavigate }) => (
      <div data-testid="navbar">
        <button onClick={() => onNavigate('dashboard')}>Dashboard</button>
        <button onClick={() => onNavigate('analytics')}>Analytics</button>
        <button onClick={() => onNavigate('settings')}>Settings</button>
        <button onClick={() => onNavigate('newReport')}>New Report</button>
      </div>
    )
  };
});

jest.mock('../../../src/renderer/src/components/main/sidebar/SideBar', () => {
  return {
    __esModule: true,
    SideBar: ({ data, onItemClick }) => (
      <div data-testid="sidebar">
        {data.map(item => (
          <button 
            key={item.id} 
            onClick={() => onItemClick(item.id)}
            data-testid={`sidebar-item-${item.id}`}
          >
            {item.tag}
          </button>
        ))}
      </div>
    )
  };
});

jest.mock('../../../src/renderer/src/components/main/addCrypto/addCrypto', () => {
  return {
    __esModule: true,
    default: ({ onAdd }) => (
      <div data-testid="add-crypto">
        <button onClick={onAdd}>Add Crypto</button>
      </div>
    )
  };
});

jest.mock('../../../src/renderer/src/components/main/cryptoList/cryptoList', () => {
  return {
    __esModule: true,
    default: ({ onDelete }) => (
      <div data-testid="crypto-list">
        <button onClick={onDelete}>Delete Crypto</button>
      </div>
    )
  };
});

jest.mock('../../../src/renderer/src/components/main/pages/Dashboard', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="dashboard">Dashboard Page</div>
  };
});

jest.mock('../../../src/renderer/src/components/main/pages/Analytics', () => {
  return {
    __esModule: true,
    default: ({ selectedCryptoId, onNavigate }) => (
      <div data-testid="analytics">
        Analytics Page for {selectedCryptoId}
        <button onClick={() => onNavigate('newReport')}>Create Report</button>
      </div>
    )
  };
});

jest.mock('../../../src/renderer/src/components/main/pages/Settings', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="settings">Settings Page</div>
  };
});

jest.mock('../../../src/renderer/src/components/main/pages/newReport', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="new-report">New Report Page</div>
  };
});

describe('Main Component', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    
    // Reset mockCryptoData to default test data
    global.mockCryptoData = [
      { id: '1', cryptoName: 'Bitcoin', tag: 'BTC', score: 65, img: 'null' },
      { id: '2', cryptoName: 'Ethereum', tag: 'ETH', score: 55, img: 'null' },
    ];
    
    // Setup API mock
    window.api.getCryptos.mockResolvedValue(global.mockCryptoData);
  });

  test('renders the main layout with navbar and sidebar', async () => {
    render(<Main />);
    
    // Check navbar and sidebar are rendered
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });
    
    // Default page should be dashboard with add-crypto and crypto-list
    expect(screen.getByTestId('add-crypto')).toBeInTheDocument();
    expect(screen.getByTestId('crypto-list')).toBeInTheDocument();
  });

  test('navigates between pages when navbar links are clicked', async () => {
    render(<Main />);
    
    await waitFor(() => {
      expect(screen.getByTestId('add-crypto')).toBeInTheDocument();
    });
    
    // Click analytics link
    fireEvent.click(screen.getByText('Analytics'));
    expect(screen.getByTestId('analytics')).toBeInTheDocument();
    expect(screen.queryByTestId('add-crypto')).not.toBeInTheDocument();
    
    // Click settings link
    fireEvent.click(screen.getByText('Settings'));
    expect(screen.getByTestId('settings')).toBeInTheDocument();
    expect(screen.queryByTestId('analytics')).not.toBeInTheDocument();
    
    // Click new report link
    fireEvent.click(screen.getByText('New Report'));
    expect(screen.getByTestId('new-report')).toBeInTheDocument();
    expect(screen.queryByTestId('settings')).not.toBeInTheDocument();
    
    // Click dashboard link
    fireEvent.click(screen.getByText('Dashboard'));
    expect(screen.getByTestId('add-crypto')).toBeInTheDocument();
    expect(screen.getByTestId('crypto-list')).toBeInTheDocument();
    expect(screen.queryByTestId('new-report')).not.toBeInTheDocument();
  });

  test('loads sidebar data and selects first crypto by default', async () => {
    render(<Main />);
    
    // Wait for sidebar items to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('sidebar-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-item-2')).toBeInTheDocument();
    });
    
    // Check getCryptos was called
    expect(window.api.getCryptos).toHaveBeenCalled();
    
    // Navigate to Analytics to see the selected crypto
    fireEvent.click(screen.getByText('Analytics'));
    
    // Should display analytics for the first crypto (Bitcoin)
    expect(screen.getByText(/Analytics Page for 1/)).toBeInTheDocument();
  });

  test('changes selected crypto when sidebar item is clicked', async () => {
    render(<Main />);
    
    // Wait for sidebar items to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('sidebar-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-item-2')).toBeInTheDocument();
    });
    
    // Navigate to Analytics
    fireEvent.click(screen.getByText('Analytics'));
    
    // Click second crypto in sidebar
    fireEvent.click(screen.getByTestId('sidebar-item-2'));
    
    // Should update the selected crypto
    expect(screen.getByText(/Analytics Page for 2/)).toBeInTheDocument();
  });

  test('refreshes crypto data when add/delete operations occur', async () => {
    render(<Main />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('sidebar-item-1')).toBeInTheDocument();
    });
    
    // Initial call count
    const initialCallCount = window.api.getCryptos.mock.calls.length;
    
    // Trigger add crypto
    fireEvent.click(screen.getByText('Add Crypto'));
    
    // Should call getCryptos again to refresh data
    await waitFor(() => {
      expect(window.api.getCryptos.mock.calls.length).toBe(initialCallCount + 1);
    });
    
    // Trigger delete crypto
    fireEvent.click(screen.getByText('Delete Crypto'));
    
    // Should call getCryptos again
    await waitFor(() => {
      expect(window.api.getCryptos.mock.calls.length).toBe(initialCallCount + 2);
    });
  });
});