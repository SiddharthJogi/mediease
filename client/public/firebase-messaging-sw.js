importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging.js');

const firebaseConfig = {
  apiKey: "AIzaSyDdpmH6TQIUw8xdZQyR6U1DUbFroilpgD0",
  authDomain: "ez-med-75237.firebaseapp.com",
  projectId: "ez-med-75237",
  storageBucket: "ez-med-75237.firebasestorage.app",
  messagingSenderId: "1070569707081",
  appId: "1:1070569707081:web:bce33347a5efaaa1b11198",
  measurementId: "G-0QTJJWPMD0"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});