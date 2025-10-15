const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rider: { type: mongoose.Schema.Types.ObjectId, ref: "Rider" },
    vehicle: String,
    pickupLocation: String,
    dropoffLocation: String,
    serviceType: String,
    is_excort: { type: Boolean, default: false },
    bookingStatus: {
      type: String,
      enum: ["requested", "assigned", "started", "completed", "cancelled"],
      default: "requested",
    },
    totalPrice: Number,
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    startTime: { type: Date },
    endTime: { type: Date },
    totalDuration: { type: Number }, // in minutes
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", BookingSchema);
