import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Confetti from 'react-confetti';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Component Imports
import Modal from './components/Modal';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Streaks from './components/Streaks';
import TimeScheduleInput from './components/TimeScheduleInput';

// Data & Styles
import { indianMedicines } from './data/indianMedicines'; 
import './App.css';

function App() {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const navigate = useNavigate();
  const location = useLocation();

  // --- THEME ---
  const [theme, setTheme] = useState('dark');
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, []);

  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [modalType, setModalType] = useState(null);
  
  const [user, setUser] = useState(null);
  const [meds, setMeds] = useState([]);
  
  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [medInfo, setMedInfo] = useState(null);

  // Form State
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState(''); 
  const [schedule, setSchedule] = useState(["09:00"]); 
  const [recurrence, setRecurrence] = useState('daily');
  const [newCaregiverEmail, setNewCaregiverEmail] = useState('');
  const [selectedMedId, setSelectedMedId] = useState(null);

  // --- INIT ---
  useEffect(() => {
    const saved = localStorage.getItem('mediease_user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      refreshData(u.userId);
      if (location.pathname === '/') navigate('/dashboard');
    } else {
      navigate('/auth');
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

  // --- HANDLERS ---
  const openAddModal = () => {
    setModalType('add');
    setMedName('');
    setMedDosage('');
    setSchedule(["09:00"]);
    setRecurrence('daily');
    setSelectedMedId(null);
  };

  const openEditModal = (med) => {
    setModalType('edit');
    // FIX 1: Add fallbacks to prevent "Uncontrolled Input" error
    setMedName(med.name || '');
    setMedDosage(med.dosage || '');
    
    // FIX 2: Handle Array Schedule or Legacy Time
    if (med.schedule && med.schedule.length > 0) {
      setSchedule(med.schedule);
    } else {
      setSchedule(med.time ? [med.time] : ["09:00"]);
    }
    
    setRecurrence(med.recurrence || 'daily');
    setSelectedMedId(med._id);
  };

  const closeModal = () => setModalType(null);

  const handleMedSubmit = async () => {
    if (!medName || !medDosage || !user) return alert("Fill all fields.");
    setLoading(true);
    try {
      const payload = { 
        userId: user.userId, 
        name: medName, 
        dosage: medDosage,
        schedule: schedule, // Sending Array
        recurrence 
      };

      if (modalType === 'edit' && selectedMedId) {
        await axios.put(`${BASE_URL}/api/medications/update/${selectedMedId}`, payload);
      } else {
        await axios.post(`${BASE_URL}/api/medications/add`, payload);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      closeModal();
      refreshData(user.userId);
    } catch (e) { alert("Failed. Check server logs."); } 
    finally { setLoading(false); }
  };

  // Mark Taken Logic
  const markTaken = async (id) => {
    const medIndex = meds.findIndex(m => m._id === id);
    if (medIndex === -1) return;
    
    // Optimistic UI Update
    const updatedMeds = [...meds];
    updatedMeds[medIndex] = { ...updatedMeds[medIndex], status: 'taken' };
    setMeds(updatedMeds);

    try {
      await axios.post(`${BASE_URL}/api/medications/${id}/status`);
      refreshData(user.userId);
    } catch (e) {
      console.error(e);
      refreshData(user.userId); // Revert
    }
  };

  const handleDeleteMed = async (id) => {
    if(!window.confirm("Delete this medication?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/medications/delete/${id}`);
      refreshData(user.userId);
    } catch (e) { alert("Failed."); }
  };

  // AI Handler
  const handleGetInfo = async (name) => {
    setModalType('aiInfo');
    setMedInfo(null);
    setAiLoading(true);
    
    try {
      const res = await axios.post(`${BASE_URL}/api/ai/medicine-info`, { medicineName: name });
      setMedInfo(res.data);
    } catch (e) {
      setMedInfo({ usage: "Unavailable", sideEffects: "Try again later", alcoholWarning: "N/A" });
    } finally {
      setAiLoading(false);
    }
  };

  // FIX 3: Notify Caregiver Logic
  const notifyCaregiver = async () => {
    if (!user || !user.caregiverEmail) {
      alert("No caregiver linked. Please link one in your profile.");
      return;
    }
    try {
      await axios.post(`${BASE_URL}/api/notifications/notify-caregiver`, { userId: user.userId, type: 'email' });
      alert("Alert Sent Successfully!");
    } catch(e) { 
      console.error(e);
      alert("Failed to send alert."); 
    }
  };

  const handleCaregiverSubmit = async () => {
    if (!newCaregiverEmail) return;
    try { await axios.put(`${BASE_URL}/api/users/profile/${user.userId}`, { caregiverEmail: newCaregiverEmail }); closeModal(); refreshData(user.userId); alert("Linked!"); } catch (e) { alert("Failed."); }
  };


  // --- RENDER ---
  if (location.pathname === '/auth') {
    return <Auth setUser={(u) => { setUser(u); refreshData(u.userId); navigate('/dashboard'); }} BASE_URL={BASE_URL} />;
  }

  return (
    <div className="app-layout">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}
      
      <Sidebar page={location.pathname.replace('/', '')} setPage={(p) => navigate(`/${p}`)} handleLogout={() => { localStorage.removeItem('mediease_user'); setUser(null); navigate('/auth'); }} theme={theme} toggleTheme={toggleTheme} />
      
      <main className="main-wrapper">
        <Routes>
          <Route path="/dashboard" element={
            <Dashboard 
               user={user} meds={meds} theme={theme} toggleTheme={toggleTheme} 
               openAddModal={openAddModal} openEditModal={openEditModal} 
               markTaken={markTaken} handleDeleteMed={handleDeleteMed} handleGetInfo={handleGetInfo} 
            />
          } />
          <Route path="/profile" element={
             <Profile 
                user={user} meds={meds} theme={theme} toggleTheme={toggleTheme} 
                openAddModal={openAddModal} 
                openCaregiverModal={() => { setModalType('caregiver'); setNewCaregiverEmail(user.caregiverEmail || ''); }}
                notifyCaregiver={notifyCaregiver} // <--- Passing the prop here!
             />
          } />
          <Route path="/streaks" element={<Streaks user={user} theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>

      <MobileNav page={location.pathname.replace('/', '')} setPage={(p) => navigate(`/${p}`)} />

      {/* --- MODAL SYSTEM --- */}
      <Modal isOpen={!!modalType} onClose={closeModal} 
        title={
          modalType === 'aiInfo' ? 'Medicine Insights' : 
          (modalType === 'add' || modalType === 'edit' ? (modalType === 'edit' ? 'Edit Medication' : 'Add Medication') : 
          (modalType === 'caregiver' ? 'Link Caregiver' : ''))
        }
      >
        {/* AI INFO */}
        {modalType === 'aiInfo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '200px' }}>
            {aiLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} style={{ fontSize: '3rem', marginBottom: '1rem', display: 'inline-block' }}>🤖</motion.div>
                <p>Asking Gemini...</p>
              </div>
            ) : medInfo ? (
              <>
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--primary)' }}>
                  <label className="label" style={{ color: 'var(--primary)', marginBottom: '4px' }}>Usage</label>
                  <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.5' }}>{medInfo.usage}</p>
                </div>
                <div><label className="label">Common Side Effects</label><p style={{ margin: 0, color: 'var(--text-main)', lineHeight: '1.5' }}>{medInfo.sideEffects}</p></div>
                {medInfo.alcoholWarning && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                     <label className="label" style={{ color: '#ef4444', marginBottom: '4px' }}>Alcohol Warning</label>
                     <p style={{ margin: 0, fontSize: '0.9rem' }}>{medInfo.alcoholWarning}</p>
                  </div>
                )}
              </>
            ) : null}
            {!aiLoading && <button className="action-btn" style={{ width: '100%', marginTop: '0.5rem' }} onClick={closeModal}>Got it</button>}
          </div>
        )}

        {/* ADD/EDIT FORM */}
        {(modalType === 'add' || modalType === 'edit') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label">Medicine Name</label>
              {/* FIX 4: Controlled Input Fallback */}
              <input className="input-modern" placeholder="e.g. Dolo 650" value={medName || ''} onChange={e => setMedName(e.target.value)} list="med-suggestions" autoFocus />
              <datalist id="med-suggestions">{indianMedicines && indianMedicines.map((m,i)=><option key={i} value={m}/>)}</datalist>
            </div>
            <div>
              <label className="label">Dosage</label>
              <input className="input-modern" placeholder="e.g. 1 Tablet" value={medDosage || ''} onChange={e => setMedDosage(e.target.value)} />
            </div>
            <TimeScheduleInput schedule={schedule} setSchedule={setSchedule} />
            <div>
              <label className="label">Recurrence</label>
              <select className="input-modern" value={recurrence} onChange={e => setRecurrence(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <button className="action-btn" style={{ width: '100%', marginTop: '1rem' }} onClick={handleMedSubmit}>
              {loading ? 'Saving...' : (modalType === 'edit' ? 'Update' : 'Save')}
            </button>
          </div>
        )}

        {/* CAREGIVER */}
        {modalType === 'caregiver' && (
          <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
             <input className="input-modern" type="email" value={newCaregiverEmail} onChange={e => setNewCaregiverEmail(e.target.value)} placeholder="name@example.com" />
             <button className="action-btn" onClick={handleCaregiverSubmit}>Link</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default App;