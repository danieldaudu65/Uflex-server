const express = require("express");
const router = express.Router();

const Booking = require("../models/booking"); // ✅ Booking model
const riderAuth = require("../riderAuth"); // ✅ rider authentication middleware

// ====================== GET RIDER DASHBOARD ======================
router.get("/dashboard", riderAuth, async (req, res) => {
  try {
    const riderId = req.rider.id; // ✅ from riderAuth

    // Stats
    const assignedCount = await Booking.countDocuments({ rider: riderId });
    const pendingCount = await Booking.countDocuments({
      rider: riderId,
      bookingStatus: "requested",
    });
    const completedCount = await Booking.countDocuments({
      rider: riderId,
      bookingStatus: "completed",
    });

    // Earnings (assuming `fare` field in Booking)
    const earnings = await Booking.aggregate([
      { $match: { rider: riderId, bookingStatus: "completed" } },
      { $group: { _id: null, total: { $sum: "$fare" } } },
    ]);

    res.status(200).json({
      status: "Success",
      dashboard: {
        assigned: assignedCount,
        pending: pendingCount,
        completed: completedCount,
        earnings: earnings[0]?.total || 0, // avoid crash if no trips yet
      },
    });
  } catch (error) {
    res.status(500).json({ status: "Error", msg: error.message });
  }
});

module.exports = router;

