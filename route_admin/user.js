const express = require("express");
const route = express.Router();
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");
const User = require("../models/User");
const Booking = require("../models/booking");


//  Function to verify admin
const verifyAdmin = async (token) => {
    if (!token) throw new Error("Token is required");

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const admin = await Admin.findById(decoded.id);
    if (!admin) throw new Error("Invalid admin");

    return admin;
};


// Get all users
route.post("/all_users", async (req, res) => {
    try {
        const { token } = req.body;
        await verifyAdmin(token);

        const users = await User.find().sort({ createdAt: -1 });
        res.status(200).json({
            message: "All users fetched successfully",
            total: users.length,
            data: users,
        });
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(401).json({ message: err.message });
    }
});


// Get one user by ID
route.post("/get_user", async (req, res) => {
    try {
        const { token, userId } = req.body;
        await verifyAdmin(token);

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({
            message: "User fetched successfully",
            data: user,
        });
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(401).json({ message: err.message });
    }
});


// Get bookings of a user
route.post("/user_bookings", async (req, res) => {
    try {
        const { token, userId } = req.body;
        await verifyAdmin(token);

        const bookings = await Booking.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json({
            message: "User bookings fetched successfully",
            total: bookings.length,
            data: bookings,
        });
    } catch (err) {
        console.error("Error fetching user bookings:", err);
        res.status(401).json({ message: err.message });
    }
});


//  Delete user

route.post("/delete_user", async (req, res) => {
    try {
        const { token, userId } = req.body;
        await verifyAdmin(token);

        const user = await User.findByIdAndDelete(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(401).json({ message: err.message });
    }
});


// Block/Unblock user 
//  block is either true or false

route.post("/block_user", async (req, res) => {
    try {
        const { token, userId, block } = req.body; 
        await verifyAdmin(token);

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.is_blocked = block;
        await user.save();

        res.status(200).json({
            message: block ? "User blocked successfully" : "User unblocked successfully",
            data: user,
        });
    } catch (err) {
        console.error("Error blocking/unblocking user:", err);
        res.status(401).json({ message: err.message });
    }
});


module.exports = route;
