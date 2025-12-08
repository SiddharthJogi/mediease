/* routes/notificationRoutes.js */
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const User = require('../models/User');

// --- CONFIGURATION ---
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Email Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// 1. Notify Caregiver Route
router.post('/notify-caregiver', async (req, res) => {
  const { userId, type, message } = req.body;
  
  console.log(`[ALERT START] Attempting to notify caregiver for User ID: ${userId}`);

  try {
    if (!EMAIL_USER || !EMAIL_PASS) {
      throw new Error("Missing Email Credentials in Environment Variables");
    }

    const user = await User.findById(userId);
    if (!user || !user.caregiverEmail) {
      console.log("[ALERT FAIL] No caregiver linked.");
      return res.status(400).json({ message: 'Caregiver not linked' });
    }

    const subject = `Ez-Med Alert: ${user.email} needs attention`;
    const body = message || `The user ${user.email} has missed a medication or requested assistance.`;

    // SEND EMAIL
    const info = await transporter.sendMail({
      from: `"Ez-Med System" <${EMAIL_USER}>`, // <--- FIX: Must match auth user
      to: user.caregiverEmail,
      subject: subject,
      text: body
    });

    console.log(`[ALERT SUCCESS] Email sent. Message ID: ${info.messageId}`);
    res.status(200).json({ success: true, message: 'Caregiver notified' });

  } catch (error) {
    console.error('[ALERT ERROR] Failed to send email:', error.message);
    // Send 500 so frontend knows it failed
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;