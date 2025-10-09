const express = require("express");
const route = express.Router();
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");
const User = require("../models/User");
const Booking = require("../models/booking");


//  Function to verify admin
const verifyAdminMiddleware = async (req, res, next) => {
    try {
        const token = req.body.token || req.headers["authorization"]?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Token required" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
        const admin = await Admin.findById(decoded.id);
        if (!admin) return res.status(401).json({ message: "Invalid admin" });

        req.admin = admin; // attach admin to request
        next();
    } catch (err) {
        console.error("Admin verification failed:", err);
        res.status(401).json({ message: err.message });
    }
};


// Get all users
route.post("/all_users", verifyAdminMiddleware, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({
      message: "All users fetched successfully",
      total: users.length,
      data: users,
    });
  } catch (err) {
    console.error("Error fetching all users:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Get one user by ID
route.post("/get_user", verifyAdminMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      message: "User fetched successfully",
      data: user,
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});



// Get bookings of a user
route.post("/user_bookings", verifyAdminMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;

    const bookings = await Booking.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({
      message: "User bookings fetched successfully",
      total: bookings.length,
      data: bookings,
    });
  } catch (err) {
    console.error("Error fetching user bookings:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete user
route.post("/delete_user", verifyAdminMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Block/Unblock user
route.post("/block_user", verifyAdminMiddleware, async (req, res) => {
  try {
    const { userId, block } = req.body;

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
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = route;
