import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDdpmH6TQIUw8xdZQyR6U1DUbFroilpgD0",
  authDomain: "ez-med-75237.firebaseapp.com",
  projectId: "ez-med-75237",
  storageBucket: "ez-med-75237.firebasestorage.app",
  messagingSenderId: "1070569707081",
  appId: "1:1070569707081:web:bce33347a5efaaa1b11198",
  measurementId: "G-0QTJJWPMD0"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging, getToken, onMessage };


