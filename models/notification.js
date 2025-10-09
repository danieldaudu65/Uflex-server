const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  noti_type: { type: String, default: 'success' }, // e.g. success, error, info
  event: String, // e.g. "booking_created"
  event_id: String, // e.g. booking._id
  message: String,
  timestamp: { type: Number, default: Date.now },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["unread", "read"], default: "unread" },
}, { collection: 'notifications' });

const model = mongoose.model('Notification', notificationSchema);
module.exports = model;
