const mongoose = require("mongoose");

const RiderSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    vehicle: { type: String },

    // Rider status (active = can take trips)
    is_active: { type: Boolean, default: true },

    // Rider Statistics
    total_assigned_booking: { type: Number, default: 0 },
    total_pending_booking: { type: Number, default: 0 },
    total_completed_booking: { type: Number, default: 0 },

    // Rider may have assigned bookings
    assignedBookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rider", RiderSchema);
