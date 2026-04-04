import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { 
    id: 'home', 
    path: '/', 
    label: 'Home', 
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    )
  },
  { 
    id: 'map', 
    path: '/map', 
    label: 'Map', 
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ) 
  },
  { 
    id: 'chat', 
    path: '/chat', 
    label: 'Guardian', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L4 8v14h16V8L12 2z" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ) 
  },
  { 
    id: 'profile', 
    path: '/profile', 
    label: 'Profile', 
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ) 
  },
];

export default function NavBar() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const currentPath = location.pathname === '/' ? 'home' : location.pathname.substring(1);
    const item = navItems.find((nav) => nav.id === currentPath || (currentPath === '' && nav.id === 'home'));
    if (item) setActiveTab(item.id);
  }, [location]);

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] h-[60px] z-40 flex justify-around items-center bg-[rgba(0,0,0,0.9)] backdrop-blur-[20px] border-t border-border-color">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        
        return (
          <Link
            key={item.id}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-[4px] px-2 transition-colors duration-200 ${isActive ? 'text-accent' : 'text-text-tertiary'}`}
          >
            <div className="flex items-center justify-center h-[24px]">
              {item.icon}
            </div>
            <span className="text-[10px] font-medium tracking-wide">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
