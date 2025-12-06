import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { messaging, getToken, onMessage } from './firebase';
import { useTranslation } from 'react-i18next';
import Confetti from 'react-confetti';
import DatePicker from 'react-datepicker';
import { motion, AnimatePresence } from 'framer-motion';
import 'react-datepicker/dist/react-datepicker.css';
import './App.css';

function App() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState(null);
  const [caregiverEmail, setCaregiverEmail] = useState('');
  const [medName, setMedName] = useState('');
  const [medDate, setMedDate] = useState(new Date());
  const [medTime, setMedTime] = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const [meds, setMeds] = useState([]);
  const [theme, setTheme] = useState('day');
  const [fcmToken, setFcmToken] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [recentMeds, setRecentMeds] = useState([]);
  const [profileMedications, setProfileMedications] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [page, setPage] = useState('auth');
  const [languageOpen, setLanguageOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTutorial, setShowTutorial] = useState(!localStorage.getItem('tutorialShown'));

  const BASE_URL = 'http://localhost:5000';

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t('fieldsRequired'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${BASE_URL}/api/users/login`, { email, password });
      const userData = {
        userId: res.data.userId,
        caregiverEmail: res.data.caregiverEmail || '',
        streak: res.data.streak || 0,
        points: res.data.points || 0,
        totalDiscount: res.data.totalDiscount || 0,
        medications: res.data.medications || []
      };
      
      // Save to localStorage for persistence
      localStorage.setItem('mediease_user', JSON.stringify(userData));
      
      setUserId(userData.userId);
      setCaregiverEmail(userData.caregiverEmail);
      setStreak(userData.streak);
      setPoints(userData.points);
      setTotalDiscount(userData.totalDiscount);
      setProfileMedications(userData.medications);
      setPage('dashboard');
      console.log('Login successful:', res.data);
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      setError(t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      setError(t('fieldsRequired'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${BASE_URL}/api/users/register`, { email, password, caregiverEmail });
      const userData = {
        userId: res.data.userId,
        caregiverEmail: res.data.caregiverEmail || '',
        streak: res.data.streak || 0,
        points: res.data.points || 0,
        totalDiscount: res.data.totalDiscount || 0,
        medications: res.data.medications || []
      };
      
      // Save to localStorage for persistence
      localStorage.setItem('mediease_user', JSON.stringify(userData));
      
      setUserId(userData.userId);
      setCaregiverEmail(userData.caregiverEmail);
      setStreak(userData.streak);
      setPoints(userData.points);
      setTotalDiscount(userData.totalDiscount);
      setProfileMedications(userData.medications);
      setPage('dashboard');
      console.log('Register successful:', res.data);
    } catch (err) {
      console.error('Register error:', err.response?.data || err.message);
      setError(t('registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('mediease_user');
    setUserId(null);
    setCaregiverEmail('');
    setMeds([]);
    setRecentMeds([]);
    setStreak(0);
    setPoints(0);
    setTotalDiscount(0);
    setProfileMedications([]);
    setFcmToken('');
    setPage('auth');
  };

  const handleAuth = () => {
    if (isRegistering) handleRegister();
    else handleLogin();
  };

  // Restore login state on page load
  useEffect(() => {
    const savedUser = localStorage.getItem('mediease_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUserId(userData.userId);
        setCaregiverEmail(userData.caregiverEmail || '');
        setStreak(userData.streak || 0);
        setPoints(userData.points || 0);
        setTotalDiscount(userData.totalDiscount || 0);
        setProfileMedications(userData.medications || []);
        setPage('dashboard');
        console.log('Restored user session:', userData);
      } catch (err) {
        console.error('Error restoring session:', err);
        localStorage.removeItem('mediease_user');
      }
    }
  }, []);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      Promise.all([
        axios.get(`${BASE_URL}/api/medications/user/${userId}`),
        axios.get(`${BASE_URL}/api/medications/recent/${userId}?limit=5`),
        axios.get(`${BASE_URL}/api/users/profile/${userId}`)
      ])
        .then(([medsRes, recentRes, profileRes]) => {
          setMeds(medsRes.data);
          setRecentMeds(recentRes.data);
          setPoints(profileRes.data.points || 0);
          setTotalDiscount(profileRes.data.totalDiscount || 0);
          setStreak(profileRes.data.streak || 0);
          setProfileMedications(profileRes.data.medications || []);
          
          // Update localStorage with fresh data
          const userData = {
            userId,
            caregiverEmail: profileRes.data.caregiverEmail || '',
            streak: profileRes.data.streak || 0,
            points: profileRes.data.points || 0,
            totalDiscount: profileRes.data.totalDiscount || 0,
            medications: profileRes.data.medications || []
          };
          localStorage.setItem('mediease_user', JSON.stringify(userData));
          
          console.log('Fetched data:', { meds: medsRes.data, recent: recentRes.data, profile: profileRes.data });
        })
        .catch((err) => {
          console.error('Fetch error:', err);
          // If fetch fails, might be invalid session, clear it
          if (err.response?.status === 401 || err.response?.status === 404) {
            localStorage.removeItem('mediease_user');
            setUserId(null);
            setPage('auth');
          }
        })
        .finally(() => setLoading(false));
    }
  }, [userId]);

  const addMed = async () => {
    if (!medName || !medTime || (recurrence !== 'daily' && !medDate)) {
      setError(t('fieldsRequired'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formattedDate = recurrence === 'daily' ? new Date().toISOString().split('T')[0] : medDate.toISOString().split('T')[0];
      const res = await axios.post(`${BASE_URL}/api/medications/add`, {
        userId,
        name: medName,
        date: formattedDate,
        time: medTime,
        recurrence,
      });
      setMeds([...meds, res.data]);
      
      // Refresh profile medications and user stats (streak might have decreased)
      const profileRes = await axios.get(`${BASE_URL}/api/users/profile/${userId}`);
      setProfileMedications(profileRes.data.medications || []);
      setStreak(profileRes.data.streak || 0);
      setPoints(profileRes.data.points || 0);
      setTotalDiscount(profileRes.data.totalDiscount || 0);
      
      // Update localStorage
      const userData = {
        userId,
        caregiverEmail: profileRes.data.caregiverEmail || '',
        streak: profileRes.data.streak || 0,
        points: profileRes.data.points || 0,
        totalDiscount: profileRes.data.totalDiscount || 0,
        medications: profileRes.data.medications || []
      };
      localStorage.setItem('mediease_user', JSON.stringify(userData));
      
      setMedName('');
      setMedDate(new Date());
      setMedTime('');
      setRecurrence('none');
      console.log('Medicine added:', res.data);
      scheduleNotification(res.data);
    } catch (err) {
      console.error('Add med error:', err.response?.data || err.message);
      setError(t('addMedFailed'));
    } finally {
      setLoading(false);
    }
  };


  const scheduleNotification = (med) => {
    const [hours, minutes] = med.time.split(':');
    const medDateTime = new Date(med.date);
    medDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    const timeDiff = medDateTime - new Date();
    if (timeDiff > 0 && fcmToken) {
      setTimeout(() => {
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(t('takeMed', { name: med.name })));
        axios.post(`${BASE_URL}/api/notifications/send`, {
          userId,
          fcmToken,
          title: `Take ${med.name}`,
          body: `It's time for ${med.name} at ${med.time}`,
        }).then(() => console.log('Notification scheduled:', med.name))
          .catch(err => console.error('Notification error:', err));
      }, timeDiff);
    }
  };

  useEffect(() => {
    if (userId) {
      meds.forEach(med => {
        if (med.status === 'pending') scheduleNotification(med);
      });
    }
  }, [meds, userId, fcmToken]);

  useEffect(() => {
    if (userId) {
      getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' })
        .then((token) => {
          setFcmToken(token);
          console.log('FCM Token:', token);
        })
        .catch((err) => console.error('FCM Error:', err));
      onMessage(messaging, (payload) => {
        alert(payload.notification.body);
      });
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      const socket = io(BASE_URL);
      socket.on('missedDose', (data) => {
        setMeds((prev) => prev.map((m) => (m._id === data.medId ? { ...m, status: 'missed' } : m)));
        setStreak(0);
        setError(t('missedDose', { name: data.name }));
      });
      socket.on('connect_error', (err) => console.error('Socket error:', err));
      const interval = setInterval(() => {
        axios.post(`${BASE_URL}/api/notifications/check-missed`, { userId, caregiverEmail, fcmToken })
          .catch((err) => console.error('Check missed error:', err));
      }, 60000);
      return () => {
        socket.disconnect();
        clearInterval(interval);
      };
    }
  }, [userId, caregiverEmail, fcmToken, t]);

  const markTaken = async (id) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${BASE_URL}/api/medications/${id}/status`);
      setMeds((prev) => prev.map((m) => (m._id === id ? res.data : m)));
      
      // Update points and discount if returned
      if (res.data.user) {
        setPoints(res.data.user.points || 0);
        setTotalDiscount(res.data.user.totalDiscount || 0);
        setStreak(res.data.user.streak || 0);
        
        // Update localStorage
        const savedUser = JSON.parse(localStorage.getItem('mediease_user') || '{}');
        const updatedUser = {
          ...savedUser,
          streak: res.data.user.streak || 0,
          points: res.data.user.points || 0,
          totalDiscount: res.data.user.totalDiscount || 0
        };
        localStorage.setItem('mediease_user', JSON.stringify(updatedUser));
      }
      
      // Refresh recent medicines
      const recentRes = await axios.get(`${BASE_URL}/api/medications/recent/${userId}?limit=5`);
      setRecentMeds(recentRes.data);
      
      const today = new Date().toISOString().split('T')[0];
      const medsToday = meds.filter(m => {
        const medDate = new Date(m.date).toISOString().split('T')[0];
        return medDate === today || m.recurrence === 'daily';
      });
      const allTakenToday = medsToday.every(m => m.status === 'taken' || m._id === id);
      if (allTakenToday) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    } catch (err) {
      console.error('Mark taken error:', err);
      setError(t('markTakenFailed'));
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'day' ? 'night' : 'day');
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayMeds = meds.filter(med => {
      const medDate = new Date(med.date).toISOString().split('T')[0];
      return medDate === today || med.recurrence === 'daily';
    });
    const takenToday = todayMeds.filter(med => med.status === 'taken').length;
    const totalToday = todayMeds.length;
    return { takenToday, totalToday };
  };

  useEffect(() => {
    if (userId && showTutorial) localStorage.setItem('tutorialShown', 'true');
  }, [userId, showTutorial]);

  return (
    <div className={`app ${theme}`}>
      {loading && <div className="loader">{t('loading')}</div>}
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}
      {page === 'auth' && !userId ? (
        <motion.div 
          className="auth-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="auth-overlay animate-glow"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <motion.div 
              className="logo"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >Ez-Med</motion.div>
            <motion.h1 
              className="auth-title animate-title"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >{isRegistering ? t('register') : t('login')}</motion.h1>
            <AnimatePresence>
              {error && (
                <motion.p 
                  className="error animate-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >{error}</motion.p>
              )}
            </AnimatePresence>
            <motion.div 
              className="input-group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <motion.input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('email')}
                aria-label={t('email')}
                type="email"
                required
                className="auth-input animate-input"
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              <motion.input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('password')}
                aria-label={t('password')}
                type="password"
                required
                className="auth-input animate-input"
                whileFocus={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              <AnimatePresence>
                {isRegistering && (
                  <motion.input
                    value={caregiverEmail}
                    onChange={(e) => setCaregiverEmail(e.target.value)}
                    placeholder={t('caregiverEmail')}
                    aria-label={t('caregiverEmail')}
                    type="email"
                    className="auth-input animate-input"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
            <motion.div 
              className="button-group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button 
                onClick={handleAuth} 
                className="auth-button animate-button" 
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {loading ? '...' : (isRegistering ? t('register') : t('login'))}
              </motion.button>
              <motion.button 
                onClick={() => setIsRegistering(!isRegistering)} 
                className="auth-toggle animate-button" 
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {isRegistering ? t('switchToLogin') : t('switchToRegister')}
              </motion.button>
            </motion.div>
            <div className="language-dropdown">
              <button onClick={() => setLanguageOpen(!languageOpen)} className="lang-toggle animate-button">
                {i18n.language === 'en' ? 'English' : i18n.language === 'es' ? 'Español' : i18n.language === 'fr' ? 'Français' : 'Deutsch'}
              </button>
              {languageOpen && (
                <div className="dropdown-menu animate-dropdown">
                  <button onClick={() => { i18n.changeLanguage('en'); setLanguageOpen(false); }}>English</button>
                  <button onClick={() => { i18n.changeLanguage('es'); setLanguageOpen(false); }}>Español</button>
                  <button onClick={() => { i18n.changeLanguage('fr'); setLanguageOpen(false); }}>Français</button>
                  <button onClick={() => { i18n.changeLanguage('de'); setLanguageOpen(false); }}>Deutsch</button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <div className="app-wrapper">
          <div className="sidebar animate-glow">
            <div className="logo">Ez-Med</div>
            <nav>
              <button onClick={() => setPage('home')} className={page === 'home' ? 'active animate-nav' : 'animate-nav'}>{t('Home')}</button>
              <button onClick={() => setPage('dashboard')} className={page === 'dashboard' ? 'active animate-nav' : 'animate-nav'}>{t('Dashboard')}</button>
              <button onClick={() => setPage('profile')} className={page === 'profile' ? 'active animate-nav' : 'animate-nav'}>Profile</button>
              <button onClick={() => setPage('about')} className={page === 'about' ? 'active animate-nav' : 'animate-nav'}>{t('about')}</button>
              <button onClick={() => setPage('settings')} className={page === 'settings' ? 'active animate-nav' : 'animate-nav'}>{t('settings')}</button>
            </nav>
          </div>
          <div className="dashboard-wrapper">
            {userId && showTutorial && (
              <div className="tutorial-overlay">
                <div className="tutorial-content animate-zoom">
                  <h2>{t('welcome')}</h2>
                  <p>{t('tutorial')}</p>
                  <button onClick={() => setShowTutorial(false)} className="tutorial-close animate-button">{t('gotIt')}</button>
                </div>
              </div>
            )}
            <div className="dashboard-content">
              {page === 'home' && (
                <div className="dashboard animate-page">
                  <div className="dashboard-header">
                    <h1>{t('welcome')}</h1>
                  </div>
                  <div className="content-card animate-glow">
                    <p>{t('homeDesc')}</p>
                    <div className="home-stats">
                      <div className="stat-card animate-glow">
                        <h3>{streak}</h3>
                        <p>🔥 Streak Days</p>
                      </div>
                      <div className="stat-card animate-glow">
                        <h3>{points}</h3>
                        <p>⭐ Points</p>
                      </div>
                      <div className="stat-card animate-glow">
                        <h3>{totalDiscount}%</h3>
                        <p>💰 Discount</p>
                      </div>
                      <div className="stat-card animate-glow">
                        <h3>{meds.length}</h3>
                        <p>{t('medsLogged')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {page === 'dashboard' && (
                <motion.div 
                  className="dashboard animate-page"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="dashboard-header">
                    <h1>{t('medAdherence')}</h1>
                    <div className="dashboard-controls">
                      <button onClick={toggleTheme} className="theme-toggle animate-button animate-glow">{theme === 'day' ? '🌙' : '☀️'}</button>
                      <button onClick={handleLogout} className="logout-button animate-button animate-glow">{t('logout')}</button>
                    </div>
                  </div>
                  {error && <p className="error animate-error">{error}</p>}
                  <div className="input-section">
                    <input
                      value={medName}
                      onChange={(e) => setMedName(e.target.value)}
                      placeholder={t('medName')}
                      aria-label={t('medName')}
                      required
                      className="med-input animate-input animate-glow"
                    />
                    {recurrence !== 'daily' && (
                      <DatePicker
                        selected={medDate}
                        onChange={(date) => setMedDate(date)}
                        dateFormat="yyyy-MM-dd"
                        className="med-date animate-input animate-glow"
                        aria-label={t('medDate')}
                      />
                    )}
                    <input
                      value={medTime}
                      type="time"
                      onChange={(e) => setMedTime(e.target.value)}
                      aria-label={t('medTime')}
                      required
                      className="time-input animate-input animate-glow"
                    />
                    <select
                      value={recurrence}
                      onChange={(e) => setRecurrence(e.target.value)}
                      className="recurrence-select animate-input animate-glow"
                      aria-label={t('recurrence')}
                    >
                      <option value="none">{t('none')}</option>
                      <option value="daily">{t('daily')}</option>
                      <option value="weekly">{t('weekly')}</option>
                    </select>
                    <button onClick={addMed} className="add-button animate-button animate-glow" disabled={loading}>{t('addMed')}</button>
                  </div>
                  <motion.div 
                    className="streak-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="stats-grid">
                      <motion.div 
                        className="stat-badge animate-glow"
                        whileHover={{ scale: 1.05, y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <span className="stat-icon">🔥</span>
                        <motion.span 
                          className="stat-value"
                          key={streak}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >{streak}</motion.span>
                        <span className="stat-label">Day Streak</span>
                      </motion.div>
                      <motion.div 
                        className="stat-badge animate-glow"
                        whileHover={{ scale: 1.05, y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <span className="stat-icon">⭐</span>
                        <motion.span 
                          className="stat-value"
                          key={points}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >{points}</motion.span>
                        <span className="stat-label">Points</span>
                      </motion.div>
                      <motion.div 
                        className="stat-badge animate-glow"
                        whileHover={{ scale: 1.05, y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <span className="stat-icon">💰</span>
                        <motion.span 
                          className="stat-value"
                          key={totalDiscount}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400 }}
                        >{totalDiscount}%</motion.span>
                        <span className="stat-label">Discount</span>
                      </motion.div>
                    </div>
                    <motion.p 
                      className="today-stats animate-glow"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      {t('medicinesToday', { taken: getTodayStats().takenToday, total: getTodayStats().totalToday })}
                    </motion.p>
                  </motion.div>
                  {recentMeds.length > 0 && (
                    <div className="recent-meds-section">
                      <h2>Recently Taken Medicines</h2>
                      <div className="meds-container">
                        {recentMeds.map((med, index) => (
                          <motion.div 
                            key={med._id} 
                            className="med-card taken animate-card animate-glow"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02, y: -5 }}
                          >
                            <div className="med-details">
                              <h3>{med.name || 'Unknown Medication'}</h3>
                              <p>Date: {new Date(med.date).toLocaleDateString()}</p>
                              <p>Time: {med.time}</p>
                              <p className="taken-badge">✓ Taken</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="meds-section">
                    <h2>{t('yourMeds')}</h2>
                    <div className="meds-container">
                      {meds.length === 0 ? (
                        <p className="no-meds">No medications logged yet. Add one above!</p>
                      ) : (
                        meds.map((med, index) => (
                          <motion.div 
                            key={med._id} 
                            className={`med-card ${med.status === 'taken' ? 'taken' : med.status === 'missed' ? 'missed' : ''} animate-card animate-glow`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02, y: -5 }}
                          >
                            <div className="med-details">
                              <h3>{med.name || 'Unknown Medication'}</h3>
                              <p>Date: {new Date(med.date).toLocaleDateString()}</p>
                              <p>Time: {med.time}</p>
                              <p>Recurrence: {med.recurrence}</p>
                              <p>Status: {med.status}</p>
                            </div>
                            {med.status === 'pending' && (
                              <motion.button 
                                onClick={() => markTaken(med._id)} 
                                className="taken-button animate-button animate-glow" 
                                disabled={loading}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400 }}
                              >{t('markTaken')}</motion.button>
                            )}
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
              {page === 'about' && (
                <div className="dashboard animate-page">
                  <div className="dashboard-header">
                    <h1>{t('about')}</h1>
                  </div>
                  <div className="content-card animate-glow">
                    <p>{t('aboutDesc')}</p>
                    <div className="about-team">
                      <h3>{t('team')}</h3>
                      <p>{t('teamDesc')}</p>
                    </div>
                  </div>
                </div>
              )}
              {page === 'profile' && (
                <div className="dashboard animate-page">
                  <div className="dashboard-header">
                    <h1>My Profile</h1>
                  </div>
                  <div className="content-card animate-glow">
                    <div className="profile-section">
                      <h2>Your Statistics</h2>
                      <div className="profile-stats">
                        <div className="profile-stat-item">
                          <span className="profile-stat-label">Current Streak</span>
                          <span className="profile-stat-value">{streak} days 🔥</span>
                        </div>
                        <div className="profile-stat-item">
                          <span className="profile-stat-label">Total Points</span>
                          <span className="profile-stat-value">{points} ⭐</span>
                        </div>
                        <div className="profile-stat-item">
                          <span className="profile-stat-label">Available Discount</span>
                          <span className="profile-stat-value">{totalDiscount}% 💰</span>
                        </div>
                        <div className="profile-stat-item">
                          <span className="profile-stat-label">Total Medications</span>
                          <span className="profile-stat-value">{meds.length}</span>
                        </div>
                      </div>
                    </div>
                    <div className="profile-section">
                      <h2>My Medication Profile</h2>
                      {profileMedications.length === 0 ? (
                        <p className="no-meds">No medications in your profile yet. Add medications from the dashboard to build your profile!</p>
                      ) : (
                        <div className="profile-medications">
                          {profileMedications.map((med, index) => (
                            <div key={index} className="profile-med-card animate-card animate-glow">
                              <h3>{med.name}</h3>
                              <p><strong>Time:</strong> {med.time}</p>
                              <p><strong>Recurrence:</strong> {med.recurrence}</p>
                              {med.dosage && <p><strong>Dosage:</strong> {med.dosage}</p>}
                              {med.notes && <p><strong>Notes:</strong> {med.notes}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="profile-section">
                      <h2>Discount Information</h2>
                      <div className="discount-info">
                        <p>Earn points by maintaining your medication streak! For every day you complete your medications, you earn 10 points.</p>
                        <p><strong>Discount Tiers:</strong></p>
                        <ul className="discount-tiers">
                          <li>100 points = 1% discount</li>
                          <li>200 points = 2% discount</li>
                          <li>500 points = 5% discount</li>
                          <li>1000 points = 10% discount</li>
                          <li>2000 points = 20% discount (Maximum)</li>
                        </ul>
                        <p className="current-discount">Your current discount: <strong>{totalDiscount}%</strong></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {page === 'settings' && (
                <div className="dashboard animate-page">
                  <div className="dashboard-header">
                    <h1>{t('settings')}</h1>
                  </div>
                  <div className="content-card animate-glow">
                    <div className="settings-option">
                      <label className="settings-label">{t('language')}</label>
                      <div className="language-dropdown">
                        <button onClick={() => setLanguageOpen(!languageOpen)} className="lang-toggle animate-button animate-glow">
                          {i18n.language === 'en' ? 'English' : i18n.language === 'es' ? 'Español' : i18n.language === 'fr' ? 'Français' : 'Deutsch'}
                        </button>
                        {languageOpen && (
                          <div className="dropdown-menu animate-dropdown">
                            <button onClick={() => { i18n.changeLanguage('en'); setLanguageOpen(false); }}>English</button>
                            <button onClick={() => { i18n.changeLanguage('es'); setLanguageOpen(false); }}>Español</button>
                            <button onClick={() => { i18n.changeLanguage('fr'); setLanguageOpen(false); }}>Français</button>
                            <button onClick={() => { i18n.changeLanguage('de'); setLanguageOpen(false); }}>Deutsch</button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="settings-option">
                      <label className="settings-label">{t('theme')}</label>
                      <button onClick={toggleTheme} className="theme-toggle animate-button animate-glow">
                        {theme === 'day' ? '🌙 Night' : '☀️ Day'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <footer className="footer">
            <p>{t('footer')}</p>
          </footer>
        </div>
      )}
    </div>
  );
}

export default App;