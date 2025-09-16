const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
    name: String,
    number: String,
    password: String,
    email: String,
    otp: String,
    otpTime: Date,

    is_block: { type: Boolean, default: false }
}, { collection: 'admins' })

module.exports = mongoose.model('Admin', adminSchema);
