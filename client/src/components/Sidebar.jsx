import React from 'react';
import { Icons } from './Icons';

const Sidebar = ({ page, setPage, handleLogout }) => {
  return (
    <aside className="sidebar">
      <div className="brand-wrapper">
        <div className="brand-logo">E</div>
        <div className="brand-name">Ez-Med</div>
      </div>
      <nav className="nav-menu">
        <button 
          className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} 
          onClick={() => setPage('dashboard')}
        >
          <Icons.Dashboard /> Dashboard
        </button>
        <button 
          className={`nav-item ${page === 'profile' ? 'active' : ''}`} 
          onClick={() => setPage('profile')}
        >
          <Icons.User /> Profile & Meds
        </button>
      </nav>
      <button 
        className="nav-item" 
        onClick={handleLogout} 
        style={{marginTop:'auto', color:'#ef4444'}}
      >
        <Icons.Logout /> Logout
      </button>
    </aside>
  );
};

export default Sidebar;