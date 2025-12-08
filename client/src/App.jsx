import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Confetti from 'react-confetti';
import { motion } from 'framer-motion';
import './App.css';

// --- ICONS ---
const Icons = {
  Dashboard: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  User: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Logout: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Plus: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
  Check: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
  Bell: () => <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  Heart: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  Edit: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Trash: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
};

// --- MODAL ---
const Modal = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem'}}>
          <h2 style={{margin: 0, fontSize: '1.25rem', fontWeight: '700'}}>{title}</h2>
          <button onClick={onClose} style={{background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer'}}>&times;</button>
        </div>
        {children}
      </motion.div>
    </div>
  );
};

function App() {
  const { t } = useTranslation();
  const BASE_URL = 'http://localhost:5000'; 

  // State
  const [page, setPage] = useState('auth');
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // MODAL STATE MANAGMENT
  const [modalType, setModalType] = useState(null); // 'addMed', 'editMed', 'caregiver'
  
  // User Data
  const [user, setUser] = useState(null);
  const [meds, setMeds] = useState([]);

  // Auth Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [caregiverEmail, setCaregiverEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Form Inputs (Reused for Add/Edit Meds and Caregiver)
  const [medName, setMedName] = useState('');
  const [medTime, setMedTime] = useState('');
  const [recurrence, setRecurrence] = useState('daily');
  const [newCaregiverEmail, setNewCaregiverEmail] = useState(''); // Specifically for the modal
  
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

  const closeModal = () => {
    setModalType(null);
  };

  // --- API ACTIONS ---

  const handleAuth = async () => {
    if(!email || !password) return alert("Please fill fields");
    setLoading(true);
    try {
      const endpoint = isRegistering ? '/api/users/register' : '/api/users/login';
      const payload = isRegistering ? { email, password, caregiverEmail } : { email, password };
      const res = await axios.post(`${BASE_URL}${endpoint}`, payload);
      const u = res.data;
      localStorage.setItem('mediease_user', JSON.stringify(u));
      setUser(u);
      setPage('dashboard');
      refreshData(u.userId);
    } catch (e) { alert("Authentication failed: " + (e.response?.data?.message || e.message)); }
    setLoading(false);
  };

  const handleMedSubmit = async () => {
    if (!medName || !medTime || !user) {
      alert("Please enter both a Medicine Name and a Time.");
      return;
    }
    try {
      setLoading(true);
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
    if (!newCaregiverEmail || !user) return;
    try {
      const res = await axios.put(`${BASE_URL}/api/users/profile/${user.userId}`, {
        caregiverEmail: newCaregiverEmail
      });
      if (res.status === 200) {
        const updatedUser = { ...user, caregiverEmail: newCaregiverEmail };
        setUser(updatedUser);
        localStorage.setItem('mediease_user', JSON.stringify(updatedUser));
        closeModal();
        alert("Caregiver linked successfully!");
      }
    } catch (e) { alert("Failed to link caregiver."); }
  };

  const handleDeleteMed = async (id) => {
    if(!window.confirm("Delete this medication?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/medications/delete/${id}`);
      refreshData(user.userId);
    } catch (e) { alert("Failed to delete"); }
  };

  const markTaken = async (id) => {
    setMeds(meds.map(m => m._id === id ? { ...m, status: 'taken' } : m));
    try {
      const res = await axios.post(`${BASE_URL}/api/medications/${id}/status`);
      if(res.data.user) {
        setUser(prev => ({ ...prev, streak: res.data.user.streak, points: res.data.user.points }));
      }
    } catch (e) { 
      console.error(e); 
      setMeds(meds.map(m => m._id === id ? { ...m, status: 'pending' } : m));
    }
  };

  const notifyCaregiver = async () => {
    if(!user.caregiverEmail) return alert("No caregiver email set.");
    try {
      await axios.post(`${BASE_URL}/api/notifications/notify-caregiver`, {
        userId: user.userId,
        type: 'email'
      });
      alert(`Alert sent to ${user.caregiverEmail}`);
    } catch(e) { alert("Failed to send notification"); }
  };

  const handleLogout = () => {
    localStorage.removeItem('mediease_user');
    setUser(null);
    setPage('auth');
    setEmail(''); setPassword('');
  };

  // --- VIEWS ---
  if (page === 'auth') {
    return (
      <div className="auth-container">
        <motion.div className="auth-box" initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}}>
          <h1 className="brand-title">Ez-Med</h1>
          <p className="sub-text" style={{marginBottom: '2rem'}}>
            {isRegistering ? "Create your health profile" : "Welcome back"}
          </p>
          <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
            <input className="input-modern" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" />
            <input className="input-modern" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
            {isRegistering && (
              <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}}>
                <input className="input-modern" type="email" value={caregiverEmail} onChange={e => setCaregiverEmail(e.target.value)} placeholder="Caregiver Email (Optional)" />
              </motion.div>
            )}
            <button className="action-btn" style={{width:'100%', padding:'14px', marginTop:'0.5rem'}} onClick={handleAuth} disabled={loading}>
              {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
            </button>
            <div style={{textAlign:'center', marginTop:'1rem'}}>
              <button onClick={() => setIsRegistering(!isRegistering)} style={{background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.9rem'}}>
                {isRegistering ? "Already have an account? Sign In" : "First time? Create Account"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const nextMed = meds.filter(m => m.status === 'pending').sort((a,b) => a.time.localeCompare(b.time))[0];

  return (
    <div className="app-layout">
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}
      
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand-wrapper">
          <div className="brand-logo">E</div>
          <div className="brand-name">Ez-Med</div>
        </div>
        <nav className="nav-menu">
          <button className={`nav-item ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>
            <Icons.Dashboard /> Dashboard
          </button>
          <button className={`nav-item ${page === 'profile' ? 'active' : ''}`} onClick={() => setPage('profile')}>
            <Icons.User /> Profile & Meds
          </button>
        </nav>
        <button className="nav-item" onClick={handleLogout} style={{marginTop:'auto', color:'#ef4444'}}>
          <Icons.Logout /> Logout
        </button>
      </aside>

      {/* Main Content */}
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
          <motion.div className="bento-grid" initial={{opacity:0}} animate={{opacity:1}}>
            <div className="glass-card hero-card">
              <span className="label">Next Scheduled Dose</span>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
                <div>
                  <h2 style={{fontSize:'2.5rem', margin:'0.5rem 0 0 0', fontWeight:'700'}}>
                    {nextMed ? nextMed.name : "All Clear"}
                  </h2>
                  <p className="sub-text">{nextMed ? `At ${nextMed.time}` : "You've taken all your medications for today."}</p>
                </div>
                {nextMed && (
                  <button className="action-btn" style={{padding:'12px 24px'}} onClick={() => markTaken(nextMed._id)}>
                    Take Now
                  </button>
                )}
              </div>
            </div>

            <div className="glass-card stat-box" onClick={openAddModal} style={{cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
              <div style={{background:'var(--primary)', width:'50px', height:'50px', borderRadius:'25px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1rem'}}>
                <Icons.Plus />
              </div>
              <span style={{fontWeight:'600'}}>Add Med</span>
            </div>

            <div className="timeline-section">
              <h3 style={{marginBottom:'1rem', fontSize:'1.2rem'}}>Today's Schedule</h3>
              <div className="med-list">
                {meds.length === 0 && <div style={{color:'var(--text-muted)', textAlign:'center', padding:'2rem'}}>No medications scheduled for today.</div>}
                {meds.sort((a,b) => a.time.localeCompare(b.time)).map((med) => (
                  <motion.div key={med._id} className="med-item" layout>
                    <div className="med-time">{med.time}</div>
                    <div className="med-details" style={{flex:1}}>
                      <h3>{med.name}</h3>
                      <p>{med.dosage || 'Standard Dose'}</p>
                    </div>
                    <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                      <button onClick={() => openEditModal(med)} style={{background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer'}}><Icons.Edit /></button>
                      <button onClick={() => handleDeleteMed(med._id)} style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer'}}><Icons.Trash /></button>
                      {med.status === 'taken' ? (
                         <div style={{color:'#10b981', display:'flex', alignItems:'center', gap:'8px', fontWeight:'600'}}><Icons.Check /> Taken</div>
                      ) : (
                        <button className="action-btn" onClick={() => markTaken(med._id)}>Mark</button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {page === 'profile' && user && (
          <motion.div className="bento-grid" initial={{opacity:0}} animate={{opacity:1}}>
            <div className="glass-card" style={{gridColumn: 'span 2'}}>
               <div style={{display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem'}}>
                 <div style={{width:'60px', height:'60px', borderRadius:'30px', background:'var(--bg-card-hover)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem'}}>👤</div>
                 <div>
                   <h2 style={{margin:0}}>{user.email.split('@')[0]}</h2>
                   <p className="sub-text">{user.email}</p>
                 </div>
               </div>
               <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                 <div className="stat-box" style={{background:'rgba(255,255,255,0.03)', padding:'1rem', borderRadius:'12px'}}>
                   <span className="label">Total Discount</span>
                   <div className="value" style={{fontSize:'1.5rem'}}>{user.totalDiscount}% OFF</div>
                 </div>
                 <div className="stat-box" style={{background:'rgba(255,255,255,0.03)', padding:'1rem', borderRadius:'12px'}}>
                   <span className="label">Current Streak</span>
                   <div className="value" style={{fontSize:'1.5rem'}}>{user.streak} Days</div>
                 </div>
               </div>
            </div>

            <div className="glass-card" style={{gridColumn: 'span 2'}}>
               {/* Fixed Header Alignment */}
               <div className="card-header-row">
                  <span className="card-title"><Icons.Heart /> Care Network</span>
                  {user.caregiverEmail && <span style={{color:'#10b981', fontSize:'0.8rem'}}>● Active</span>}
               </div>
               
               {user.caregiverEmail ? (
                 <>
                   <h3 style={{margin:'0 0 0.5rem 0'}}>{user.caregiverEmail}</h3>
                   <p className="sub-text">Receives alerts for missed doses.</p>
                   <button className="action-btn" style={{marginTop:'1.5rem', width:'100%', background:'transparent', border:'1px solid var(--primary)'}} onClick={notifyCaregiver}>
                     <Icons.Bell /> Send Test Alert
                   </button>
                 </>
               ) : (
                 <div style={{textAlign:'center', padding:'1rem'}}>
                   <p className="sub-text">No caregiver linked.</p>
                   {/* FIXED Link Caregiver Button */}
                   <button className="action-btn" style={{marginTop:'0.5rem'}} onClick={openCaregiverModal}>
                     Link Caregiver
                   </button>
                 </div>
               )}
            </div>

            <div className="glass-card" style={{gridColumn: 'span 4'}}>
               {/* Fixed Add New Button Alignment */}
               <div className="card-header-row">
                 <h2 style={{fontSize:'1.25rem', margin:0}}>My Prescriptions</h2>
                 <button className="action-btn" onClick={openAddModal}><Icons.Plus /> Add New</button>
               </div>
               
               <div className="med-list">
                 {user.medications && user.medications.length > 0 ? (
                   user.medications.map((m, idx) => (
                     <div key={idx} className="med-item" style={{cursor:'default'}}>
                       <div style={{width:'40px', height:'40px', background:'var(--bg-app)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center'}}>💊</div>
                       <div style={{flex:1}}>
                         <h3 style={{fontSize:'1rem', margin:0}}>{m.name}</h3>
                         <p className="sub-text">{m.recurrence} • {m.time} • {m.dosage || '1 pill'}</p>
                       </div>
                       <div className="pill" style={{fontSize:'0.8rem', padding:'4px 10px'}}>Active</div>
                     </div>
                   ))
                 ) : (
                   <p className="sub-text" style={{textAlign:'center', padding:'2rem'}}>No prescriptions on file.</p>
                 )}
               </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* --- REUSABLE MODAL CONTENT --- */}
      <Modal isOpen={!!modalType} onClose={closeModal} title={modalType === 'caregiver' ? 'Caregiver Settings' : (modalType === 'editMed' ? 'Edit Medication' : 'Add Medication')}>
        
        {/* VIEW 1: Add/Edit Medication */}
        {(modalType === 'addMed' || modalType === 'editMed') && (
          <div style={{display:'flex', flexDirection:'column', gap:'1.25rem'}}>
            <div>
              <label className="label" style={{marginBottom:'8px', display:'block'}}>Medicine Name</label>
              <input className="input-modern" placeholder="e.g. Amoxicillin" value={medName} onChange={e => setMedName(e.target.value)} autoFocus />
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
              <div>
                <label className="label" style={{marginBottom:'8px', display:'block'}}>Time</label>
                <input className="input-modern" type="time" value={medTime} onChange={e => setMedTime(e.target.value)} />
              </div>
              <div>
                <label className="label" style={{marginBottom:'8px', display:'block'}}>Recurrence</label>
                <select className="input-modern" value={recurrence} onChange={e => setRecurrence(e.target.value)}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="none">One-time</option>
                </select>
              </div>
            </div>
            <button className="action-btn" style={{width:'100%', padding:'14px', marginTop:'0.5rem'}} onClick={handleMedSubmit}>
              {loading ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        )}

        {/* VIEW 2: Caregiver Link */}
        {modalType === 'caregiver' && (
          <div style={{display:'flex', flexDirection:'column', gap:'1.25rem'}}>
            <p className="sub-text">Enter the email address of a family member or caregiver. They will receive alerts if you miss a dose.</p>
            <div>
              <label className="label" style={{marginBottom:'8px', display:'block'}}>Caregiver Email</label>
              <input className="input-modern" type="email" placeholder="name@example.com" value={newCaregiverEmail} onChange={e => setNewCaregiverEmail(e.target.value)} autoFocus />
            </div>
            <button className="action-btn" style={{width:'100%', padding:'14px', marginTop:'0.5rem'}} onClick={handleCaregiverSubmit}>
              Link Account
            </button>
          </div>
        )}

      </Modal>
    </div>
  );
}

export default App;