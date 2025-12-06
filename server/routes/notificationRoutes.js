/* routes/notificationRoutes.js */
const express = require('express');
const router = express.Router();

// Mock Notification Endpoint
router.post('/notify-caregiver', async (req, res) => {
  const { userId, type } = req.body;
  
  // LOGIC: Instead of sending real email, we just log it.
  console.log(`[SIMULATION] 🔔 Alert triggered for User ID: ${userId}`);
  console.log(`[SIMULATION] 📨 Mode: ${type}`);
  console.log(`[SIMULATION] ✅ Status: Sent (Mocked)`);

  // Return success to the frontend so the UI shows "Sent!"
  // Add a small delay to make it feel real
  setTimeout(() => {
    res.status(200).json({ success: true, message: 'Caregiver notified (Simulation)' });
  }, 1000);
});

module.exports = router;