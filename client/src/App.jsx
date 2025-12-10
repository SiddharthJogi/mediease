import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Confetti from 'react-confetti';
import { motion } from 'framer-motion';

// Component Imports
import Modal from './components/Modal';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Streaks from './components/Streaks';
import TimeScheduleInput from './components/TimeScheduleInput'; // Make sure this file exists!

// Data & Styles
import { indianMedicines } from './data/indianMedicines';
import { Icons } from './components/Icons';
import './App.css';

function App() {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; 

  // --- THEME ---
  const [theme, setTheme] = useState('dark');
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, []);

  // --- STATE ---
  const [page, setPage] = useState('auth');
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [modalType, setModalType] = useState(null); 
  
  const [user, setUser] = useState(null);
  const [meds, setMeds] = useState([]);

  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [medInfo, setMedInfo] = useState(null);

  // Forms (Advanced)
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState(''); // Added Dosage
  const [schedule, setSchedule] = useState(["09:00"]); // Added Schedule Array
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
  const openAddModal = () => { 
    setModalType('addMed'); 
    setMedName(''); 
    setMedDosage(''); 
    setSchedule(["09:00"]); 
    setRecurrence('daily'); 
    setSelectedMedId(null); 
  };
  
  const openEditModal = (med) => { 
    setModalType('editMed'); 
    setSelectedMedId(med._id); 
    setMedName(med.name || ''); 
    setMedDosage(med.dosage || ''); 
    
    // Load existing schedule or fallback to legacy time
    if (med.schedule && med.schedule.length > 0) {
      setSchedule(med.schedule);
    } else {
      setSchedule(med.time ? [med.time] : ["09:00"]);
    }
    
    setRecurrence(med.recurrence || 'daily'); 
  };

  const openCaregiverModal = () => { setModalType('caregiver'); setNewCaregiverEmail(user.caregiverEmail || ''); };
  const closeModal = () => setModalType(null);

  const handleGetInfo = async (name) => {
    setModalType('aiInfo');
    setMedInfo(null);
    setAiLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/ai/medicine-info`, { medicineName: name });
      setMedInfo(res.data);
    } catch (e) {
      setMedInfo({ usage: "Unavailable", sideEffects: "Try again later", alcoholWarning: "N/A" });
    } finally { setAiLoading(false); }
  };

  const handleMedSubmit = async () => {
    // Validate required fields
    if (!medName || !user) return alert("Please enter a medicine name.");
    
    setLoading(true);
    try {
      const date = new Date().toISOString().split('T')[0];
      
      const payload = { 
        userId: user.userId, 
        name: medName, 
        dosage: medDosage,
        schedule: schedule, // Sends array ["09:00", "14:00"]
        time: schedule[0], // Fallback for legacy
        date, 
        recurrence 
      };

      if (modalType === 'editMed' && selectedMedId) {
        await axios.put(`${BASE_URL}/api/medications/update/${selectedMedId}`, payload);
      } else {
        await axios.post(`${BASE_URL}/api/medications/add`, payload);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      closeModal();
      refreshData(user.userId);
    } catch (e) { 
        console.error(e);
        alert("Failed to save medication."); 
    } finally { 
        setLoading(false); 
    }
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

  if (page === 'auth') {
    return <Auth setUser={setUser} setPage={setPage} refreshData={refreshData} BASE_URL={BASE_URL} />;
  }

  return (
    <div className="app-layout">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}
      
      <Sidebar page={page} setPage={setPage} handleLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
      
      <main className="main-wrapper">
        {page === 'dashboard' && (
          <Dashboard 
            user={user} meds={meds} theme={theme} toggleTheme={toggleTheme}
            openAddModal={openAddModal} markTaken={markTaken} 
            openEditModal={openEditModal} handleDeleteMed={handleDeleteMed}
            handleGetInfo={handleGetInfo}
          />
        )}
        {page === 'profile' && user && (
          <Profile 
            user={user} meds={meds} theme={theme} toggleTheme={toggleTheme}
            openCaregiverModal={openCaregiverModal} notifyCaregiver={notifyCaregiver} openAddModal={openAddModal} 
          />
        )}
        {page === 'streaks' && user && <Streaks user={user} theme={theme} toggleTheme={toggleTheme} />}
      </main>

      <MobileNav page={page} setPage={setPage} />

      <Modal isOpen={!!modalType} onClose={closeModal} 
        title={
          modalType === 'caregiver' ? 'Link Caregiver' : 
          (modalType === 'aiInfo' ? 'Medicine Insights' : 
          (modalType === 'editMed' ? 'Edit Medication' : 'Add Medication'))
        }
      >
        {/* AI INFO */}
        {modalType === 'aiInfo' && medInfo && (
           <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
             <div><label className="label" style={{color:'var(--primary)'}}>Usage</label><p style={{fontSize:'0.9rem'}}>{medInfo.usage}</p></div>
             <div><label className="label">Side Effects</label><p>{medInfo.sideEffects}</p></div>
             <button className="action-btn" onClick={closeModal}>Got it</button>
           </div>
        )}

        {/* ADD / EDIT FORM (RESTORED ADVANCED VERSION) */}
        {(modalType === 'addMed' || modalType === 'editMed') && (
          <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
            <div>
              <label className="label">Name</label>
              <input className="input-modern" placeholder="e.g. Dolo 650" value={medName} onChange={e => setMedName(e.target.value)} list="med-suggestions" autoFocus />
              <datalist id="med-suggestions">{indianMedicines.map((m,i)=><option key={i} value={m}/>)}</datalist>
            </div>
            
            {/* DOSAGE INPUT (RESTORED) */}
            <div>
              <label className="label">Dosage</label>
              <input className="input-modern" placeholder="e.g. 1 Tablet" value={medDosage} onChange={e => setMedDosage(e.target.value)} />
            </div>

            {/* TIME SCHEDULE INPUT (RESTORED) */}
            <TimeScheduleInput schedule={schedule} setSchedule={setSchedule} />

            <div>
              <label className="label">Recurrence</label>
              <select className="input-modern" value={recurrence} onChange={e => setRecurrence(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <button className="action-btn" style={{width:'100%', marginTop:'0.5rem'}} onClick={handleMedSubmit}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}

        {/* CAREGIVER */}
        {modalType === 'caregiver' && (
          <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
            <p className="sub-text">Enter email to receive alerts.</p>
            <input className="input-modern" type="email" value={newCaregiverEmail} onChange={e => setNewCaregiverEmail(e.target.value)} placeholder="name@example.com" />
            <button className="action-btn" style={{width:'100%'}} onClick={handleCaregiverSubmit}>Link Account</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default App;