const express = require("express");
const router = express.Router();
const Rider = require("../models/rider");
const Booking = require("../models/booking");
const jwt = require('jsonwebtoken');
const Admin = require("../models/admin");


//===== Endpoint to get all riders ==== //
router.post("/riders", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, msg: "Please send a valid token" });
  }

  try {
    // Decode admin token
    const adminDecode = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the decoded user is an admin
    const admin = await Admin.findById(adminDecode.id);
    if (!admin) {
      return res.status(401).json({ success: false, msg: "Unauthorized access" });
    }

    // Fetch all riders (exclude passwords)
    const riders = await Rider.find().select("-password").sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: riders.length,
      riders,
    });

  } catch (error) {
    console.error("Error fetching riders:", error);
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, msg: "Invalid or expired token" });
    }
    res.status(500).json({ success: false, msg: "Server error fetching riders" });
  }
});

// ===== Endpoint to get details of a single rider ===== //
router.post("/rider", async (req, res) => {
  const { token, riderId } = req.body;

  if (!token || !riderId) {
    return res.status(400).json({ success: false, msg: "Please send in the required details" });
  }

  try {
    // Decode and verify admin token
    const adminDecode = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(adminDecode.id);
    if (!admin) {
      return res.status(401).json({ success: false, msg: "Unauthorized access" });
    }

    // Find the rider by ID
    const rider = await Rider.findById(riderId).select("-password");
    if (!rider) {
      return res.status(404).json({ success: false, msg: "Rider not found" });
    }

    // Fetch all bookings assigned to this rider
    const bookings = await Booking.find({ _id: { $in: rider.assignedBookings } })
      .sort({ createdAt: -1 })
      .populate("user", "firstName lastName email");

    // Respond with rider details and their bookings
    res.status(200).json({
      success: true,
      rider,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching rider:", error);

    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, msg: "Invalid or expired token" });
    }

    res.status(500).json({ success: false, msg: "Server error fetching rider details" });
  }
});
// ===== Delete Rider ===== //
router.post("/delete", async (req, res) => {
  const { token, riderId } = req.body;

  if (!token || !riderId) {
    return res.status(400).json({ success: false, msg: "Please provide token and riderId" });
  }

  try {
    // ✅ Verify admin
    const adminDecode = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(adminDecode.id);
    if (!admin) {
      return res.status(401).json({ success: false, msg: "Unauthorized" });
    }

    // ✅ Delete rider
    const deletedRider = await Rider.findByIdAndDelete(riderId);
    if (!deletedRider) {
      return res.status(404).json({ success: false, msg: "Rider not found" });
    }

    res.status(200).json({
      success: true,
      msg: "Rider deleted successfully",
      rider: deletedRider,
    });
  } catch (error) {
    console.error("Error deleting rider:", error);
    res.status(500).json({ success: false, msg: "Server error while deleting rider" });
  }
});


// ===== Block / Unblock Rider ===== //
router.post("/block", async (req, res) => {
  const { token, riderId, block } = req.body; // block = true (block) / false (unblock)

  if (!token || !riderId || typeof block !== "boolean") {
    return res.status(400).json({
      success: false,
      msg: "Please provide token, riderId, and block status (boolean)",
    });
  }

  try {
    // ✅ Verify admin
    const adminDecode = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(adminDecode.id);
    if (!admin) {
      return res.status(401).json({ success: false, msg: "Unauthorized" });
    }

    // ✅ Update rider active status (your schema uses `is_active`)
    const rider = await Rider.findByIdAndUpdate(
      riderId,
      { is_active: !block }, // block = true → set false
      { new: true }
    ).select("-password");

    if (!rider) {
      return res.status(404).json({ success: false, msg: "Rider not found" });
    }

    res.status(200).json({
      success: true,
      msg: `Rider has been ${block ? "blocked" : "unblocked"} successfully`,
      rider,
    });
  } catch (error) {
    console.error("Error updating rider status:", error);
    res.status(500).json({ success: false, msg: "Server error while updating rider status" });
  }
});


module.exports = router