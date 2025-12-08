const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Medication = require('../models/Medication');
const User = require('../models/User');

// --- HELPER: Encryption/Decryption ---
const decryptName = (encryptedName) => {
  try {
    if (!encryptedName || typeof encryptedName !== 'string') return encryptedName;
    if (!/^[0-9a-f]{64,}$/i.test(encryptedName)) return encryptedName;
    
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your32bytesecretkey1234567890123';
    const ENCRYPTION_IV = process.env.ENCRYPTION_IV || 'your16byteivhere';
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), Buffer.from(ENCRYPTION_IV));
    let decrypted = decipher.update(encryptedName, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return encryptedName;
  }
};

const ensureDecryptedName = (med) => {
  const medObj = med.toObject ? med.toObject() : med;
  if (medObj.name) medObj.name = decryptName(medObj.name);
  return medObj;
};

// --- HELPER: Date String (YYYY-MM-DD) ---
const getTodayString = () => new Date().toISOString().split('T')[0];


// ==========================================
// 1. GET User Medications (Dynamic Reset)
// ==========================================
router.get('/user/:userId', async (req, res) => {
  try {
    const today = getTodayString();
    const meds = await Medication.find({ userId: req.params.userId });
    
    // Transform data: Calculate status dynamically
    const dynamicMeds = meds.map(med => {
      const medObj = med.toObject();
      medObj.name = decryptName(medObj.name);

      // Check history: Has this specific medicine been taken TODAY?
      // Note: 'history' field must exist in Medication model (see previous step)
      const history = med.history || [];
      const takenToday = history.some(entry => entry.date === today && entry.status === 'taken');
      
      // Force the status sent to frontend based on today's history
      // If taken today -> 'taken'. If not -> 'pending'.
      medObj.status = takenToday ? 'taken' : 'pending';
      
      return medObj;
    });

    console.log(`Fetched ${dynamicMeds.length} meds for user ${req.params.userId}. Date: ${today}`);
    res.status(200).json(dynamicMeds);
  } catch (err) {
    console.error('Fetch meds error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// ==========================================
// 2. ADD Medication
// ==========================================
router.post('/add', async (req, res) => {
  const { userId, name, date, time, recurrence } = req.body;
  if (!userId || !name || !date || !time) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const med = new Medication({ 
      userId, 
      name, 
      date, 
      time, 
      recurrence,
      history: [] // Initialize empty history
    });
    await med.save();
    
    // Sync with User Profile (Optional backup)
    const user = await User.findById(userId);
    if (user) {
      user.medications.push({ name, recurrence, time });
      await user.save();
    }
    
    const medObj = ensureDecryptedName(med);
    res.status(201).json(medObj);
  } catch (err) {
    console.error('Add med error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// ==========================================
// 3. MARK TAKEN (History Logic)
// ==========================================
router.post('/:id/status', async (req, res) => {
  try {
    const medId = req.params.id;
    const today = getTodayString();
    
    const med = await Medication.findById(medId);
    if (!med) return res.status(404).json({ message: 'Medication not found' });

    // Check if already taken today
    const history = med.history || [];
    const alreadyTaken = history.some(h => h.date === today);
    
    if (!alreadyTaken) {
      // 1. Update Medication History
      med.history.push({ date: today, status: 'taken' });
      // Update basic stats
      if (!med.stats) med.stats = {};
      med.stats.totalTaken = (med.stats.totalTaken || 0) + 1;
      await med.save();

      // 2. Update User Streak & Points (Only once per day globally)
      const user = await User.findById(med.userId);
      const userLastUpdate = user.lastStreakUpdate ? user.lastStreakUpdate.toISOString().split('T')[0] : null;

      if (userLastUpdate !== today) {
        user.streak = (user.streak || 0) + 1;
        user.points = (user.points || 0) + 10;
        user.lastStreakUpdate = new Date();
        user.totalDiscount = Math.min(Math.floor(user.points / 100), 20); // Cap at 20%
        await user.save();
      }
      
      const medObj = ensureDecryptedName(med);
      res.status(200).json({ 
        ...medObj, 
        status: 'taken', 
        user: { streak: user.streak, points: user.points } 
      });
    } else {
      // It's already taken, just return success
      const medObj = ensureDecryptedName(med);
      res.status(200).json({ ...medObj, status: 'taken' });
    }

  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// ==========================================
// 4. UPDATE Medication (New)
// ==========================================
router.put('/update/:id', async (req, res) => {
  try {
    const { name, time, recurrence, date } = req.body;
    
    // Find and update
    const updatedMed = await Medication.findByIdAndUpdate(
      req.params.id,
      { $set: { name, time, recurrence, date } }, 
      { new: true } // Return the updated document
    );

    if (!updatedMed) return res.status(404).json({ message: 'Medication not found' });

    const medObj = ensureDecryptedName(updatedMed);
    
    // We calculate status again to ensure UI consistency
    const today = getTodayString();
    const takenToday = (updatedMed.history || []).some(h => h.date === today && h.status === 'taken');
    medObj.status = takenToday ? 'taken' : 'pending';

    res.status(200).json(medObj);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// server/routes/medicationRoutes.js

// ... existing code ...

// 5. DELETE Medication (Fixed to update User profile too)
router.delete('/delete/:id', async (req, res) => {
  try {
    const med = await Medication.findByIdAndDelete(req.params.id);
    if (!med) return res.status(404).json({ message: 'Medication not found' });
    
    // KEY FIX: Remove from User's medications array
    // This assumes your User model has a medications array storing objects with a matching name or ID.
    // If your User schema stores simplified meds without IDs, we match by name & time.
    // Ideally, store the medication ID in the User schema for reliable deletion.
    
    // Option A: If User.medications stores just Name/Time (based on your schema)
    await User.updateOne(
      { _id: med.userId }, 
      { $pull: { medications: { name: med.name, time: med.time } } }
    );

    res.status(200).json({ message: 'Medication deleted successfully' });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;