const express = require('express');
const dotenv = require('dotenv');

// 1. Load environment variables first!
dotenv.config(); 

const mongoose = require('mongoose');
const cors = require('cors');
//const admin = require('firebase-admin');
const { Server } = require('socket.io');
const http = require('http');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Medication = require('./models/Medication');
const userRoutes = require('./routes/userRoutes');
const medicationRoutes = require('./routes/medicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');


const app = express();
const server = http.createServer(app);

// --- DYNAMIC CORS CONFIGURATION ---
// In production, we use the CLIENT_URL env var. Locally, we fall back to 5173.
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, { 
  cors: { 
    origin: clientUrl,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  } 
});

app.use(cors({ 
  origin: clientUrl, 
  credentials: true 
}));

app.use(express.json());
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- FIREBASE SETUP (DISABLED FOR NOW) ---
// admin.initializeApp({
//   credential: admin.credential.cert(process.env.FIREBASE_KEY_PATH),
// });

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB Error:', err));

const seedUser = async () => {
  try {
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('123', 10);
      const user = new User({
        email: 'test@example.com',
        password: hashedPassword,
        caregiverEmail: 'caregiver@example.com',
        fcmToken: 'placeholder-fcm-token-for-test-user',
      });
      await user.save();
      console.log('Test user seeded: test@example.com / 123');
    }
  } catch (err) {
    console.error('User seeding error:', err);
  }
};

const seedData = async () => {
  await seedUser(); 
};
seedData();

app.get('/', (req, res) => res.send('✅ Backend is Running!'));
app.use('/api/users', userRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/notifications', notificationRoutes); // Routes will exist, but firebase logic inside might fail if triggered

app.get('/api/medications/user/:userId', async (req, res) => {
  try {
    const meds = await Medication.find({ userId: req.params.userId });
    res.status(200).json(meds);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

io.on('connection', (socket) => {
  console.log('✅ Client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));