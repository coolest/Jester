import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NavBar from '../../../../src/renderer/src/components/main/header/NavBar';

describe('NavBar Component', () => {
  test('renders all navigation items', () => {
    render(<NavBar />);
    
    // Check that all navigation items are rendered
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('New Report')).toBeInTheDocument();
  });

  test('marks active item correctly', () => {
    render(<NavBar />);
    
    // Home should be active by default
    const homeItem = screen.getByText('Home').closest('.navbar-item');
    expect(homeItem).toHaveClass('active');
    
    // Other items should not be active
    const analyticsItem = screen.getByText('Analytics').closest('.navbar-item');
    expect(analyticsItem).not.toHaveClass('active');
    
    // Click on Analytics
    fireEvent.click(screen.getByText('Analytics'));
    
    // Analytics should now be active
    expect(analyticsItem).toHaveClass('active');
    // Home should no longer be active
    expect(homeItem).not.toHaveClass('active');
  });

  test('calls onNavigate with correct route when item is clicked', () => {
    const mockNavigate = jest.fn();
    render(<NavBar onNavigate={mockNavigate} />);
    
    // Click on Analytics
    fireEvent.click(screen.getByText('Analytics'));
    
    // Check if onNavigate was called with correct route
    expect(mockNavigate).toHaveBeenCalledWith('analytics');
    
    // Click on Settings
    fireEvent.click(screen.getByText('Settings'));
    
    // Check if onNavigate was called with correct route
    expect(mockNavigate).toHaveBeenCalledWith('settings');
    
    // Click on New Report
    fireEvent.click(screen.getByText('New Report'));
    
    // Check if onNavigate was called with correct route
    expect(mockNavigate).toHaveBeenCalledWith('newReport');
    
    // Click on Home
    fireEvent.click(screen.getByText('Home'));
    
    // Check if onNavigate was called with correct route
    expect(mockNavigate).toHaveBeenCalledWith('dashboard');
  });
});