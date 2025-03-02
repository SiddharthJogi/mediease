const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  caregiverEmail: { type: String },
  fcmToken: { type: String },
  streak: { type: Number, default: 0 }, // Add streak field
  lastStreakUpdate: { type: Date, default: Date.now } // Track last update
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model('User', userSchema);