Mediease
========

Modern medication management PWA with reminders, streaks, medicine discounts , gamification, and caregiver notifications. Live at https://mediease-coral.vercel.app/.

Why Mediease
------------
- PWA-first: installable, offline-friendly shell.
- Reliable reminders: email via Nodemailer plus in-app alerts; supports multiple daily dosages and mark-as-taken flow.
- Engaging: streaks, points, fun facts, celebratory animations (GSAP + Framer Motion), light/dark themes.
- Smart assist: Gemini AI integration for helpful guidance.
- Secure auth: bcrypt-hashed passwords, session persisted on refresh.
- Polished UI: glassmorphism styling, smooth transitions, responsive layout.

Features
--------
- Authentication: register/login, persisted sessions, caregiver email linking.
- Medication management: add/edit/delete meds with recurrence and multiple daily times; mark taken/missed; quick suggestions from common medicines list.
- Reminders & notifications: email alerts (Nodemailer) and app reminders; push-ready PWA setup.
- Streaks & points: daily adherence streak, points, achievements/fun facts.
- Dashboard: next-up card, timeline, refill-friendly flows, profile summary.
- Theming & UX: day/night mode, GSAP + Framer Motion animations, responsive design.

Tech Stack
----------
- Frontend: React 18, Vite, Framer Motion, GSAP, Axios, i18next, Firebase messaging setup.
- Backend: Node.js, Express, MongoDB/Mongoose, Nodemailer, Socket.io (prepared).
- Auth & security: bcrypt password hashing, CORS configured.
- Deploy: Vercel (frontend), configurable API base URL via `VITE_API_BASE_URL`.

Getting Started
---------------
Prereqs: Node 18+, npm.

1) Install deps  
```
npm install
cd client && npm install
cd ../server && npm install
```

2) Environment  
Create `server/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/mediease
CLIENT_URL=http://localhost:5173
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
ENCRYPTION_KEY=32_byte_secret_key_here
ENCRYPTION_IV=16_byte_iv_here
```
Create `client/.env`:
```
VITE_API_BASE_URL=http://localhost:5000
VITE_FIREBASE_VAPID_KEY=your_fcm_web_push_key_if_used
```

3) Run locally (two terminals)  
```
cd server && npm run dev
cd client && npm run dev
```
Frontend: http://localhost:5173, Backend: http://localhost:5000.

4) Build  
```
cd client && npm run build
```

PWA Notes
---------
- Install prompt available via browser (Add to Home Screen).
- Offline shell is served; background notifications wired via Firebase service worker when configured.

Project Structure
-----------------
- `client/src/App.jsx` — main app shell, routing between Auth/Dashboard/Profile/Streaks, theme toggle.
- `client/src/components/` — UI modules (Dashboard, Profile, Streaks, Modal, Sidebar, TimeScheduleInput, etc.).
- `client/src/data/indianMedicines.js` — common medicines suggestions.
- `client/src/firebase.js` & `public/firebase-messaging-sw.js` — Firebase messaging setup for push.
- `server/server.js` — Express bootstrap, Mongo connection, CORS/socket setup.
- `server/routes/` — auth (`userRoutes`), meds (`medicationRoutes`), notifications (`notificationRoutes`).
- `server/models/` — `User`, `Medication` schemas (streaks, points, history).

Key User Flows
--------------
- Sign up / login → landing in dashboard with persisted session.
- Add medication → choose time(s)/recurrence → reminders + streak tracking.
- Mark as taken → streak/points increment, fun feedback (confetti/animations).
- Link caregiver email → trigger alert via Nodemailer when needed.

Acknowledgments
---------------
- Built with React, Vite, GSAP, Framer Motion, Firebase, Node/Express, MongoDB, Nodemailer, bcrypt.

