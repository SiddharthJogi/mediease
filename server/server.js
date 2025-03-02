const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const { Server } = require('socket.io');
const http = require('http');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Medication = require('./models/Medication');
const userRoutes = require('./routes/userRoutes');
const medicationRoutes = require('./routes/medicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: 'http://localhost:5173' } });

admin.initializeApp({
  credential: admin.credential.cert(process.env.FIREBASE_KEY_PATH),
});

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use((req, res, next) => {
  req.io = io;
  next();
});

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
    } else {
      console.log('Test user already exists:', existingUser.email);
    }
  } catch (err) {
    console.error('User seeding error:', err);
  }
};

const seedData = async () => {
  await seedUser(); // Seed user only if not present
};
seedData();

app.get('/', (req, res) => res.send('✅ Backend running!'));
app.use('/api/users', userRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/medications/user/:userId', async (req, res) => {
  try {
    const meds = await Medication.find({ userId: req.params.userId });
    console.log('Returning meds for user:', req.params.userId, meds);
    res.status(200).json(meds);
  } catch (err) {
    console.error('Fetch user meds error:', err.stack || err.message);
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
server.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));