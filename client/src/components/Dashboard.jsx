import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Icons } from './Icons';

const Dashboard = ({ user, meds, theme, toggleTheme, openAddModal, markTaken, openEditModal, handleDeleteMed }) => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".anim-card", { y: 30, opacity: 0, duration: 0.6, stagger: 0.05, ease: "power3.out" });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const nextMed = meds.filter(m => m.status === 'pending').sort((a, b) => a.time.localeCompare(b.time))[0];
  const [timeLeft, setTimeLeft] = React.useState('');

  React.useEffect(() => {
    if (!nextMed) { setTimeLeft(''); return; }
    const calculate = () => {
      const now = new Date();
      const [h, m] = nextMed.time.split(':');
      const dose = new Date(); dose.setHours(h, m, 0, 0);
      if (dose < now) { setTimeLeft('Overdue'); return; }
      const diff = dose - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${mins}m`);
    };
    calculate();
    const timer = setInterval(calculate, 60000);
    return () => clearInterval(timer);
  }, [nextMed]);

  return (
    <div className="bento-grid" ref={containerRef}>
      
      {/* HEADER */}
      <div className="glass-card header-unified anim-card">
        <div className="header-left">
          <h1>Dashboard</h1>
          <p>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="header-right">
          <div className="stat-group">
            <div className="stat-item"><div className="stat-val" style={{color:'#f59e0b'}}>🔥 {user?.streak || 0}</div><span className="stat-label">Streak</span></div>
            <div className="stat-item"><div className="stat-val" style={{color:'#6366f1'}}>💎 {user?.points || 0}</div><span className="stat-label">Points</span></div>
          </div>
          <button className="theme-toggle-btn" onClick={toggleTheme}>{theme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}</button>
        </div>
      </div>

      {/* --- SPLIT ROW: HERO + QUICK ADD --- */}
      <div className="split-card-row anim-card">
        
        {/* Hero Card */}
        <div className="glass-card hero-card">
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <span className="label">Next Up</span>
            {nextMed && timeLeft && (
              <div style={{background: timeLeft === 'Overdue' ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)', color: timeLeft === 'Overdue' ? '#ef4444' : '#818cf8', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', border:'1px solid rgba(255,255,255,0.1)'}}>
                {timeLeft === 'Overdue' ? '⚠️ Overdue' : `⏳ ${timeLeft}`}
              </div>
            )}
          </div>
          <div className="hero-content">
             <div>
               <h2 className="hero-title">{nextMed ? nextMed.name : "All Clear 🎉"}</h2>
               <p className="sub-text" style={{fontSize:'1.1rem'}}>{nextMed ? `${nextMed.time} • ${nextMed.dosage || 'Standard Dose'}` : "You've taken all your medications for today."}</p>
             </div>
             {nextMed && <button className="action-btn" onClick={() => markTaken(nextMed._id)}>Take Now</button>}
          </div>
        </div>

        {/* Quick Add */}
        <div className="glass-card center-content" onClick={openAddModal} style={{cursor:'pointer'}}>
          <div style={{background:'var(--primary)', width:'56px', height:'56px', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1rem', color:'white', boxShadow:'0 10px 20px var(--primary-glow)'}}>
            <Icons.Plus />
          </div>
          <span style={{fontWeight:'700', fontSize:'1rem'}}>Add Med</span>
        </div>

      </div>

      {/* TIMELINE */}
      <div className="glass-card anim-card" style={{gridColumn: 'span 4'}}>
        <div className="card-header-row"><h3 style={{fontSize:'1.2rem', fontWeight:'700', margin:0}}>Today's Schedule</h3></div>
        <div className="med-list">
          {meds.length === 0 && <div style={{textAlign:'center', padding:'3rem', color:'var(--text-muted)'}}>No medications scheduled.</div>}
          {meds.sort((a,b) => a.time.localeCompare(b.time)).map((med) => (
            <div key={med._id} className="med-item">
              <div style={{fontSize:'1.2rem', fontWeight:'700', color:'var(--primary)', fontFamily:'monospace'}}>{med.time}</div>
              <div style={{flex:1, marginLeft:'2rem'}}>
                <h3 style={{fontSize:'1.1rem', margin:0, fontWeight:'600'}}>{med.name}</h3>
                <p style={{fontSize:'0.9rem', color:'var(--text-muted)', margin:'4px 0 0 0'}}>{med.dosage || 'Standard Dose'}</p>
              </div>
              <div style={{display:'flex', gap:'12px'}}>
                <button onClick={() => openEditModal(med)} style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)'}}><Icons.Edit /></button>
                <button onClick={() => handleDeleteMed(med._id)} style={{background:'none', border:'none', cursor:'pointer', color:'#ef4444'}}><Icons.Trash /></button>
                {med.status === 'taken' ? <div style={{color:'#10b981', display:'flex', alignItems:'center', gap:'6px', fontWeight:'700'}}><Icons.Check /> Taken</div> : <button className="action-btn" style={{padding:'8px 16px', fontSize:'0.85rem'}} onClick={() => markTaken(med._id)}>Mark</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;