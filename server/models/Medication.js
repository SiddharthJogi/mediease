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
  schedule: {
    type: [String], // ["09:00", "14:00"]
    required: true
  },
  // --- NEW FIELDS: Required for Marking as Taken ---
  history: [{
    date: String, // Format: "YYYY-MM-DD"
    status: String // "taken" or "skipped"
  }],
  stats: {
    totalTaken: { type: Number, default: 0 },
    totalSkipped: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Medication', MedicationSchema);