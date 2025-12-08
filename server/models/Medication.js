const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  // 'date' is now the START date
  date: { type: String, required: true }, 
  time: { type: String, required: true },
  recurrence: { type: String, enum: ['none', 'daily', 'weekly'], default: 'none' },
  
  // NEW: Track history of taken doses
  history: [{
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    status: { type: String, enum: ['taken', 'missed'], default: 'taken' },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Computed stats for the dashboard
  stats: {
    totalTaken: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 }
  }
}, { 
  timestamps: true
});

module.exports = mongoose.model('Medication', medicationSchema);