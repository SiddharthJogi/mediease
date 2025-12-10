import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'; // Keep this import
import './index.css';
import App from './App.jsx';
import './i18n';
import { BrowserRouter } from 'react-router-dom';

// FIX: Do not use "ReactDOM.createRoot". Use just "createRoot"
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);