import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const Auth = ({ setUser, setPage, refreshData, BASE_URL }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [caregiverEmail, setCaregiverEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

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
    } catch (e) { 
      alert("Authentication failed: " + (e.response?.data?.message || e.message)); 
    }
    setLoading(false);
  };

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
              <input 
                className="input-modern" 
                type="email" 
                value={caregiverEmail} 
                onChange={e => setCaregiverEmail(e.target.value)} 
                placeholder="Caregiver Email (Optional)" 
              />
            </motion.div>
          )}

          <button className="action-btn" style={{width:'100%', padding:'14px', marginTop:'0.5rem'}} onClick={handleAuth} disabled={loading}>
            {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
          </button>
          
          <div style={{textAlign:'center', marginTop:'1rem'}}>
            <button 
              onClick={() => setIsRegistering(!isRegistering)} 
              style={{background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.9rem'}}
            >
              {isRegistering ? "Already have an account? Sign In" : "First time? Create Account"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;