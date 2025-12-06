const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  caregiverEmail: { type: String },
  fcmToken: { type: String },
  streak: { type: Number, default: 0 },
  lastStreakUpdate: { type: Date, default: Date.now },
  points: { type: Number, default: 0 }, // Points earned from streaks
  totalDiscount: { type: Number, default: 0 }, // Total discount percentage available
  medications: [{ // User's medication profile
    name: { type: String, required: true },
    recurrence: { type: String, enum: ['none', 'daily', 'weekly'], default: 'daily' },
    time: { type: String, required: true },
    dosage: { type: String },
    notes: { type: String }
  }]
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);