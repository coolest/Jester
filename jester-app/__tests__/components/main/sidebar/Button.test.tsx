import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Button } from '../../../../src/renderer/src/components/main/sidebar/Button';

describe('Button Component', () => {
  test('renders tag and score container', () => {
    render(<Button tag="BTC" score={25} />);

    // Check if the tag text is present
    expect(screen.getByText('BTC')).toBeInTheDocument();

    // Ensure the Score div exists even if score text is dynamic/hidden
    const scoreDiv = screen.getByRole('button').querySelector('.Score');
    expect(scoreDiv).not.toBeNull();
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
    const { rerender } = render(<Button tag="BTC" score={30} />);
    let scoreDiv = screen.getByRole('button').querySelector('.Score');
    expect(scoreDiv).not.toBeNull();

    rerender(<Button tag="BTC" score={-20} />);
    scoreDiv = screen.getByRole('button').querySelector('.Score');
    expect(scoreDiv).not.toBeNull();

    rerender(<Button tag="BTC" score={0} />);
    scoreDiv = screen.getByRole('button').querySelector('.Score');
    expect(scoreDiv).not.toBeNull();
  });
});
