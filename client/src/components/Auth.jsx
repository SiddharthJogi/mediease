import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import axios from 'axios';
import Logo from '../assets/logo with text.svg'; 

const Auth = ({ setUser, setPage, refreshData, BASE_URL }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [caregiverEmail, setCaregiverEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const cardRef = useRef(null);

  useEffect(() => {
    gsap.from(cardRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    });
  }, []);

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
      alert("Authentication failed. Check credentials or connection."); 
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box" ref={cardRef}>
        
        {/* Logo Section */}
        <div style={{display:'flex', justifyContent:'center', marginBottom:'1rem'}}>
           <img src={Logo} alt="Mediease" style={{height:'60px'}} />
        </div>
        
        {/* Header */}
        <div>
          <h2 className="auth-title">
            {isRegistering ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="auth-subtitle">
            {isRegistering ? "Start your health journey today" : "Enter your details to access your dashboard"}
          </p>
        </div>
        
        {/* Form Fields */}
        <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
          <input 
            className="input-auth" 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="Email Address" 
            autoFocus
          />
          <input 
            className="input-auth" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Password" 
          />
          
          {isRegistering && (
             <input 
               className="input-auth" 
               type="email" 
               value={caregiverEmail} 
               onChange={e => setCaregiverEmail(e.target.value)} 
               placeholder="Caregiver Email (Optional)" 
             />
          )}

          <button className="btn-auth-primary" onClick={handleAuth} disabled={loading}>
            {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
          </button>
          
          <button 
            onClick={() => setIsRegistering(!isRegistering)} 
            className="btn-auth-link"
          >
            {isRegistering ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;