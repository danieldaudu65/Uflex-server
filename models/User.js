const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  firstName: String,
  lastName: String,
  phoneNumber: String,
  passwordHash: { type: String, required: true },
  profilePicture: { type: String },

  otp: String,
  otptime: Date,


  is_blocked: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
},
  { collection: 'users', timestamps: true });
const model = mongoose.model('User', userSchema);

module.exports = model