import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';

const streakFacts = [
  { emoji: "🔥", title: "Keep the Fire Burning", desc: "Consistency is key. Every day you take your meds, your streak grows." },
  { emoji: "💎", title: "Points = Rewards", desc: "Earn 10 points per dose. Reach 500 points to unlock Platinum status." },
  { emoji: "🛡️", title: "Health Fortress", desc: "A perfect streak improves your health outcomes by over 40%." }
];

const Streaks = ({ user, theme, toggleTheme }) => {
  const [index, setIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // FIX: This now targets the class we added below
      gsap.from(".anim-card", { 
        y: 50, 
        opacity: 0, 
        duration: 0.8, 
        stagger: 0.1, 
        ease: "power3.out" 
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const nextSlide = () => setIndex((prev) => (prev + 1) % streakFacts.length);

  return (
    <div className="bento-grid" ref={containerRef}>
      
      {/* HEADER (Added anim-card) */}
      <div className="glass-card header-unified anim-card">
        <div className="header-left"><h1>My Journey</h1><p>Track your consistency</p></div>
        <div className="header-right">
          <div className="stat-group">
             <div className="stat-item"><div className="stat-val" style={{color:'#f59e0b'}}>🔥 {user?.streak}</div><span className="stat-label">Streak</span></div>
          </div>
          <button className="theme-toggle-btn" onClick={toggleTheme}>{theme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}</button>
        </div>
      </div>

      {/* MAIN STREAK DISPLAY (Added anim-card) */}
      <div className="glass-card center-content anim-card" style={{gridColumn: 'span 4', minHeight: '350px', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(236,72,153,0.08))'}}>
        <div className="label" style={{fontSize:'1rem'}}>CURRENT STREAK</div>
        <h1 style={{fontSize:'6rem', margin:'0', fontWeight:'800', lineHeight:'1', background: 'linear-gradient(to right, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
          {user?.streak || 0} Days
        </h1>
        <p className="sub-text" style={{marginTop:'1rem', maxWidth:'400px'}}>You are doing great! Don't break the chain to keep your Gold status.</p>
      </div>

      {/* SLIDER (Added anim-card) */}
      <div className="glass-card anim-card" style={{gridColumn: 'span 2', display:'flex', flexDirection:'column', justifyContent:'center', textAlign:'center', position:'relative', minHeight:'250px'}}>
        <AnimatePresence mode='wait'>
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{fontSize:'3rem', marginBottom:'1rem'}}>{streakFacts[index].emoji}</div>
            <h3 style={{fontSize:'1.5rem', margin:'0 0 0.5rem 0', color: 'var(--text-main)'}}>{streakFacts[index].title}</h3>
            <p className="sub-text">{streakFacts[index].desc}</p>
          </motion.div>
        </AnimatePresence>
        <button onClick={nextSlide} className="action-btn" style={{marginTop:'1.5rem', width:'fit-content', alignSelf:'center'}}>Next Fact →</button>
      </div>

      {/* REWARDS (Added anim-card) */}
      <div className="glass-card center-content anim-card" style={{gridColumn: 'span 2'}}>
        <div style={{fontSize:'3rem', marginBottom:'1rem'}}>🎁</div>
        <h3 style={{fontSize:'1.5rem', margin:'0', color: 'var(--text-main)'}}>Next Reward</h3>
        <div className="value-large" style={{color: '#ec4899', margin:'0.5rem 0'}}>500 Pts</div>
        <p className="sub-text">Reach Platinum to unlock.</p>
      </div>

    </div>
  );
};

export default Streaks;