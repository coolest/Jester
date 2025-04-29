import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SideBar } from '../../../../src/renderer/src/components/main/sidebar/SideBar';

// Mock the Button component used in SideBar
jest.mock('../../../../src/renderer/src/components/main/sidebar/Button', () => ({
  Button: ({ tag, score }: { tag: string; score: number }) => (
    <div data-testid="sidebar-button">
      <span>{tag}</span>
      <span>{score}</span>
    </div>
  )
}));

describe('SideBar Component', () => {
  const mockData = [
    { id: 'crypto-1', tag: 'BTC', score: 25, img: 'btc.png' },
    { id: 'crypto-2', tag: 'ETH', score: 15, img: 'eth.png' },
    { id: 'crypto-3', tag: 'SOL', score: 35, img: 'sol.png' }
  ];

  test('renders sidebar with title', () => {
    render(<SideBar data={[]} />);
    
    // Check for the title
    expect(screen.getByText('Cryptos')).toBeInTheDocument();
  });

  test('renders buttons for each item in data', () => {
    render(<SideBar data={mockData} />);
    
    // We should have 3 sidebar buttons
    const buttons = screen.getAllByTestId('sidebar-button');
    expect(buttons).toHaveLength(3);
    
    // Check if all cryptos are rendered
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.getByText('SOL')).toBeInTheDocument();
  });

  test('calls onItemClick when a button is clicked', () => {
    const mockOnItemClick = jest.fn();
    render(<SideBar data={mockData} onItemClick={mockOnItemClick} />);
    
    // Find the first button's wrapper and click it
    const buttonWrappers = screen.getAllByTestId('sidebar-button');
    fireEvent.click(buttonWrappers[0]);
    
    // Check if onItemClick was called with the correct ID
    expect(mockOnItemClick).toHaveBeenCalledWith('crypto-1');
  });

  test('handles empty data', () => {
    render(<SideBar data={[]} />);
    
    // There should be no buttons rendered
    const buttons = screen.queryAllByTestId('sidebar-button');
    expect(buttons).toHaveLength(0);
  });
});