import React from 'react';
import { Icons } from './Icons';
import Logo from '../assets/logo with text.svg'; 

const Sidebar = ({ page, setPage, handleLogout }) => {
  return (
    <aside className="sidebar">
      <div className="brand-wrapper">
        <img src={Logo} alt="Mediease" className="brand-logo-img" />
      </div>
      
      <nav className="nav-menu">
        <button className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>
          <Icons.Dashboard /> Dashboard
        </button>
        <button className={`nav-item ${page === 'profile' ? 'active' : ''}`} onClick={() => setPage('profile')}>
          <Icons.User /> Profile
        </button>
        <button className={`nav-item ${page === 'streaks' ? 'active' : ''}`} onClick={() => setPage('streaks')}>
          <Icons.Streak /> Streaks
        </button>
      </nav>

      <div style={{marginTop:'auto', display:'flex', flexDirection:'column', gap:'1rem'}}>
        <button className="nav-item" onClick={handleLogout} style={{color:'#ef4444'}}>
          <Icons.Logout /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;