const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const Medication = require('../models/Medication');
const User = require('../models/User');
const { decrypt } = require('../models/Medication');

router.post('/check-missed', async (req, res) => {
  const { userId, caregiverEmail, fcmToken } = req.body;
  try {
    const now = new Date().toTimeString().slice(0, 5);
    const meds = await Medication.find({ userId, status: 'pending' });
    const missed = meds.filter(med => decrypt(med.time) < now);

    for (const med of missed) {
      await Medication.updateOne({ _id: med._id }, { status: 'missed' });
      const message = {
        notification: {
          title: 'Missed Dose',
          body: `Missed ${decrypt(med.name)} at ${decrypt(med.time)}`,
        },
        token: fcmToken,
      };
      await admin.messaging().send(message);
      console.log('Notified user of missed dose:', med._id);

      const user = await User.findById(userId);
      if (user.caregiverEmail) {
        const caregiver = await User.findOne({ email: caregiverEmail });
        if (caregiver && caregiver.fcmToken) {
          const caregiverMessage = {
            notification: {
              title: 'Patient Missed Dose',
              body: `${decrypt(med.name)} was missed at ${decrypt(med.time)}`,
            },
            token: caregiver.fcmToken,
          };
          await admin.messaging().send(caregiverMessage);
          console.log('Caregiver notified:', caregiverEmail);
        }
        req.io.emit('missedDose', { userId, caregiverEmail, medId: med._id, name: decrypt(med.name) });
      }
    }
    res.status(200).json({ message: 'Checked', missed: missed.length });
  } catch (err) {
    console.error('Check missed error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;