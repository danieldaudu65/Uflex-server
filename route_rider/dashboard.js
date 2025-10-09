const express = require("express");
const router = express.Router();
const Rider = require("../models/rider");
const jwt = require("jsonwebtoken");

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
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({ success: true, recentBookings: bookings });
    } catch (err) {
        console.error("Error fetching rider bookings:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


module.exports = router;
