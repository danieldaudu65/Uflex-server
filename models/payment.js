const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },

  // price set for the booking
  amount: { type: Number },

  // always offline, so no need for "card"
  method: { type: String, enum: ["transfer", "cash"], required: true },

  // status flow: awaiting_admin -> awaiting_user -> paid -> confirmed
  status: {
    type: String,
    enum: ["awaiting_admin", "awaiting_user", "paid", "confirmed"],
    default: "awaiting_admin"
  },

  // user uploads screenshot / receipt ID
  paymentProof: { type: String },

  // email of user (helps with notifications)
  userEmail: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Payment", PaymentSchema);
