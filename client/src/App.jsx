import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Confetti from 'react-confetti';

// Component Imports
import Modal from './components/Modal';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav'; // <--- NEW IMPORT
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Streaks from './components/Streaks';

// Data & Styles
import { commonMedicines } from './data/indianMedicines';
import { Icons } from './components/Icons';
import './App.css';

function App() {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; 

  // --- THEME STATE ---
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Set default theme on load
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  // --- APP STATE ---
  const [page, setPage] = useState('auth');
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [modalType, setModalType] = useState(null); 
  
  const [user, setUser] = useState(null);
  const [meds, setMeds] = useState([]);

  // Forms
  const [medName, setMedName] = useState('');
  const [medTime, setMedTime] = useState('');
  const [recurrence, setRecurrence] = useState('daily');
  const [newCaregiverEmail, setNewCaregiverEmail] = useState('');
  const [selectedMedId, setSelectedMedId] = useState(null);

  // Init
  useEffect(() => {
    const saved = localStorage.getItem('mediease_user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      setPage('dashboard');
      refreshData(u.userId);
    }
  }, []);

  const refreshData = async (id) => {
    if (!id) return;
    try {
      const [mRes, uRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/medications/user/${id}`),
        axios.get(`${BASE_URL}/api/users/profile/${id}`)
      ]);
      setMeds(mRes.data);
      const freshUser = { ...uRes.data, userId: id }; 
      setUser(freshUser);
      localStorage.setItem('mediease_user', JSON.stringify(freshUser));
    } catch (e) { console.error("Data load failed", e); }
  };

  // Handlers
  const openAddModal = () => { setModalType('addMed'); setMedName(''); setMedTime(''); setRecurrence('daily'); setSelectedMedId(null); };
  const openEditModal = (med) => { setModalType('editMed'); setSelectedMedId(med._id); setMedName(med.name); setMedTime(med.time); setRecurrence(med.recurrence || 'daily'); };
  const openCaregiverModal = () => { setModalType('caregiver'); setNewCaregiverEmail(user.caregiverEmail || ''); };
  const closeModal = () => setModalType(null);

  const handleMedSubmit = async () => {
    if (!medName || !medTime || !user) return alert("Fill all fields.");
    setLoading(true);
    try {
      const date = new Date().toISOString().split('T')[0];
      const payload = { userId: user.userId, name: medName, time: medTime, date, recurrence };
      if (modalType === 'editMed' && selectedMedId) {
        await axios.put(`${BASE_URL}/api/medications/update/${selectedMedId}`, payload);
      } else {
        await axios.post(`${BASE_URL}/api/medications/add`, payload);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      closeModal();
      refreshData(user.userId);
    } catch (e) { alert("Failed."); } finally { setLoading(false); }
  };

  const handleCaregiverSubmit = async () => {
    if (!newCaregiverEmail) return;
    try {
      await axios.put(`${BASE_URL}/api/users/profile/${user.userId}`, { caregiverEmail: newCaregiverEmail });
      closeModal();
      refreshData(user.userId);
      alert("Linked!");
    } catch (e) { alert("Failed."); }
  };

  const handleDeleteMed = async (id) => {
    if(!window.confirm("Delete?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/medications/delete/${id}`);
      refreshData(user.userId);
    } catch (e) { alert("Failed."); }
  };

  const markTaken = async (id) => {
    setMeds(meds.map(m => m._id === id ? { ...m, status: 'taken' } : m));
    try {
      const res = await axios.post(`${BASE_URL}/api/medications/${id}/status`);
      if(res.data.user) setUser(prev => ({ ...prev, ...res.data.user }));
    } catch (e) { refreshData(user.userId); }
  };

  const notifyCaregiver = async () => {
    if(!user.caregiverEmail) return alert("No caregiver linked.");
    try {
      await axios.post(`${BASE_URL}/api/notifications/notify-caregiver`, { userId: user.userId, type: 'email' });
      alert("Sent!");
    } catch(e) { alert("Failed."); }
  };

  const handleLogout = () => {
    localStorage.removeItem('mediease_user');
    setUser(null);
    setPage('auth');
  };

  // --- RENDER ---
  if (page === 'auth') {
    return <Auth setUser={setUser} setPage={setPage} refreshData={refreshData} BASE_URL={BASE_URL} />;
  }

  return (
    <div className="app-layout">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}
      
      {/* Desktop Sidebar */}
      <Sidebar 
        page={page} 
        setPage={setPage} 
        handleLogout={handleLogout} 
        theme={theme} 
        toggleTheme={toggleTheme} 
      />
      
      {/* Main Content Area */}
      <main className="main-wrapper">
        {page === 'dashboard' && (
          <Dashboard 
            user={user} meds={meds} theme={theme} toggleTheme={toggleTheme}
            openAddModal={openAddModal} markTaken={markTaken} openEditModal={openEditModal} handleDeleteMed={handleDeleteMed} 
          />
        )}

        {page === 'profile' && user && (
          <Profile 
            user={user} meds={meds} theme={theme} toggleTheme={toggleTheme}
            openCaregiverModal={openCaregiverModal} notifyCaregiver={notifyCaregiver} openAddModal={openAddModal} 
          />
        )}
        
        {page === 'streaks' && user && (
          <Streaks user={user} theme={theme} toggleTheme={toggleTheme} />
        )}
      </main>

      {/* NEW: Mobile Navigation (Shows only on mobile via CSS) */}
      <MobileNav page={page} setPage={setPage} />

      {/* Modals */}
      <Modal isOpen={!!modalType} onClose={closeModal} title={modalType === 'caregiver' ? 'Link Caregiver' : (modalType === 'editMed' ? 'Edit Medication' : 'Add Medication')}>
        {(modalType === 'addMed' || modalType === 'editMed') && (
          <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
            <div>
              <label className="label">Name</label>
              <input className="input-modern" placeholder="e.g. Dolo 650" value={medName} onChange={e => setMedName(e.target.value)} list="med-suggestions" autoFocus />
              <datalist id="med-suggestions">{commonMedicines.map((m,i)=><option key={i} value={m}/>)}</datalist>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
              <div><label className="label">Time</label><input className="input-modern" type="time" value={medTime} onChange={e => setMedTime(e.target.value)} /></div>
              <div><label className="label">Recurrence</label><select className="input-modern" value={recurrence} onChange={e => setRecurrence(e.target.value)}><option value="daily">Daily</option><option value="weekly">Weekly</option></select></div>
            </div>
            <button className="action-btn" style={{width:'100%', marginTop:'0.5rem'}} onClick={handleMedSubmit}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        )}
        {modalType === 'caregiver' && (
          <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
            <p className="sub-text">Enter email to receive alerts.</p>
            <input className="input-modern" type="email" value={newCaregiverEmail} onChange={e => setNewCaregiverEmail(e.target.value)} placeholder="name@example.com" />
            <button className="action-btn" style={{width:'100%', marginTop:'0.5rem'}} onClick={handleCaregiverSubmit}>Link Account</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default App;