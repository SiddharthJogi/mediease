const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const User = require('../models/User');

// --- CRITICAL FIX: Define transporter inside the route or use a getter function.
// Since it's only used here, defining it here is okay if EMAIL_USER is loaded early.

// 1. Notify Caregiver Route
router.post('/notify-caregiver', async (req, res) => {
  const { userId, type, message } = req.body;
  
  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;

  console.log(`[ALERT START] Attempting to notify caregiver for User ID: ${userId}`);

  try {
    // 1. Check Credentials
    if (!EMAIL_USER || !EMAIL_PASS || EMAIL_USER.includes('your-')) {
      console.error("Missing/Generic Email Credentials.");
      return res.status(500).json({ message: 'Server Misconfiguration: Email credentials not loaded.' });
    }
    
    // 2. Re-create transporter with EXPLICIT SSL settings
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',  // Use explicit host
      port: 465,               // Force SSL port (crucial for Render)
      secure: true,            // true for 465, false for other ports
      auth: { 
          user: EMAIL_USER, 
          pass: EMAIL_PASS 
      },
      // Add these timeout settings to prevent hanging
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000, 
    });

    // 3. Find User
    const user = await User.findById(userId);
    if (!user || !user.caregiverEmail) {
      return res.status(400).json({ message: 'Caregiver not linked' });
    }

    const subject = `Ez-Med Alert: ${user.email} needs attention`;
    const body = message || `The user ${user.email} has missed a medication or requested assistance.`;

    // 4. SEND EMAIL
    const info = await transporter.sendMail({
      from: `"Ez-Med System" <${EMAIL_USER}>`, 
      to: user.caregiverEmail,
      subject: subject,
      text: body
    });

    console.log(`[ALERT SUCCESS] Email sent. Message ID: ${info.messageId}`);
    res.status(200).json({ success: true, message: 'Caregiver notified' });

  } catch (error) {
    // This catches authentication errors (incorrect password) and connection timeouts
    console.error('[ALERT ERROR] Failed to send email:', error);
    if (error.code === 'EENVELOPE') {
       return res.status(500).json({ success: false, error: 'Email configuration error (Sender/Recipient)' });
    }
    res.status(500).json({ success: false, error: 'SMTP Timeout or Auth Failure. Check App Password.' });
  }
});

// 2. Automated Missed Dose Check (Mock for now)
router.post('/check-missed', async (req, res) => {
  console.log('[CHECK] Checking for missed medications...');
  res.status(200).json({ message: 'Checked', missed: 0 });
});


module.exports = router;