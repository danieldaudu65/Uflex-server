const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    userEmail: { type: String, required: true },

    method: {
      type: String,
      enum: ["transfer", "card", "cash"],
      default: "transfer",
    },

    amount: { type: Number, required: true },

    status: {
      type: String,
      enum: [
        "awaiting_admin",   // admin sets payment details
        "awaiting_user",    // user needs to upload proof
        "paid",             // user uploaded proof
        "confirmed",        // admin confirmed payment
      ],
      default: "awaiting_admin",
    },

    paymentProof: { type: String }, // uploaded receipt/image URL
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", PaymentSchema);
