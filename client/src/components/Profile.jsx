import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Icons } from './Icons';

const Profile = ({ user, meds, theme, toggleTheme, openCaregiverModal, notifyCaregiver, openAddModal }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".anim-card", { y: 20, opacity: 0, duration: 0.5, stagger: 0.05, ease: "power2.out" });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Membership Logic
  const getMembership = (points) => {
    if (points >= 500) return { name: "Platinum", color: "#e5e7eb" };
    if (points >= 200) return { name: "Gold", color: "#f59e0b" };
    if (points >= 100) return { name: "Silver", color: "#94a3b8" };
    return { name: "Bronze", color: "#b45309" };
  };

  const membership = getMembership(user?.points || 0);

  return (
    <div className="bento-grid" ref={containerRef}>
      
      {/* HEADER */}
      <div className="glass-card header-unified anim-card">
        <div className="header-left"><h1>My Profile</h1><p>{user.email}</p></div>
        <div className="header-right">
          <div className="stat-group">
            <div className="stat-item"><div className="stat-val" style={{color:'#f59e0b'}}>🔥 {user?.streak}</div><span className="stat-label">Streak</span></div>
            <div className="stat-item"><div className="stat-val" style={{color:'#6366f1'}}>💎 {user?.points || 0}</div><span className="stat-label">Points</span></div>
          </div>
          <button className="theme-toggle-btn" onClick={toggleTheme}>{theme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}</button>
        </div>
      </div>

      {/* --- SPLIT ROW: MEMBERSHIP + CARE NETWORK --- */}
      <div className="split-card-row anim-card">
        
        {/* Membership Status */}
        <div className="glass-card" style={{display:'flex', flexDirection:'row', alignItems:'center', gap:'2rem', justifyContent:'flex-start'}}>
           <div style={{width:'80px', height:'80px', borderRadius:'50%', background:'var(--bg-card-hover)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem', border:`2px solid ${membership.color}`}}>🛡️</div>
           <div>
             <span className="label">Current Status</span>
             <div style={{fontSize:'2rem', fontWeight:'800', lineHeight:1, color: membership.color, marginBottom:'0.5rem'}}>{membership.name} Member</div>
             <p className="sub-text">You have unlocked {user.totalDiscount}% off on medicines.</p>
           </div>
        </div>

        {/* Care Network */}
        <div className="glass-card">
           <div className="card-header-row">
              <span className="label" style={{margin:0}}>Care Network</span>
              {user.caregiverEmail && <span style={{color:'#10b981', fontSize:'0.75rem', fontWeight:'700', background:'rgba(34, 197, 94, 0.1)', padding:'4px 8px', borderRadius:'100px'}}>ACTIVE</span>}
           </div>
           {user.caregiverEmail ? (
             <div style={{height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
               <h3 style={{margin:'0', fontSize:'1.1rem', wordBreak:'break-all'}}>{user.caregiverEmail}</h3>
               <button className="secondary-btn" style={{marginTop:'1rem', width:'100%'}} onClick={notifyCaregiver}>
                 <Icons.Bell /> Send Alert
               </button>
             </div>
           ) : (
             <div className="center-content">
               <p className="sub-text">No caregiver linked.</p>
               <button className="action-btn" style={{marginTop:'1rem'}} onClick={openCaregiverModal}>Link Now</button>
             </div>
           )}
        </div>

      </div>

      {/* PRESCRIPTIONS */}
      <div className="glass-card anim-card" style={{gridColumn: 'span 4'}}>
         <div className="card-header-row">
           <h2 style={{fontSize:'1.2rem', margin:0, fontWeight:'700'}}>My Prescriptions</h2>
           <button className="action-btn" onClick={openAddModal}><Icons.Plus /> Add New</button>
         </div>
         <div className="med-list">
           {meds && meds.length > 0 ? meds.map((m, idx) => (
               <div key={m._id || idx} className="med-item">
                 <div style={{width:'40px', height:'40px', background:'var(--bg-card-hover)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center'}}>💊</div>
                 <div style={{flex:1, marginLeft:'1.5rem'}}>
                   <h3 style={{fontSize:'1.1rem', margin:0}}>{m.name}</h3>
                   <p className="sub-text">{m.recurrence} • {m.time}</p>
                 </div>
                 <div className="label" style={{marginBottom:0, background:'var(--bg-card-hover)', padding:'4px 8px', borderRadius:'6px'}}>Active</div>
               </div>
             )) : <p className="sub-text" style={{textAlign:'center', padding:'3rem'}}>No prescriptions on file.</p>}
         </div>
      </div>
    </div>
  );
};

export default Profile;