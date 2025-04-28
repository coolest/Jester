import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../../../src/renderer/src/components/main/sidebar/Button';

describe('Button Component', () => {
  // Valid Props
  const validProps = {
    tag: 'BTC',
    score: 25,
    img: 'btc.png'
  };

  // Edge case props
  const highScoreProps = {
    tag: 'SOL',
    score: 49, // Just below threshold
    img: 'sol.png'
  };

  const lowScoreProps = {
    tag: 'XRP',
    score: -49, // Just above threshold
    img: 'xrp.png'
  };

  const boundaryScoreProps = {
    tag: 'ETH',
    score: 50, // At threshold
    img: 'eth.png'
  };

  const negBoundaryScoreProps = {
    tag: 'DOGE',
    score: -50, // At negative threshold
    img: 'doge.png'
  };

  test('renders correctly with normal props', () => {
    render(<Button {...validProps} />);
    
    // Check if tag is rendered
    expect(screen.getByText('BTC')).toBeInTheDocument();
    
    // Check if score is rendered
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  test('applies different text colors based on score', () => {
    const { rerender } = render(<Button tag="TEST" score={-20} />);
    
    // With score of -20, color should be red (according to getTextColor function)
    let scoreElement = screen.getByText('-20');
    
    // Simulate hover to trigger color change
    fireEvent.mouseEnter(screen.getByRole('button'));
    
    // Check the color using computed style (implementation dependent, may need adjusting)
    expect(window.getComputedStyle(scoreElement).color).toBe('var(--red)');
    
    // Rerender with different score
    rerender(<Button tag="TEST" score={10} />);
    scoreElement = screen.getByText('10');
    
    // Simulate hover
    fireEvent.mouseEnter(screen.getByRole('button'));
    
    // With score of 10, color should be orange
    expect(window.getComputedStyle(scoreElement).color).toBe('var(--orange)');
    
    // Rerender with high score
    rerender(<Button tag="TEST" score={30} />);
    scoreElement = screen.getByText('30');
    
    // Simulate hover
    fireEvent.mouseEnter(screen.getByRole('button'));
    
    // With score of 30, color should be green
    expect(window.getComputedStyle(scoreElement).color).toBe('var(--green)');
  });

  test('handles hover state correctly', () => {
    render(<Button {...validProps} />);
    
    const scoreElement = screen.getByText('25');
    
    // Before hover, score should have default color
    expect(window.getComputedStyle(scoreElement).color).toBe('var(--white-soft)');
    
    // Simulate hover
    fireEvent.mouseEnter(screen.getByRole('button'));
    
    // During hover, score should have color based on sentiment
    expect(window.getComputedStyle(scoreElement).color).not.toBe('var(--white-soft)');
    
    // Simulate hover end
    fireEvent.mouseLeave(screen.getByRole('button'));
    
    // After hover ends, score should return to default color
    expect(window.getComputedStyle(scoreElement).color).toBe('var(--white-soft)');
  });

  test('does not render when score is outside bounds', () => {
    // With score of 51 (above threshold), nothing should render
    const { container: container1 } = render(<Button tag="TEST" score={51} />);
    expect(container1.firstChild).toBeNull();
    
    // With score of -51 (below threshold), nothing should render
    const { container: container2 } = render(<Button tag="TEST" score={-51} />);
    expect(container2.firstChild).toBeNull();
  });

  test('renders with boundary score values', () => {
    // With score of 50 (at threshold), should not render
    const { container: container1 } = render(<Button {...boundaryScoreProps} />);
    expect(container1.firstChild).toBeNull();
    
    // With score of -50 (at negative threshold), should not render
    const { container: container2 } = render(<Button {...negBoundaryScoreProps} />);
    expect(container2.firstChild).toBeNull();
    
    // With score of 49 (just below threshold), should render
    const { container: container3 } = render(<Button {...highScoreProps} />);
    expect(container3.firstChild).not.toBeNull();
    
    // With score of -49 (just above negative threshold), should render
    const { container: container4 } = render(<Button {...lowScoreProps} />);
    expect(container4.firstChild).not.toBeNull();
  });

  test('handles long tag names gracefully', () => {
    render(<Button tag="VeryLongCryptocurrencyNameThatShouldBeTruncated" score={25} />);
    
    // Check if tag is rendered 
    const tagElement = screen.getByText('VeryLongCryptocurrencyNameThatShouldBeTruncated');
    expect(tagElement).toBeInTheDocument();
    
    // Check if tag container has proper styling for overflow
    const tagContainer = tagElement.closest('.tag-container');
    expect(tagContainer).toHaveStyle({
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    });
  });

  test('renders consistently with and without optional img prop', () => {
    // Render with img prop
    const { rerender } = render(<Button tag="BTC" score={25} img="btc.png" />);
    
    // Verify rendering is correct
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    
    // Rerender without img prop
    rerender(<Button tag="BTC" score={25} />);
    
    // Verify rendering is still correct
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });
});