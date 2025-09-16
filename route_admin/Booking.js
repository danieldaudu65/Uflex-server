const express = require("express");
const route = express.Router();
const Booking = require("../models/booking");
const Admin = require("../models/admin");
const jwt = require("jsonwebtoken");



// Get all bookings
route.get('/all_bookings', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 }); 
        res.status(200).json({
            message: "All bookings fetched successfully",
            total: bookings.length,
            data: bookings
        });
    } catch (err) {
        console.error("Error fetching bookings:", err);
        res.status(500).json({ message: "Server error" });
    }
});



//  Get one booking (requires token in body)
route.post('/get_booking/:id', async (req, res) => {
    const { token,id  } = req.body;

    if (!token) {
        return res.status(400).json({ message: "Token is required" });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");

        // Find admin
        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(403).json({ message: "Invalid admin" });
        }

        // Fetch booking
        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.status(200).json({
            message: "Booking fetched successfully",
            booking
        });

    } catch (err) {
        console.error("Error fetching booking:", err);
        res.status(401).json({ message: "Invalid or expired token" });
    }
});


module.exports = route;
