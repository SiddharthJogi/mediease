const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer'); // Import nodemailer
const User = require('../models/User');

// --- EMAIL CONFIGURATION ---
// We create a "transporter" that logs into your Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Defined in .env or Render
    pass: process.env.EMAIL_PASS  // Your App Password (not login password)
  }
});

// 1. Notify Caregiver (Real Email)
router.post('/notify-caregiver', async (req, res) => {
  const { userId, type } = req.body;
  
  try {
    const user = await User.findById(userId);
    if (!user || !user.caregiverEmail) {
      return res.status(400).json({ message: 'Caregiver not linked' });
    }

    // Email Content
    const mailOptions = {
      from: `"Ez-Med Alert System" <${process.env.EMAIL_USER}>`,
      to: user.caregiverEmail,
      subject: `⚠️ Ez-Med Alert: Assistance Needed for ${user.email}`,
      text: `Hello,\n\nThe user ${user.email} has triggered a manual alert from their Ez-Med dashboard.\n\nPlease check on them.\n\n- Ez-Med Team`
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SENT] To: ${user.caregiverEmail} | User: ${user.email}`);

    res.status(200).json({ success: true, message: 'Email sent successfully' });

  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

// 2. Check Missed Meds (Mock for now, can be upgraded later)
router.post('/check-missed', async (req, res) => {
  console.log('[CHECK] Checking for missed medications...');
  res.status(200).json({ message: 'Checked', missed: 0 });
});

module.exports = router;