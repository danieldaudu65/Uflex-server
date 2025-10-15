const express = require("express");
const router = express.Router();
const Rider = require("../models/rider");
const jwt = require("jsonwebtoken");
const Statistics = require("../models/statistics");


const Booking = require("../models/booking"); // ensure you have a Booking model




const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
        req.user = decoded; // attach the decoded user info (id, email)
        next();
    } catch (err) {
        console.error("Token verification failed:", err);
        res.status(401).json({ message: "Invalid or expired token" });
    }
};

router.get("/stats", authMiddleware, async (req, res) => {
    try {
        const riderId = req.user.id;

        const rider = await Rider.findById(riderId);
        if (!rider) return res.status(404).json({ message: "Rider not found" });

        const stats = {
            total_assigned_booking: rider.total_assigned_booking,
            total_pending_booking: rider.total_pending_booking,
            total_completed_booking: rider.total_completed_booking,
        };

        res.status(200).json({ success: true, stats });
    } catch (err) {
        console.error("Error fetching rider stats:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ✅ GET 5 Recent Bookings (Token Required)
router.get("/recent-bookings", authMiddleware, async (req, res) => {
    try {
        const riderId = req.user.id;

        const bookings = await Booking.find({ rider: riderId })
            .populate("user", "firstName lastName email") // ✅ include user details
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({ success: true, recentBookings: bookings });
    } catch (err) {
        console.error("Error fetching rider bookings:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ================================
// 🚦 Start Booking
// ================================
router.post("/booking/start", authMiddleware, async (req, res) => {
    try {
        const { bookingId } = req.body;

        if (!bookingId)
            return res.status(400).json({ success: false, message: "Booking ID required" });

        const booking = await Booking.findById(bookingId);
        if (!booking)
            return res.status(404).json({ success: false, message: "Booking not found" });

        booking.startTime = new Date();
        booking.bookingStatus = "started";
        await booking.save();

        const stats = await Statistics.findOne({ doc_type: "admin" });
        if (stats) {
            stats.active_bookings += 1;
            await stats.save();
        }

        // Return the start time
        res.json({
            success: true,
            message: "Booking started successfully",
            booking
        });
    } catch (err) {
        console.error("Error starting booking:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ================================
// 🏁 End Booking
// ================================
router.post("/booking/end", authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId)
      return res.status(400).json({ success: false, message: "Booking ID required" });

    const booking = await Booking.findById(bookingId);
    if (!booking)
      return res.status(404).json({ success: false, message: "Booking not found" });

    if (!booking.startTime)
      return res.status(400).json({ success: false, message: "Booking hasn't been started" });

    // Mark as ended
    booking.endTime = new Date();

    // Calculate duration in minutes
    const durationMs = new Date(booking.endTime) - new Date(booking.startTime);
    booking.totalDuration = Math.round(durationMs / 60000);

    // Set booking status to completed
    booking.bookingStatus = "completed";

    await booking.save();

    // Update rider stats
    if (booking.rider) {
      const rider = await Rider.findById(booking.rider);
      if (rider) {
        rider.total_completed_booking += 1;
        rider.assignedBookings = rider.assignedBookings.filter(
          (id) => id.toString() !== bookingId
        );
        await rider.save();
      }
    }

    // Update global statistics
    const stats = await Statistics.findOne({ doc_type: "admin" });
    if (stats) {
      stats.total_completed_bookings += 1;
      if (stats.active_bookings > 0) stats.active_bookings -= 1;

      // ✅ Add booking's total amount to revenue
      if (booking.totalAmount && booking.totalPrice > 0) {
        stats.total_revenue += booking.totalPrice;
        stats.total_booking_earnings += booking.totalAmount;
      }

      await stats.save();
    }

    res.json({
      success: true,
      message: "Booking ended successfully",
      booking,
    });
  } catch (err) {
    console.error("Error ending booking:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
