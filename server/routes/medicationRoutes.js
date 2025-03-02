const express = require('express');
const router = express.Router();
const Medication = require('../models/Medication');
const User = require('../models/User');

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
    console.log('Medicine added successfully:', med);
    res.status(201).json(med);
  } catch (err) {
    console.error('Add med error:', err.stack || err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  console.log('Fetching meds for user:', req.params.userId);
  try {
    const meds = await Medication.find({ userId: req.params.userId });
    console.log('Fetched meds:', meds);
    res.status(200).json(meds);
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

    // Update streak logic
    const user = await User.findById(med.userId);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const medsToday = await Medication.find({ userId: med.userId, date: today });
    const allTakenToday = medsToday.every(m => m.status === 'taken');

    if (allTakenToday) {
      const lastUpdate = user.lastStreakUpdate.toISOString().split('T')[0];
      if (lastUpdate === yesterday) {
        user.streak += 1;
      } else if (lastUpdate !== today) {
        user.streak = 1; // Reset if not consecutive
      }
      user.lastStreakUpdate = new Date();
      await user.save();
      console.log('Streak updated:', user.streak);
    }

    res.status(200).json(med);
  } catch (err) {
    console.error('Mark taken error:', err.stack || err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;