// Mock for Lucide React icons
const React = require('react');

// Create a mock component factory function
const createMockComponent = (displayName) => {
  const component = () => {
    return React.createElement('div', {
      'data-testid': `icon-${displayName.toLowerCase()}`
    }, `${displayName} Icon`);
  };
  component.displayName = displayName;
  return component;
};

// Export all commonly used Lucide icons
module.exports = {
  Home: createMockComponent('Home'),
  PieChart: createMockComponent('PieChart'),
  Settings: createMockComponent('Settings'),
  Bell: createMockComponent('Bell'),
  HelpCircle: createMockComponent('HelpCircle'),
  FileText: createMockComponent('FileText'),
  Calendar: createMockComponent('Calendar'),
  ChevronDown: createMockComponent('ChevronDown'),
  Plus: createMockComponent('Plus'),
  BarChart2: createMockComponent('BarChart2')
  // Add any other icons used in your project
};