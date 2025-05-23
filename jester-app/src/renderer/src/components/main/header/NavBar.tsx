import React, { useState } from 'react';
import '../../../assets/components/main/header/NavBar.css';
import { Home, PieChart, Settings, Bell, HelpCircle, FileText, FolderClosed} from 'lucide-react';

interface NavBarProps {
  onNavigate?: (route: string) => void;
}

const NavBar: React.FC<NavBarProps> = ({ onNavigate = () => {} }) => {
  const [activeItem, setActiveItem] = useState('dashboard');

  const handleNavigation = (route: string) => {
    setActiveItem(route);
    onNavigate(route);
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h1>Jester</h1>
      </div>

      <div className="navbar-menu">
        <div
          className={`navbar-item ${activeItem === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavigation('dashboard')}
        >
          <Home size={20} />
          <span>Home</span>
        </div>

        <div
          className={`navbar-item ${activeItem === 'analytics' ? 'active' : ''}`}
          onClick={() => handleNavigation('analytics')}
        >
          <PieChart size={20} />
          <span>Analytics</span>
        </div>

        <div
          className={`navbar-item ${activeItem === 'reports' ? 'active' : ''}`}
          onClick={() => handleNavigation('reports')}
        >
          <FolderClosed size={20} />
          <span>Reports</span> {/* <-- THIS was missing */}
        </div>

        <div
          className={`navbar-item ${activeItem === 'settings' ? 'active' : ''}`}
          onClick={() => handleNavigation('settings')}
        >
          <Settings size={20} />
          <span>Settings</span>
        </div>
      </div>

      <div className="navbar-actions">
        <div
          className={`navbar-item new-report ${activeItem === 'newReport' ? 'active' : ''}`}
          onClick={() => handleNavigation('newReport')}
        >
          <FileText size={20} />
          <span>New Report</span>
        </div>

        <div className="navbar-item notification">
          <Bell size={20} />
        </div>

        <div className="navbar-item help">
          <HelpCircle size={20} />
        </div>

        <div className="window-control-spacer"></div>
      </div>
    </nav>
  );
};

export default NavBar;
