const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },

  pickupLocation: { type: String, required: true },
  dropoffLocation: { type: String, required: true },

  bookingType: { type: String, enum: ["airport_pickup", "car_rental"], required: true },

  bookingStatus: {
    type: String,
    enum: ["requested", "confirmed", "completed", "cancelled"],
    default: "requested"
  },

  bookingDate: { type: Date, required: true },
  totalPrice: { type: Number }, // optional since admin may set it later
  notes: { type: String },

  // link to Payment
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment"
  }
}, { timestamps: true });

module.exports = mongoose.model("Booking", BookingSchema);
