const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  fullName: String,
  phoneNunber: String,
  passwordHash: { type: String, required: true },
  profilePicture: { type: String },

  is_blocked : { type: Boolean, required: false },
  is_active : { type: Boolean, required: true },
},
  { collection: 'users' });
const model = mongoose.model('User', userSchema);

module.exports = model