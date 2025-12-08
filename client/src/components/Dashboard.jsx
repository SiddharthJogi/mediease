import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icons } from './Icons';

const Dashboard = ({ meds, openAddModal, markTaken, openEditModal, handleDeleteMed }) => {
  // 1. Logic to find the next pending medication
  const nextMed = meds
    .filter(m => m.status === 'pending')
    .sort((a, b) => a.time.localeCompare(b.time))[0];

  // 2. Countdown State
  const [timeLeft, setTimeLeft] = useState('');

  // 3. Timer Logic
  useEffect(() => {
    if (!nextMed) {
      setTimeLeft('');
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      const [hours, minutes] = nextMed.time.split(':').map(Number);
      const doseTime = new Date();
      doseTime.setHours(hours, minutes, 0, 0);

      // If time has passed for today but it's still 'pending', it's overdue
      if (doseTime < now) {
        setTimeLeft('Overdue');
        return;
      }

      const diff = doseTime - now;
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${h}h ${m}m remaining`);
    };

    calculateTimeLeft(); // Run immediately
    const timerId = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timerId); // Cleanup
  }, [nextMed]);

  return (
    <motion.div className="bento-grid" initial={{opacity:0}} animate={{opacity:1}}>
      
      {/* Hero Card */}
      <div className="glass-card hero-card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
          <span className="label">Next Scheduled Dose</span>
          
          {/* TIMER BADGE */}
          {nextMed && timeLeft && (
            <div style={{
              background: timeLeft === 'Overdue' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
              color: timeLeft === 'Overdue' ? '#ef4444' : '#a5b4fc',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: '600',
              border: `1px solid ${timeLeft === 'Overdue' ? '#ef4444' : '#6366f1'}`
            }}>
              {timeLeft === 'Overdue' ? '⚠️ Overdue' : `⏳ ${timeLeft}`}
            </div>
          )}
        </div>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:'1rem'}}>
          <div>
            <h2 style={{fontSize:'2.5rem', margin:'0', fontWeight:'700'}}>
              {nextMed ? nextMed.name : "All Clear"}
            </h2>
            <p className="sub-text">
              {nextMed 
                ? `Scheduled for ${nextMed.time} • ${nextMed.dosage || 'Standard Dose'}` 
                : "You've taken all your medications for today."}
            </p>
          </div>
          {nextMed && (
            <button className="action-btn" style={{padding:'12px 24px'}} onClick={() => markTaken(nextMed._id)}>
              Take Now
            </button>
          )}
        </div>
      </div>

      {/* Quick Add Button */}
      <div className="glass-card stat-box" onClick={openAddModal} style={{cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
        <div style={{background:'var(--primary)', width:'50px', height:'50px', borderRadius:'25px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1rem'}}>
          <Icons.Plus />
        </div>
        <span style={{fontWeight:'600'}}>Add Med</span>
      </div>

      {/* Timeline */}
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
                <button onClick={() => openEditModal(med)} style={{background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer'}}>
                  <Icons.Edit />
                </button>
                <button onClick={() => handleDeleteMed(med._id)} style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer'}}>
                  <Icons.Trash />
                </button>
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
  );
};

export default Dashboard;