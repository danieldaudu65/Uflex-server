const express = require("express");
const jwt = require("jsonwebtoken");
const route = express.Router();

const Booking = require("../models/booking");
const Rider = require("../models/rider");
const Admin = require("../models/admin");
const Statistics = require("../models/statistics");
const { sendPaymentEmailToUser, sendPaymentConfirmedEmail, sendAssignmentEmailToRider } = require("../utils/nodemailer");

// 🔐 Verify Admin Token (Reusable)
const verifyAdminFromHeader = async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.split(" ")[1];
  if (!token) throw new Error("Token required");

  const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
  const admin = await Admin.findById(decoded.id);
  if (!admin) throw new Error("Invalid admin");
  return admin;
};

/* ===========================================
   🧾 1. Get Dashboard Statistics
=========================================== */
route.post("/get_record", async (req, res) => {
  try {
    await verifyAdminFromHeader(req, res);
    const stats = await Statistics.findOne({ doc_type: "admin" });

    if (!stats) {
      return res.status(404).json({ success: false, message: "Statistics not found" });
    }

    res.status(200).json({
      success: true,
      total_bookings: stats.total_bookings,
      total_pending: stats.total_pending_bookings,
      total_completed_bookings: stats.total_completed_bookings,
      total_cancelled_bookings: stats.total_cancelled_bookings,
      total_revenue: stats.total_revenue,
    });
  } catch (err) {
    console.error("Error fetching statistics:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});


/* ===========================================
   🧾 2. Get Recent Bookings (with Payment Status Sync)
=========================================== */
route.post("/get_recent", async (req, res) => {
  try {
    await verifyAdminFromHeader(req, res);
    const { limit = 10 } = req.body;

    // 🔍 Fetch recent bookings
    const recentBookings = await Booking.find()
      .populate("user", "firstName lastName email")
      .populate("rider", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    // ✅ Ensure paymentStatus consistency (auto-default if missing)
    const updatedBookings = await Promise.all(
      recentBookings.map(async (b) => {
        if (!b.paymentStatus) {
          b.paymentStatus = "unpaid"; // default unpaid
          await b.save();
        }
        return b;
      })
    );

    // 🧾 Format response
    const formatted = updatedBookings.map((b) => ({
      _id: b._id,
      bookingId: b.bookingId,
      pickupLocation: b.pickupLocation,
      dropoffLocation: b.dropoffLocation,
      vehicle: b.vehicle,
      bookingDate: b.bookingDate,
      bookingTime: b.bookingTime,
      totalPrice: b.totalPrice,
      is_excort: b.is_excort,
      bookingStatus: b.bookingStatus,
      paymentStatus: b.paymentStatus, // ✅ added here
      user: b.user
        ? {
          _id: b.user._id,
          firstName: b.user.firstName,
          lastName: b.user.lastName,
          email: b.user.email,
        }
        : null,
      rider: b.rider
        ? {
          _id: b.rider._id,
          firstName: b.rider.firstName,
          lastName: b.rider.lastName,
          email: b.rider.email,
        }
        : null,
      createdAt: b.createdAt,
    }));

    res.status(200).json({
      success: true,
      message: "Recent bookings fetched successfully",
      data: formatted,
    });
  } catch (err) {
    console.error("Error fetching recent bookings:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
});

/* ===========================================
   💰 3. Set Booking Price + Send Payment Email
=========================================== */
route.post("/set_price", async (req, res) => {
  try {
    await verifyAdminFromHeader(req, res);
    const { bookingId, price, paymentInfo } = req.body;

    if (!bookingId || price === undefined || price === null) {
      return res.status(400).json({ success: false, message: "bookingId and price required" });
    }

    // Find the booking and populate user info
    const booking = await Booking.findById(bookingId).populate("user", "firstName lastName email");
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    // Update booking details
    booking.totalPrice = Number(price);
    booking.paymentInfo = paymentInfo || booking.paymentInfo || { method: "offline" };
    booking.paymentStatus = "unpaid";
    await booking.save();

    // ✅ Send payment email to the user
    try {
      await sendPaymentEmailToUser(booking, price, paymentInfo);
    } catch (emailError) {
      console.error("Error sending payment email:", emailError);
    }

    // Response to admin
    res.json({ success: true, message: "Price set successfully & email sent", booking });
  } catch (err) {
    console.error("Error setting price:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});
/* ===========================================
   🧍 4. Assign Rider to Booking
=========================================== */
route.post("/assign_rider", async (req, res) => {
  try {
    await verifyAdminFromHeader(req, res);
    const { bookingId, riderId } = req.body;

    if (!bookingId || !riderId) {
      return res.status(400).json({ success: false, message: "bookingId and riderId required" });
    }

    const booking = await Booking.findById(bookingId).populate("user", "firstName lastName email");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const rider = await Rider.findById(riderId).select("-password");
    if (!rider) {
      return res.status(404).json({ success: false, message: "Rider not found" });
    }

    if (rider.is_active === false) {
      return res.status(400).json({ success: false, message: "Rider is inactive" });
    }

    // ✅ Assign rider and update booking
    booking.rider = rider._id;
    booking.bookingStatus = "assigned";
    await booking.save();

    // ✅ Increment rider statistics
    rider.total_assigned_booking += 1;
    rider.total_pending_booking += 1;

    // ✅ Add the booking to the rider’s assigned list (optional)
    if (!rider.assignedBookings.includes(booking._id)) {
      rider.assignedBookings.push(booking._id);
    }

    await rider.save();

    // ✅ Send assignment email
    try {
      await sendAssignmentEmailToRider(booking, rider);
    } catch (err) {
      console.error("Email send error:", err);
    }

    res.json({
      success: true,
      message: "Rider assigned successfully. Stats updated and email sent.",
      booking,
      rider,
    });
  } catch (err) {
    console.error("Error assigning rider:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
});


/* ===========================================
   👥 5. Get All Riders
=========================================== */
route.get("/all_riders", async (req, res) => {
  try {
    await verifyAdminFromHeader(req, res);
    const riders = await Rider.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, riders });
  } catch (err) {
    console.error("Error fetching riders:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// /* ===========================================
// / ✅ Toggle payment status

route.post("/toggle_payment_status", async (req, res) => {
  try {
    const { bookingId, status } = req.body;


    await verifyAdminFromHeader(req, res);

    if (!bookingId || !status) {
      return res.status(400).json({ success: false, message: "Missing parameters" });
    }

    const booking = await Booking.findById(bookingId).populate("user");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    booking.paymentStatus = status;
    await booking.save();

    // ✅ Send payment confirmation email only when marked as paid
    if (status === "paid") {
      await sendPaymentConfirmedEmail(booking);
    }

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${status}`,
      booking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// ✅ Fetch payment status for a specific booking
route.get("/payment_status/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    await verifyAdminFromHeader(req, res);

    if (!bookingId) {
      return res.status(400).json({ success: false, message: "Booking ID is required" });
    }

    const booking = await Booking.findById(bookingId).select("paymentStatus totalPrice bookingStatus");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({
      success: true,
      paymentStatus: booking.paymentStatus,
      totalPrice: booking.totalPrice,
      bookingStatus: booking.bookingStatus,
    });
  } catch (err) {
    console.error("Error fetching payment status:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});




module.exports = route;
