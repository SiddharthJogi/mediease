const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Medication = require('../models/Medication');
const User = require('../models/User');

// Helper to decrypt existing encrypted medication names
const decryptName = (encryptedName) => {
  try {
    if (!encryptedName || typeof encryptedName !== 'string') {
      return encryptedName;
    }
    // Check if it looks like encrypted data (long hex string, 64+ chars)
    if (!/^[0-9a-f]{64,}$/i.test(encryptedName)) {
      // Not encrypted, return as-is
      return encryptedName;
    }
    
    // Try to decrypt using the old encryption keys
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your32bytesecretkey1234567890123';
    const ENCRYPTION_IV = process.env.ENCRYPTION_IV || 'your16byteivhere';
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), Buffer.from(ENCRYPTION_IV));
    let decrypted = decipher.update(encryptedName, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    console.log('Decrypted medication name');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed, returning original:', err.message);
    // If decryption fails, return original (might be plain text or corrupted)
    return encryptedName;
  }
};

// Helper to ensure medication name is decrypted
const ensureDecryptedName = (med) => {
  const medObj = med.toObject ? med.toObject() : med;
  if (medObj.name) {
    medObj.name = decryptName(medObj.name);
  }
  return medObj;
};

router.post('/add', async (req, res) => {
  const { userId, name, date, time, recurrence } = req.body;
  console.log('Adding med:', { userId, name, date, time, recurrence });
  if (!userId || !name || !date || !time) {
    console.log('Missing fields:', { userId, name, date, time, recurrence });
    return res.status(400).json({ message: 'All fields (userId, name, date, time) are required' });
  }
  try {
    const med = new Medication({ userId, name, date, time, recurrence });
    console.log('Saving med to DB:', med);
    await med.save();
    
    // Add to user's medication profile if it doesn't exist
    const user = await User.findById(userId);
    if (user) {
      // Check if all medicines for today are already taken
      const today = new Date().toISOString().split('T')[0];
      const medsToday = await Medication.find({
        userId,
        $or: [
          { date: today },
          { recurrence: 'daily' }
        ]
      });
      const allTakenToday = medsToday.length > 0 && medsToday.every(m => m.status === 'taken');
      
      // If all medicines are taken and we're adding a new one, decrease streak to prevent exploitation
      if (allTakenToday && (date === today || recurrence === 'daily')) {
        if (user.streak > 0) {
          user.streak = Math.max(0, user.streak - 1);
          // Also reduce points proportionally
          user.points = Math.max(0, (user.points || 0) - 10);
          // Recalculate discount
          user.totalDiscount = Math.min(Math.floor((user.points || 0) / 100), 20);
          await user.save();
          console.log('Streak decreased due to new medicine after completion. New streak:', user.streak);
        }
      }
      
      const medExists = user.medications.some(m => m.name === name && m.time === time);
      if (!medExists && (recurrence === 'daily' || recurrence === 'weekly')) {
        user.medications.push({
          name,
          recurrence: recurrence || 'daily',
          time,
          dosage: '',
          notes: ''
        });
        await user.save();
        console.log('Added to user profile:', name);
      }
    }
    
    console.log('Medicine added successfully:', med);
    const medObj = ensureDecryptedName(med);
    res.status(201).json(medObj);
  } catch (err) {
    console.error('Add med error:', err.stack || err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  console.log('Fetching meds for user:', req.params.userId);
  try {
    const meds = await Medication.find({ userId: req.params.userId });
    // Decrypt any existing encrypted names
    const decryptedMeds = meds.map(med => ensureDecryptedName(med));
    console.log('Fetched meds:', decryptedMeds.length, 'medications');
    res.status(200).json(decryptedMeds);
  } catch (err) {
    console.error('Fetch meds error:', err.stack || err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/:id/status', async (req, res) => {
  console.log('Marking med as taken:', req.params.id);
  try {
    const med = await Medication.findByIdAndUpdate(req.params.id, { status: 'taken' }, { new: true });
    if (!med) {
      console.log('Medicine not found:', req.params.id);
      return res.status(404).json({ message: 'Medication not found' });
    }
    console.log('Medicine marked taken:', med);

    // Update streak and points logic - only once per day
    const user = await User.findById(med.userId);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastUpdateDate = user.lastStreakUpdate ? user.lastStreakUpdate.toISOString().split('T')[0] : null;
    
    // Only process streak if we haven't already updated it today
    if (lastUpdateDate !== today) {
      const medsToday = await Medication.find({ 
        userId: med.userId, 
        $or: [
          { date: today },
          { recurrence: 'daily' }
        ]
      });
      const allTakenToday = medsToday.every(m => m.status === 'taken' || m._id.toString() === med._id.toString());

      if (allTakenToday) {
        // Check if this is a consecutive day
        if (lastUpdateDate === yesterday) {
          // Consecutive day - increase streak
          user.streak += 1;
        } else if (lastUpdateDate && lastUpdateDate !== yesterday) {
          // Not consecutive - reset streak
          user.streak = 1;
        } else {
          // First time - start streak
          user.streak = 1;
        }
        
        // Award points (10 points per day)
        const pointsEarned = 10;
        user.points = (user.points || 0) + pointsEarned;
        
        // Calculate discount: 1% discount per 100 points (max 20%)
        const discountPercent = Math.min(Math.floor((user.points || 0) / 100), 20);
        user.totalDiscount = discountPercent;
        
        // Mark that we've updated the streak for today
        user.lastStreakUpdate = new Date();
        await user.save();
        console.log('Streak updated:', user.streak, 'Points:', user.points, 'Discount:', user.totalDiscount + '%');
      }
    }

    const medObj = ensureDecryptedName(med);
    res.status(200).json({ ...medObj, user: { streak: user.streak, points: user.points, totalDiscount: user.totalDiscount } });
  } catch (err) {
    console.error('Mark taken error:', err.stack || err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get recently taken medicines
router.get('/recent/:userId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const recentMeds = await Medication.find({ 
      userId: req.params.userId, 
      status: 'taken' 
    })
    .sort({ updatedAt: -1 })
    .limit(limit);
    // Decrypt any existing encrypted names
    const decryptedRecentMeds = recentMeds.map(med => ensureDecryptedName(med));
    res.status(200).json(decryptedRecentMeds);
  } catch (err) {
    console.error('Fetch recent meds error:', err.stack || err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Migration endpoint to decrypt all existing medication names
router.post('/migrate/decrypt-names', async (req, res) => {
  try {
    console.log('Starting migration to decrypt medication names...');
    const allMeds = await Medication.find({});
    let updated = 0;
    let errors = 0;
    
    for (const med of allMeds) {
      try {
        const decryptedName = decryptName(med.name);
        // Only update if name was actually encrypted and decrypted
        if (decryptedName !== med.name && /^[0-9a-f]{64,}$/i.test(med.name)) {
          med.name = decryptedName;
          await med.save();
          updated++;
        }
      } catch (err) {
        console.error(`Error decrypting med ${med._id}:`, err.message);
        errors++;
      }
    }
    
    console.log(`Migration complete. Updated: ${updated}, Errors: ${errors}`);
    res.status(200).json({ 
      message: 'Migration complete', 
      updated, 
      errors,
      total: allMeds.length 
    });
  } catch (err) {
    console.error('Migration error:', err.stack || err.message);
    res.status(500).json({ message: 'Migration failed', error: err.message });
  }
});

module.exports = router;