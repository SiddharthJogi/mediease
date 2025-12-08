import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Confetti from 'react-confetti';
import Modal from './components/Modal';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import { commonMedicines } from './data/indianMedicines';
import './App.css';

function App() {
  const BASE_URL = 'http://localhost:5000'; 

  // --- STATE ---
  const [page, setPage] = useState('auth');
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [modalType, setModalType] = useState(null); // 'addMed', 'editMed', 'caregiver'
  
  // Data State
  const [user, setUser] = useState(null);
  const [meds, setMeds] = useState([]);

  // Form State
  const [medName, setMedName] = useState('');
  const [medTime, setMedTime] = useState('');
  const [recurrence, setRecurrence] = useState('daily');
  const [newCaregiverEmail, setNewCaregiverEmail] = useState('');
  const [selectedMedId, setSelectedMedId] = useState(null);

  // --- INIT ---
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

  // --- MODAL HANDLERS ---
  const openAddModal = () => {
    setModalType('addMed');
    setMedName('');
    setMedTime('');
    setRecurrence('daily');
    setSelectedMedId(null);
  };

  const openEditModal = (med) => {
    setModalType('editMed');
    setSelectedMedId(med._id);
    setMedName(med.name);
    setMedTime(med.time);
    setRecurrence(med.recurrence || 'daily');
  };

  const openCaregiverModal = () => {
    setModalType('caregiver');
    setNewCaregiverEmail(user.caregiverEmail || '');
  };

  const closeModal = () => setModalType(null);

  // --- API ACTIONS ---
  const handleMedSubmit = async () => {
    if (!medName || !medTime || !user) {
      alert("Please ensure all fields are filled.");
      return;
    }
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
    } catch (e) { alert("Operation failed."); } 
    finally { setLoading(false); }
  };

  const handleCaregiverSubmit = async () => {
    if (!newCaregiverEmail || !user) return alert("Enter valid email");
    try {
      const res = await axios.put(`${BASE_URL}/api/users/profile/${user.userId}`, { caregiverEmail: newCaregiverEmail });
      if (res.status === 200) {
        setUser({ ...user, caregiverEmail: newCaregiverEmail });
        closeModal();
        alert("Caregiver linked!");
      }
    } catch (e) { alert("Failed to link."); }
  };

  const handleDeleteMed = async (id) => {
    if(!window.confirm("Are you sure you want to permanently delete this medication?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/medications/delete/${id}`);
      
      // FIX: Refresh BOTH Meds (Dashboard) and User Profile (Profile Tab)
      await refreshData(user.userId); 
      
      // OPTIONAL: Manually filter the local state for instant feedback before the API returns
      // setMeds(prev => prev.filter(m => m._id !== id));
      // setUser(prev => ({
      //   ...prev,
      //   medications: prev.medications.filter(...) // Complex without IDs in user profile
      // }));
      
    } catch (e) { 
      console.error("Delete failed:", e);
      alert("Failed to delete. Check console."); 
    }
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
      alert("Alert sent!");
    } catch(e) { alert("Failed to send."); }
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
      <Sidebar page={page} setPage={setPage} handleLogout={handleLogout} />
      
      <main className="main-wrapper">
        <div className="header-glass">
          <div className="date-display">
            <h1>{page === 'dashboard' ? 'Overview' : 'My Profile'}</h1>
            <p>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="status-pills">
            {user && (
              <>
                <div className="pill" style={{borderColor: '#f59e0b', color: '#f59e0b'}}>🔥 {user.streak || 0} Streak</div>
                <div className="pill" style={{borderColor: '#6366f1', color: '#6366f1'}}>💎 {user.points || 0} Pts</div>
              </>
            )}
          </div>
        </div>

        {page === 'dashboard' && (
          <Dashboard 
            meds={meds} 
            openAddModal={openAddModal} 
            markTaken={markTaken} 
            openEditModal={openEditModal} 
            handleDeleteMed={handleDeleteMed} 
          />
        )}

        {page === 'profile' && user && (
          <Profile 
            user={user} 
            openCaregiverModal={openCaregiverModal} 
            notifyCaregiver={notifyCaregiver} 
            openAddModal={openAddModal} 
          />
        )}
      </main>

      {/* --- MODAL --- */}
      <Modal isOpen={!!modalType} onClose={closeModal} title={modalType === 'caregiver' ? 'Link Caregiver' : (modalType === 'editMed' ? 'Edit Medication' : 'Add Medication')}>
        
        {(modalType === 'addMed' || modalType === 'editMed') && (
          <div style={{display:'flex', flexDirection:'column', gap:'1.25rem'}}>
            {/* Inside the Modal, replace the existing Name input div with this: */}

          <div>
            <label className="label" style={{marginBottom:'8px', display:'block'}}>Medicine Name</label>
            <input 
              className="input-modern" 
              placeholder="e.g. Dolo 650" 
              value={medName} 
              onChange={e => setMedName(e.target.value)} 
              list="med-suggestions" // <--- Connects to the datalist
              autoFocus 
            />
            {/* The Data List for Autocomplete */}
            <datalist id="med-suggestions">
              {commonMedicines.map((med, index) => (
                <option key={index} value={med} />
              ))}
            </datalist>
          </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
              <div><label className="label" style={{marginBottom:'8px', display:'block'}}>Time</label><input className="input-modern" type="time" value={medTime} onChange={e => setMedTime(e.target.value)} /></div>
              <div><label className="label" style={{marginBottom:'8px', display:'block'}}>Recurrence</label><select className="input-modern" value={recurrence} onChange={e => setRecurrence(e.target.value)}><option value="daily">Daily</option><option value="weekly">Weekly</option></select></div>
            </div>
            <button className="action-btn" style={{width:'100%', marginTop:'0.5rem'}} onClick={handleMedSubmit}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        )}

        {modalType === 'caregiver' && (
          <div style={{display:'flex', flexDirection:'column', gap:'1.25rem'}}>
            <p className="sub-text">Enter email to receive alerts.</p>
            <div><label className="label" style={{marginBottom:'8px', display:'block'}}>Email</label><input className="input-modern" type="email" value={newCaregiverEmail} onChange={e => setNewCaregiverEmail(e.target.value)} autoFocus /></div>
            <button className="action-btn" style={{width:'100%', marginTop:'0.5rem'}} onClick={handleCaregiverSubmit}>Link Account</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default App;