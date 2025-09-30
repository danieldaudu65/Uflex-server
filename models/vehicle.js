const mongoose = require("mongoose");

const VehicleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. Pathfinder
    model: { type: String }, // e.g. 2025
    pricePerDay: { type: Number, required: true }, // e.g. ₦18,000
    capacity: { type: Number }, // optional, e.g. 5 passengers
    imageUrl: { type: String }, // for display in app
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", VehicleSchema);
