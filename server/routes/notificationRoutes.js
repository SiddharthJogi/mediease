/* routes/notificationRoutes.js */
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const nodemailer = require('nodemailer'); // Requires: npm install nodemailer
const twilio = require('twilio');         // Requires: npm install twilio
const Medication = require('../models/Medication');
const User = require('../models/User');

// --- CONFIGURATION (Move these to .env in production) ---
const EMAIL_USER = process.env.EMAIL_USER || 'your-email@gmail.com'; 
const EMAIL_PASS = process.env.EMAIL_PASS || 'your-app-password';
const TWILIO_SID = process.env.TWILIO_SID || 'AC...';
const TWILIO_TOKEN = process.env.TWILIO_TOKEN || '...';
const TWILIO_FROM = process.env.TWILIO_FROM || '+1234567890';

// Email Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

// Twilio Client
const twilioClient = new twilio(TWILIO_SID, TWILIO_TOKEN);

// 1. Manual Trigger: Notify Caregiver
router.post('/notify-caregiver', async (req, res) => {
  const { userId, type, message } = req.body; // type: 'email' or 'whatsapp'
  
  try {
    const user = await User.findById(userId);
    if (!user || !user.caregiverEmail) {
      return res.status(400).json({ message: 'Caregiver not configured' });
    }

    const subject = `Ez-Med Alert: ${user.email} needs attention`;
    const body = message || `The user ${user.email} has missed a medication or requested assistance.`;

    if (type === 'email' || type === 'all') {
      await transporter.sendMail({
        from: '"Ez-Med System" <no-reply@ezmed.com>',
        to: user.caregiverEmail,
        subject: subject,
        text: body
      });
      console.log('Email sent to', user.caregiverEmail);
    }

    if (type === 'whatsapp' || type === 'all') {
      // Note: WhatsApp usually requires the recipient's phone number, 
      // which we currently don't store. Assuming caregiverEmail might be phone for this demo
      // or you need to add a caregiverPhone field to the User model.
      console.log('WhatsApp logic placeholder - requires caregiverPhone field');
      // await twilioClient.messages.create({
      //   body: body,
      //   from: `whatsapp:${TWILIO_FROM}`,
      //   to: `whatsapp:${user.caregiverPhone}`
      // });
    }

    res.status(200).json({ success: true, message: 'Caregiver notified' });
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Automated Missed Dose Check (Existing logic extended)
router.post('/check-missed', async (req, res) => {
  // ... (Your existing Firebase logic here) ...
  // You can inject the nodemailer/twilio calls inside the loop here as well.
});

module.exports = router;