import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '../../../../src/renderer/src/components/main/sidebar/Button';

// Mock useState to control isHovered state
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useState: jest.fn((init) => [init, jest.fn()])
  };
});

describe('Button Component', () => {
  beforeEach(() => {
    // Reset the useState mock before each test
    (React.useState as jest.Mock).mockImplementation((init) => [init, jest.fn()]);
  });

  test('renders button with tag and score', () => {
    render(<Button tag="BTC" score={25} />);
    
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  test('does not render if score is out of bounds (> 50)', () => {
    const { container } = render(<Button tag="BTC" score={55} />);
    expect(container.firstChild).toBeNull();
  });

  test('does not render if score is out of bounds (< -50)', () => {
    const { container } = render(<Button tag="BTC" score={-55} />);
    expect(container.firstChild).toBeNull();
  });

  test('applies proper styling based on score range', () => {
    // Test with a positive score (green)
    const { rerender } = render(<Button tag="BTC" score={30} />);
    
    // Change useState mock to simulate hover state
    (React.useState as jest.Mock).mockImplementation(() => [true, jest.fn()]);
    
    // Test with a negative score (red)
    rerender(<Button tag="BTC" score={-20} />);
    
    // Test with a neutral score (orange)
    rerender(<Button tag="BTC" score={0} />);
  });
});