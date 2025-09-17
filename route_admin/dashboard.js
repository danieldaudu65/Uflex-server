
const express = require("express");
const booking = require("../models/booking");
const route = express.Router();
const Statistics = require("../models/statistics"); // adjust path if needed

// Get statistics record
route.post('/get_record', async (req, res) => {
    try {
        const stats = await Statistics.findOne({ doc_type: 'admin' });

        if (!stats) {
            return res.status(404).json({ message: "Statistics not found" });
        }

        res.status(200).json({
            total_bookings: stats.total_bookings,
            total_pending: stats.total_pending,
            total_completed_booking: stats.total_completed_booking,
            total_cancelled_booking: stats.total_cancelled_booking,
            total_revenue: stats.total_revenue
        });
    } catch (err) {
        console.error("Error fetching statistics:", err);
        res.status(500).json({ message: "Server error" });
    }
});


// Get recent bookings (last 10 by default)
route.post('/get_recent', async (req, res) => {
    try {
        const { limit = 10 } = req.body; // allow frontend to pass how many recent they want

        const recentBookings = await booking.find()
            .sort({ createdAt: -1 }) // newest first
            .limit(Number(limit));

        res.status(200).json({
            message: "Recent bookings fetched successfully",
            data: recentBookings
        });
    } catch (err) {
        console.error("Error fetching recent bookings:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = route;
