import React from 'react';
import { Button } from './Button';
import '@renderer/assets/components/main/sidebar/SideBar.css';

// Match the interface from the Main component
interface SidebarItem {
  id: string;
  tag: string;
  score: number;
  img?: string;
}

interface SideBarProps {
  data: SidebarItem[];
  onItemClick?: (id: string) => void;
}

export const SideBar: React.FC<SideBarProps> = ({ data, onItemClick }) => {
  const handleClick = (id: string) => {
    if (onItemClick) {
      onItemClick(id);
    }
  };

  return (
    <div className="sidebar">
      <h1>Cryptos</h1>
      <div className="sidebar-content">
        {data.map((item, index) => (
          <div 
            key={index}
            className="button-wrapper" 
            onClick={() => handleClick(item.id)}
          >
            <Button
              tag={item.tag}
              score={item.score}
              img={item.img}
            />
          </div>
        ))}
      </div>
    </div>
  );
};