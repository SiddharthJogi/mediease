// server/models/Medication.js
const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  // --- CHANGED FROM String TO Array of Strings ---
  schedule: {
    type: [String], // Now accepts ["08:00", "14:00"]
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Medication', MedicationSchema);