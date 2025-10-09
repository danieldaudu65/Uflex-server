const express = require("express");
const route = express.Router();
const Booking = require("../models/booking");
const Rider = require("../models/rider");
const jwt = require("jsonwebtoken");

// Get all bookings for logged-in rider
route.get("/my_bookings", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer token

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");

    // Check if rider exists
    const rider = await Rider.findById(decoded.id);
    if (!rider) {
      return res.status(403).json({ message: "Invalid rider" });
    }

    // Fetch bookings assigned to this rider
    const bookings = await Booking.find({ rider: rider._id })
      .populate("user", "firstName lastName phoneNumber email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Rider bookings fetched successfully",
      total: bookings.length,
      data: bookings,
    });
  } catch (err) {
    console.error("Error fetching rider bookings:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

module.exports = route;
