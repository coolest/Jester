import React from 'react';
import { render } from '@testing-library/react';
import NavBar from '../../../../src/renderer/src/components/main/header/NavBar';

jest.mock('lucide-react', () => ({
  Home: () => <div>Home Icon</div>,
  PieChart: () => <div>PieChart Icon</div>,
  Settings: () => <div>Settings Icon</div>,
  Bell: () => <div>Bell Icon</div>,
  HelpCircle: () => <div>HelpCircle Icon</div>,
  FileText: () => <div>FileText Icon</div>,
  FolderClosed: () => <div>FolderClosed Icon</div>,
}));

describe('NavBar', () => {
  it('renders without crashing', () => {
    render(<NavBar />);
  });
});
