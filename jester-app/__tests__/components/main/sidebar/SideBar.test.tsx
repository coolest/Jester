import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SideBar } from '../../../../src/renderer/src/components/main/sidebar/SideBar';

// Mock the Button component
jest.mock('../../../../src/renderer/src/components/main/sidebar/Button', () => {
  return {
    __esModule: true,
    Button: ({ tag, score, img }) => (
      <button className="mock-button" data-tag={tag} data-score={score} data-img={img}>
        {tag} - {score}
      </button>
    )
  };
});

describe('SideBar Component', () => {
  const mockData = [
    { id: '1', tag: 'BTC', score: 25, img: 'btc.png' },
    { id: '2', tag: 'ETH', score: 35, img: 'eth.png' },
  ];
  
  const mockOnItemClick = jest.fn();

  test('renders title and crypto buttons', () => {
    render(<SideBar data={mockData} onItemClick={mockOnItemClick} />);
    
    // Check if title is rendered
    expect(screen.getByText('Cryptos')).toBeInTheDocument();
    
    // Check if buttons are rendered with correct props
    expect(screen.getByText('BTC - 25')).toBeInTheDocument();
    expect(screen.getByText('ETH - 35')).toBeInTheDocument();
  });

  test('calls onItemClick with correct ID when button is clicked', () => {
    render(<SideBar data={mockData} onItemClick={mockOnItemClick} />);
    
    // Click on the first button
    fireEvent.click(screen.getByText('BTC - 25').closest('.button-wrapper'));
    
    // Check if onItemClick was called with correct ID
    expect(mockOnItemClick).toHaveBeenCalledWith('1');
    
    // Click on the second button
    fireEvent.click(screen.getByText('ETH - 35').closest('.button-wrapper'));
    
    // Check if onItemClick was called with correct ID
    expect(mockOnItemClick).toHaveBeenCalledWith('2');
  });

  test('renders empty sidebar when no data is provided', () => {
    render(<SideBar data={[]} onItemClick={mockOnItemClick} />);
    
    // Title should still be present
    expect(screen.getByText('Cryptos')).toBeInTheDocument();
    
    // No buttons should be rendered
    expect(screen.queryByText(/BTC/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ETH/)).not.toBeInTheDocument();
  });

  test('handles undefined onItemClick gracefully', () => {
    // No error should be thrown when onItemClick is not provided
    render(<SideBar data={mockData} />);
    
    // Clicking a button without onItemClick should not cause errors
    fireEvent.click(screen.getByText('BTC - 25').closest('.button-wrapper'));
    
    // Test passes if no error is thrown
  });
});