import React from 'react';
import { Icons } from './Icons';
import '../App.css'; // Ensure styles are loaded

const MobileNav = ({ page, setPage }) => {
  return (
    <nav className="mobile-nav">
      <button 
        className={`mobile-nav-item ${page === 'dashboard' ? 'active' : ''}`} 
        onClick={() => setPage('dashboard')}
      >
        <Icons.Dashboard />
        <span>Home</span>
      </button>
      
      <button 
        className={`mobile-nav-item ${page === 'streaks' ? 'active' : ''}`} 
        onClick={() => setPage('streaks')}
      >
        <Icons.Streak />
        <span>Streaks</span>
      </button>

      <button 
        className={`mobile-nav-item ${page === 'profile' ? 'active' : ''}`} 
        onClick={() => setPage('profile')}
      >
        <Icons.User />
        <span>Profile</span>
      </button>
    </nav>
  );
};

export default MobileNav;