import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  {
    id: 'home',
    path: '/',
    label: 'Home',
    icon: 'home',
    iconFill: 'home',
  },
  {
    id: 'map',
    path: '/map',
    label: 'Map',
    icon: 'radar',
    iconFill: 'radar',
  },
  {
    id: 'chat',
    path: '/chat',
    label: 'Guardian',
    icon: 'security',
    iconFill: 'security',
  },
  {
    id: 'safewalk',
    path: '/safewalk',
    label: 'Buddies',
    icon: 'group',
    iconFill: 'group',
  },
  {
    id: 'profile',
    path: '/profile',
    label: 'Profile',
    icon: 'person',
    iconFill: 'person',
  },
];

export default function NavBar() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '/home') setActiveTab('home');
    else if (path === '/map')     setActiveTab('map');
    else if (path === '/chat')    setActiveTab('chat');
    else if (path === '/safewalk') setActiveTab('safewalk');
    else if (path === '/profile') setActiveTab('profile');
  }, [location]);

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 glass-nav shadow-[0_-15px_40px_rgba(0,0,0,0.8)] pb-safe">
      {/* Top border glow line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="flex justify-around items-center h-[88px] px-2 relative z-10 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-1.5 px-3 py-3 w-[72px] transition-all duration-300 active:scale-90 ${
                isActive
                  ? 'text-white'
                  : 'text-on-surface-variant hover:text-white/80'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute inset-0 bg-white/5 border border-white/10 rounded-[1.25rem] shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_2px_15px_rgba(255,255,255,0.05)] -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
              
              <div className="relative">
                {isActive && (
                  <div className="absolute inset-0 bg-secondary/30 blur-[12px] rounded-full scale-150" />
                )}
                <span
                  className={`material-symbols-outlined text-[28px] relative z-10 transition-colors duration-300 ${
                    isActive ? 'text-secondary drop-shadow-[0_0_12px_rgba(0,255,135,0.8)]' : ''
                  }`}
                  style={{
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {item.icon}
                </span>
              </div>

              <span className={`text-[10px] font-black uppercase tracking-widest leading-none transition-colors duration-300 ${
                isActive ? 'text-white drop-shadow-md' : 'opacity-70'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
