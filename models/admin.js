const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  number: { type: String },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  otp: String,
  otpTime: Date,
  is_block: { type: Boolean, default: false },

  role: { type: String, enum: ['master', 'standard'], default: 'standard' }
}, {
  collection: 'admins',
  timestamps: true // ✅ Handles createdAt & updatedAt automatically
});

module.exports = mongoose.model('Admin', adminSchema);
