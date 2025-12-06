const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  recurrence: { type: String, enum: ['none', 'daily', 'weekly'], default: 'none' },
  status: { type: String, default: 'pending', enum: ['pending', 'taken', 'missed'] },
}, { 
  timestamps: true
});

module.exports = mongoose.model('Medication', medicationSchema);