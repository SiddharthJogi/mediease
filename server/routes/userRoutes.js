const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');

router.post('/register', async (req, res) => {
  const { email, password, caregiverEmail } = req.body;
  console.log('Registering:', { email, caregiverEmail });
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  try {
    const user = new User({ email, password, caregiverEmail });
    await user.save();
    console.log('User registered:', user.email);
    res.status(201).json({ 
      userId: user._id, 
      caregiverEmail: user.caregiverEmail, 
      streak: user.streak || 0,
      points: user.points || 0,
      totalDiscount: user.totalDiscount || 0,
      medications: user.medications || []
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(400).json({ message: 'Registration failed', error: err.message });
  }
});

// Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      email: user.email,
      caregiverEmail: user.caregiverEmail,
      streak: user.streak || 0,
      points: user.points || 0,
      totalDiscount: user.totalDiscount || 0,
      medications: user.medications || []
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update user profile medications
router.put('/profile/:userId/medications', async (req, res) => {
  try {
    const { medications } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { medications: medications || [] },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ medications: user.medications });
  } catch (err) {
    console.error('Update medications error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Logging in:', email);
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log('Password mismatch for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    console.log('Login successful for:', email);
    res.status(200).json({ 
      userId: user._id, 
      caregiverEmail: user.caregiverEmail || '', 
      streak: user.streak || 0,
      points: user.points || 0,
      totalDiscount: user.totalDiscount || 0,
      medications: user.medications || []
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/* routes/userRoutes.js (Add this new route) */

// Update User Profile (Generic) - Used for linking caregiver
router.put('/profile/:userId', async (req, res) => {
  try {
    const { caregiverEmail } = req.body;
    const updates = {};
    
    if (caregiverEmail !== undefined) updates.caregiverEmail = caregiverEmail;
    
    // You can add other fields here later if needed (e.g. name, phone)

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: updates },
      { new: true } // Return the updated document
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ 
      success: true, 
      user: {
        email: user.email,
        caregiverEmail: user.caregiverEmail,
        streak: user.streak,
        points: user.points,
        totalDiscount: user.totalDiscount,
        medications: user.medications
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;