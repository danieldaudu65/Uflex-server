const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ["card", "transfer", "cash"], required: true },
  status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  transactionRef: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Payment", PaymentSchema);
