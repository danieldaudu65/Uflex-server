const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rider: { type: mongoose.Schema.Types.ObjectId, ref: "Rider" },
    vehicle: String,
    pickupLocation: String,
    dropoffLocation: String,
    serviceType: String,
    bookingStatus: {
      type: String,
      enum: ["requested", "confirmed", "completed", "cancelled"],
      default: "requested",
    },
    totalPrice: Number,
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", BookingSchema);
