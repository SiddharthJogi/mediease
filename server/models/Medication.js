const mongoose = require('mongoose');
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your32bytesecretkey1234567890123';
const ENCRYPTION_IV = process.env.ENCRYPTION_IV || 'your16byteivhere';

console.log('ENCRYPTION_KEY:', ENCRYPTION_KEY, 'Length:', Buffer.from(ENCRYPTION_KEY).length);
console.log('ENCRYPTION_IV:', ENCRYPTION_IV, 'Length:', Buffer.from(ENCRYPTION_IV).length);

if (Buffer.from(ENCRYPTION_KEY).length !== 32) {
  console.error('ENCRYPTION_KEY must be exactly 32 bytes:', Buffer.from(ENCRYPTION_KEY).length);
  throw new Error('ENCRYPTION_KEY must be 32 bytes');
}
if (Buffer.from(ENCRYPTION_IV).length !== 16) {
  console.error('ENCRYPTION_IV must be exactly 16 bytes:', Buffer.from(ENCRYPTION_IV).length);
  throw new Error('ENCRYPTION_IV must be 16 bytes');
}

const medicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: {
    type: String,
    required: true,
    set: v => {
      console.log('Encrypting name:', v);
      return encrypt(v);
    },
    get: v => {
      console.log('Decrypting name:', v);
      return decrypt(v);
    }
  },
  date: { type: Date, required: true }, // Changed from time to date for calendar
  time: { type: String, required: true }, // Keep time separate
  recurrence: { type: String, enum: ['none', 'daily', 'weekly'], default: 'none' }, // Add recurrence
  status: { type: String, default: 'pending', enum: ['pending', 'taken', 'missed'] },
}, { timestamps: true, toJSON: { getters: true } });

function encrypt(text) {
  try {
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), Buffer.from(ENCRYPTION_IV));
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    console.log('Encrypted:', encrypted);
    return encrypted;
  } catch (err) {
    console.error('Encryption failed:', err.message);
    throw err;
  }
}

function decrypt(encrypted) {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), Buffer.from(ENCRYPTION_IV));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    console.log('Decrypted:', decrypted);
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err.message);
    throw err;
  }
}

module.exports = mongoose.model('Medication', medicationSchema);