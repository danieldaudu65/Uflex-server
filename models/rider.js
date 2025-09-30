const mongoose = require("mongoose");

const RiderSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true }, // hashed

    // Rider status (active = can take trips)
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    blacklistedTokens: [{ type: String }],


    // Rider may have assigned bookings
    assignedBookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rider", RiderSchema);
