import React, { useState } from 'react';
import '../../../assets/components/main/header/NavBar.css';
import { Home, PieChart, Settings, Bell, HelpCircle } from 'lucide-react';

interface NavBarProps {
  onNavigate?: (route: string) => void;
}

const NavBar: React.FC<NavBarProps> = ({ 
  onNavigate = () => {} 
}) => {
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
          className={`navbar-item ${activeItem === 'settings' ? 'active' : ''}`}
          onClick={() => handleNavigation('settings')}
        >
          <Settings size={20} />
          <span>Settings</span>
        </div>
      </div>
      
      <div className="navbar-actions">
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