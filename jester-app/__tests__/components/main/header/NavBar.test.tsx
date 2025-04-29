import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NavBar from '../../../../src/renderer/src/components/main/header/NavBar';

// Mock the icons used by NavBar
jest.mock('lucide-react', () => ({
  Home: () => <div data-testid="icon-home">Home</div>,
  PieChart: () => <div data-testid="icon-piechart">PieChart</div>,
  Settings: () => <div data-testid="icon-settings">Settings</div>,
  Bell: () => <div data-testid="icon-bell">Bell</div>,
  HelpCircle: () => <div data-testid="icon-help">Help</div>,
  FileText: () => <div data-testid="icon-filetext">FileText</div>
}));

describe('NavBar Component', () => {
  test('renders navbar with all menu items', () => {
    render(<NavBar />);
    
    // Check for the logo
    expect(screen.getByText('Jester')).toBeInTheDocument();
    
    // Check for menu items
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/New Report/i)).toBeInTheDocument();
  });

  test('calls onNavigate prop when item is clicked', () => {
    const mockNavigate = jest.fn();
    render(<NavBar onNavigate={mockNavigate} />);
    
    // Click on menu items and check if onNavigate is called with correct value
    fireEvent.click(screen.getByText(/Home/i));
    expect(mockNavigate).toHaveBeenCalledWith('dashboard');
    
    fireEvent.click(screen.getByText(/Analytics/i));
    expect(mockNavigate).toHaveBeenCalledWith('analytics');
    
    fireEvent.click(screen.getByText(/Settings/i));
    expect(mockNavigate).toHaveBeenCalledWith('settings');
    
    fireEvent.click(screen.getByText(/New Report/i));
    expect(mockNavigate).toHaveBeenCalledWith('newReport');
  });

  test('updates active item when clicked', () => {
    render(<NavBar />);
    
    // Get the initial active item (should be 'dashboard')
    const homeItem = screen.getByText(/Home/i).closest('.navbar-item');
    expect(homeItem).toHaveClass('active');
    
    // Click on Analytics and check if it becomes active
    fireEvent.click(screen.getByText(/Analytics/i));
    const analyticsItem = screen.getByText(/Analytics/i).closest('.navbar-item');
    
    // Check if the class has changed (this may work differently depending on how your NavBar is implemented)
    expect(analyticsItem).toHaveClass('active');
  });
});