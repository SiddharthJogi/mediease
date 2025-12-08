import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from './Icons';

// Added 'meds' to the props destructuring
const Profile = ({ user, meds, openCaregiverModal, notifyCaregiver, openAddModal }) => {
  return (
    <motion.div className="bento-grid" initial={{opacity:0}} animate={{opacity:1}}>
      
      {/* Profile Info */}
      <div className="glass-card" style={{gridColumn: 'span 2'}}>
         <div className="flex-align" style={{marginBottom:'1.5rem', gap:'1rem'}}>
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

      {/* Caretaker Card */}
      <div className="glass-card" style={{gridColumn: 'span 2'}}>
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
             <button className="action-btn" style={{marginTop:'0.5rem'}} onClick={openCaregiverModal}>
               Link Caregiver
             </button>
           </div>
         )}
      </div>

      {/* Master Prescription List */}
      <div className="glass-card" style={{gridColumn: 'span 4'}}>
         <div className="card-header-row">
           <h2 style={{fontSize:'1.25rem', margin:0}}>My Prescriptions</h2>
           <button className="action-btn" onClick={openAddModal}><Icons.Plus /> Add New</button>
         </div>
         
         <div className="med-list">
           {/* SWITCHED FROM user.medications TO meds */}
           {meds && meds.length > 0 ? (
             meds.map((m, idx) => (
               <div key={m._id || idx} className="med-item" style={{cursor:'default'}}>
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
  );
};

export default Profile;