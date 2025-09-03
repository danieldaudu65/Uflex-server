const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    fullName: String,
    googleId: String,
    appleId: String,
},
{ collection: 'users' });
const model = mongoose.model('User', userSchema);

module.exports = model