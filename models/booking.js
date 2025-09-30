const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },

    pickupLocation: { type: String, required: true },
    dropoffLocation: { type: String, required: true },

    serviceType: {
      type: String,
      enum: ["airport_pickup", "car_rental", "security_escort", "others"],
      required: true,
    },

    bookingStatus: {
      type: String,
      enum: ["requested", "confirmed", "completed", "cancelled"],
      default: "requested",
    },

    bookingDate: { type: Date, required: true }, // main date
    bookingTime: { type: String, required: true }, // e.g. "14:30"

    totalPrice: { type: Number }, // auto-filled when vehicle is selected
    notes: { type: String },

    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    
    rider: { type: mongoose.Schema.Types.ObjectId, ref: "Rider" }, // assigned rider
  },


  { timestamps: true }
);

module.exports = mongoose.model("Booking", BookingSchema);
