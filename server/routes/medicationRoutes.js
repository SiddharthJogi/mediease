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
    return encryptedName;
  }
};

const ensureDecryptedName = (med) => {
  const medObj = med.toObject ? med.toObject() : med;
  if (medObj.name) medObj.name = decryptName(medObj.name);
  return medObj;
};

const getTodayString = () => new Date().toISOString().split('T')[0];

// 1. GET User Medications
router.get('/user/:userId', async (req, res) => {
  try {
    const today = getTodayString();
    const meds = await Medication.find({ userId: req.params.userId });
    
    const dynamicMeds = meds.map(med => {
      const medObj = med.toObject();
      medObj.name = decryptName(medObj.name);
      
      const history = med.history || [];
      const takenToday = history.some(entry => entry.date === today && entry.status === 'taken');
      medObj.status = takenToday ? 'taken' : 'pending';
      
      // CRITICAL FIX: Ensure 'time' exists for Dashboard sorting
      if (!medObj.time) {
        medObj.time = (medObj.schedule && medObj.schedule.length > 0) ? medObj.schedule[0] : "09:00";
      }
      
      // Ensure schedule exists
      if (!medObj.schedule || medObj.schedule.length === 0) {
        medObj.schedule = medObj.time ? [medObj.time] : ["09:00"];
      }

      return medObj;
    });

    res.status(200).json(dynamicMeds);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 2. ADD Medication
router.post('/add', async (req, res) => {
  const { userId, name, date, time, recurrence, dosage, schedule } = req.body;

  if (!userId || !name) {
    return res.status(400).json({ message: 'User ID and Name are required' });
  }

  try {
    const med = new Medication({ 
      userId, 
      name, 
      date: date || getTodayString(), 
      recurrence: recurrence || 'daily',
      dosage: dosage || 'As prescribed',
      schedule: schedule || (time ? [time] : ["09:00"]),
      history: []
    });

    await med.save();
    
    // SYNC WITH USER PROFILE (FIXED)
    const user = await User.findById(userId);
    if (user) {
      user.medications.push({ 
        name, 
        recurrence, 
        // SAFETY: Always save a time string (even if taken from schedule array)
        time: med.schedule && med.schedule.length > 0 ? med.schedule[0] : (time || "09:00"),
        schedule: med.schedule,
        dosage: med.dosage
      });
      await user.save();
    }
    
    const medObj = ensureDecryptedName(med);
    res.status(201).json(medObj);
  } catch (err) {
    console.error('Add med error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 3. MARK TAKEN
router.post('/:id/status', async (req, res) => {
  try {
    const medId = req.params.id;
    const today = getTodayString();
    
    const med = await Medication.findById(medId);
    if (!med) return res.status(404).json({ message: 'Medication not found' });

    const history = med.history || [];
    const alreadyTaken = history.some(h => h.date === today);
    
    if (!alreadyTaken) {
      med.history.push({ date: today, status: 'taken' });
      if (!med.stats) med.stats = {};
      med.stats.totalTaken = (med.stats.totalTaken || 0) + 1;
      await med.save();

      const user = await User.findById(med.userId);
      if (user) {
        const userLastUpdate = user.lastStreakUpdate ? user.lastStreakUpdate.toISOString().split('T')[0] : null;
        if (userLastUpdate !== today) {
          user.streak = (user.streak || 0) + 1;
          user.points = (user.points || 0) + 10;
          user.lastStreakUpdate = new Date();
          user.totalDiscount = Math.min(Math.floor(user.points / 100), 20); 
          await user.save();
        }
        const medObj = ensureDecryptedName(med);
        // SAFETY: Add time back for UI
        medObj.time = medObj.schedule && medObj.schedule.length > 0 ? medObj.schedule[0] : "09:00";
        res.status(200).json({ ...medObj, status: 'taken', user: { streak: user.streak, points: user.points } });
      } else {
         const medObj = ensureDecryptedName(med);
         medObj.time = medObj.schedule && medObj.schedule.length > 0 ? medObj.schedule[0] : "09:00";
         res.status(200).json({ ...medObj, status: 'taken' });
      }

    } else {
      med.history = med.history.filter(h => h.date !== today);
      await med.save();
      const medObj = ensureDecryptedName(med);
      medObj.time = medObj.schedule && medObj.schedule.length > 0 ? medObj.schedule[0] : "09:00";
      res.status(200).json({ ...medObj, status: 'pending' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 4. UPDATE Medication
router.put('/update/:id', async (req, res) => {
  try {
    const { name, time, recurrence, date, dosage, schedule } = req.body;
    
    const updateData = { name, recurrence, date, dosage, schedule };

    // Legacy fix
    if ((!schedule || schedule.length === 0) && time) {
        updateData.schedule = [time];
    }

    const updatedMed = await Medication.findByIdAndUpdate(
      req.params.id, 
      { $set: updateData }, 
      { new: true }
    );

    if (!updatedMed) return res.status(404).json({ message: 'Medication not found' });

    const medObj = ensureDecryptedName(updatedMed);
    const today = getTodayString();
    const takenToday = (updatedMed.history || []).some(h => h.date === today && h.status === 'taken');
    medObj.status = takenToday ? 'taken' : 'pending';
    
    // SAFETY: Ensure time exists
    medObj.time = medObj.schedule && medObj.schedule.length > 0 ? medObj.schedule[0] : "09:00";

    res.status(200).json(medObj);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// 5. DELETE Medication
router.delete('/delete/:id', async (req, res) => {
  try {
    const med = await Medication.findByIdAndDelete(req.params.id);
    if (!med) return res.status(404).json({ message: 'Medication not found' });
    
    await User.updateOne(
      { _id: med.userId }, 
      { $pull: { medications: { name: med.name } } }
    );

    res.status(200).json({ message: 'Medication deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;