import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { messaging, getToken, onMessage } from './firebase';
import { useTranslation } from 'react-i18next';
import Confetti from 'react-confetti';
import DatePicker from 'react-datepicker';
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
      setUserId(res.data.userId);
      setCaregiverEmail(res.data.caregiverEmail || '');
      setStreak(res.data.streak || 0);
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
      setUserId(res.data.userId);
      setCaregiverEmail(res.data.caregiverEmail || '');
      setStreak(res.data.streak || 0);
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
    setUserId(null);
    setCaregiverEmail('');
    setMeds([]);
    setStreak(0);
    setFcmToken('');
    setPage('auth');
  };

  const handleAuth = () => {
    if (isRegistering) handleRegister();
    else handleLogin();
  };

  useEffect(() => {
    if (userId) {
      setLoading(true);
      axios.get(`${BASE_URL}/api/medications/user/${userId}`)
        .then((res) => {
          setMeds(res.data);
          console.log('Fetched meds:', res.data);
        })
        .catch((err) => console.error('Fetch meds error:', err))
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

  const handleVoiceInput = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = i18n.language;
    recognition.continuous = true;
    recognition.interimResults = true;
    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      setMedName(finalTranscript.trim() || interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Voice input error:', event.error);
      setError(t('voiceInputFailed'));
      recognition.stop();
    };

    recognition.onend = () => {
      if (!finalTranscript) recognition.start();
    };

    recognition.start();
    setTimeout(() => recognition.stop(), 10000);
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
      const today = new Date().toISOString().split('T')[0];
      const medsToday = meds.filter(m => m.date === today || m.recurrence === 'daily');
      const allTakenToday = medsToday.every(m => m.status === 'taken' || m._id === id);
      if (allTakenToday) {
        setStreak(streak + 1);
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
        <div className="auth-container">
          <div className="auth-overlay animate-glow">
            <div className="logo">Ez-Med</div>
            <h1 className="auth-title animate-title">{isRegistering ? t('register') : t('login')}</h1>
            {error && <p className="error animate-error">{error}</p>}
            <div className="input-group">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('email')}
                aria-label={t('email')}
                type="email"
                required
                className="auth-input animate-input"
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('password')}
                aria-label={t('password')}
                type="password"
                required
                className="auth-input animate-input"
              />
              {isRegistering && (
                <input
                  value={caregiverEmail}
                  onChange={(e) => setCaregiverEmail(e.target.value)}
                  placeholder={t('caregiverEmail')}
                  aria-label={t('caregiverEmail')}
                  type="email"
                  className="auth-input animate-input"
                />
              )}
            </div>
            <div className="button-group">
              <button onClick={handleAuth} className="auth-button animate-button" disabled={loading}>
                {isRegistering ? t('register') : t('login')}
              </button>
              <button onClick={() => setIsRegistering(!isRegistering)} className="auth-toggle animate-button" disabled={loading}>
                {isRegistering ? t('switchToLogin') : t('switchToRegister')}
              </button>
            </div>
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
          </div>
        </div>
      ) : (
        <div className="app-wrapper">
          <div className="sidebar animate-glow">
            <div className="logo">Ez-Med</div>
            <nav>
              <button onClick={() => setPage('home')} className={page === 'home' ? 'active animate-nav' : 'animate-nav'}>{t('Home')}</button>
              <button onClick={() => setPage('dashboard')} className={page === 'dashboard' ? 'active animate-nav' : 'animate-nav'}>{t('Dashboard')}</button>
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
                        <p>{('Streak')}</p>
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
                <div className="dashboard animate-page">
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
                    <button onClick={handleVoiceInput} className="voice-button animate-button animate-glow">🎙️</button>
                    <button onClick={addMed} className="add-button animate-button animate-glow" disabled={loading}>{t('addMed')}</button>
                  </div>
                  <div className="streak-section">
                    <p className="streak-text animate-glow">{t('streak', { count: streak })}</p>
                    <p className="streak-text animate-glow">
                      {t('medicinesToday', { taken: getTodayStats().takenToday, total: getTodayStats().totalToday })}
                    </p>
                  </div>
                  <div className="meds-section">
                    <h2>{t('yourMeds')}</h2>
                    <div className="meds-container">
                      {meds.map((med) => (
                        <div key={med._id} className={`med-card ${med.status === 'taken' ? 'taken' : med.status === 'missed' ? 'missed' : ''} animate-card animate-glow`}>
                          <div className="med-details">
                            <h3>{med.name}</h3>
                            <p>Date: {new Date(med.date).toLocaleDateString()}</p>
                            <p>Time: {med.time}</p>
                            <p>Recurrence: {med.recurrence}</p>
                            <p>Status: {med.status}</p>
                          </div>
                          {med.status === 'pending' && (
                            <button onClick={() => markTaken(med._id)} className="taken-button animate-button animate-glow" disabled={loading}>{t('markTaken')}</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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