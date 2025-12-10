const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Medication = require('../models/Medication');
const User = require('../models/User');

// --- HELPER: Encryption/Decryption ---
const decryptName = (encryptedName) => {
  try {
    if (!encryptedName || typeof encryptedName !== 'string') return encryptedName;
    // Basic check to see if it looks like hex (optional but good safety)
    if (!/^[0-9a-f]{64,}$/i.test(encryptedName)) return encryptedName;
    
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your32bytesecretkey1234567890123';
    const ENCRYPTION_IV = process.env.ENCRYPTION_IV || 'your16byteivhere';
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), Buffer.from(ENCRYPTION_IV));
    let decrypted = decipher.update(encryptedName, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // console.error('Decryption failed:', err.message); // Optional logging
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
    
    // Transform data: Decrypt & Calculate status
    const dynamicMeds = meds.map(med => {
      const medObj = med.toObject();
      
      // 1. Decrypt Name
      medObj.name = decryptName(medObj.name);

      // 2. Check History (Has this been taken TODAY?)
      const history = med.history || [];
      const takenToday = history.some(entry => entry.date === today && entry.status === 'taken');
      
      // 3. Set Status
      medObj.status = takenToday ? 'taken' : 'pending';
      
      // 4. Ensure Schedule exists (Backwards Compatibility)
      if (!medObj.schedule || medObj.schedule.length === 0) {
        medObj.schedule = medObj.time ? [medObj.time] : ["09:00"];
      }

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
// 2. ADD Medication (Updated for Schedule Array)
// ==========================================
router.post('/add', async (req, res) => {
  // Destructure new fields: dosage, schedule
  const { userId, name, date, time, recurrence, dosage, schedule } = req.body;

  if (!userId || !name) {
    return res.status(400).json({ message: 'User ID and Name are required' });
  }

  try {
    const med = new Medication({ 
      userId, 
      name, // Will be encrypted by pre-save hook in Model if you have one
      date: date || getTodayString(), 
      recurrence: recurrence || 'daily',
      dosage: dosage || 'As prescribed',
      
      // LOGIC: Use new schedule array OR fallback to single time
      schedule: schedule || (time ? [time] : ["09:00"]),
      
      history: [] // Initialize empty history
    });

    await med.save();
    
    // Sync with User Profile (Optional backup)
    const user = await User.findById(userId);
    if (user) {
      // We push a simplified object to the user array
      user.medications.push({ 
        name, 
        recurrence, 
        schedule: med.schedule 
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


// ==========================================
// 3. MARK TAKEN (Preserved History Logic)
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
      if (user) {
        const userLastUpdate = user.lastStreakUpdate ? user.lastStreakUpdate.toISOString().split('T')[0] : null;

        if (userLastUpdate !== today) {
          user.streak = (user.streak || 0) + 1;
          user.points = (user.points || 0) + 10;
          user.lastStreakUpdate = new Date();
          // Cap discount at 20%
          user.totalDiscount = Math.min(Math.floor(user.points / 100), 20); 
          await user.save();
        }
      
        const medObj = ensureDecryptedName(med);
        res.status(200).json({ 
          ...medObj, 
          status: 'taken', 
          user: { streak: user.streak, points: user.points } 
        });
      } else {
         const medObj = ensureDecryptedName(med);
         res.status(200).json({ ...medObj, status: 'taken' });
      }

    } else {
      // ALREADY TAKEN TODAY -> TOGGLE BACK TO PENDING (Undo)
      // This is useful if user clicked by mistake
      med.history = med.history.filter(h => h.date !== today);
      await med.save();

      const medObj = ensureDecryptedName(med);
      res.status(200).json({ ...medObj, status: 'pending' });
    }

  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// ==========================================
// 4. UPDATE Medication (Fixed for Dosage/Schedule)
// ==========================================
router.put('/update/:id', async (req, res) => {
  try {
    // Destructure all possible fields
    const { name, time, recurrence, date, dosage, schedule } = req.body;
    
    // Create update object
    const updateData = {
        name,
        recurrence,
        date,
        dosage,
        schedule
    };

    // If schedule is missing but time is provided (legacy fix), use time
    if ((!schedule || schedule.length === 0) && time) {
        updateData.schedule = [time];
    }

    // Find and update
    const updatedMed = await Medication.findByIdAndUpdate(
      req.params.id,
      { $set: updateData }, 
      { new: true } // Return the updated document
    );

    if (!updatedMed) return res.status(404).json({ message: 'Medication not found' });

    const medObj = ensureDecryptedName(updatedMed);
    
    // Recalculate status for UI
    const today = getTodayString();
    const takenToday = (updatedMed.history || []).some(h => h.date === today && h.status === 'taken');
    medObj.status = takenToday ? 'taken' : 'pending';

    res.status(200).json(medObj);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// ==========================================
// 5. DELETE Medication
// ==========================================
router.delete('/delete/:id', async (req, res) => {
  try {
    const med = await Medication.findByIdAndDelete(req.params.id);
    if (!med) return res.status(404).json({ message: 'Medication not found' });
    
    // Remove from User's medications array
    await User.updateOne(
      { _id: med.userId }, 
      { $pull: { medications: { name: med.name } } } // Simplified pull by Name
    );

    res.status(200).json({ message: 'Medication deleted successfully' });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;