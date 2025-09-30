const express = require("express");
const Booking = require("../models/booking");
const rider = require("../models/rider");
const router = express.Router();


// ====================== GET RIDER BOOKINGS ======================
router.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find({ rider: req.user._id })
      .populate("user", "firstName lastName phone email")
      .populate("vehicle");

    res.status(200).json({ status: "Success", bookings });
  } catch (error) {
    res.status(500).json({ status: "Error", msg: error.message });
  }
});

// ====================== GET SINGLE BOOKING ======================
router.get("/bookings/:id", async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      rider: req.user._id,
    })
      .populate("user", "firstName lastName phone email")
      .populate("vehicle");

    if (!booking) {
      return res
        .status(404)
        .json({ status: "Error", msg: "Booking not found" });
    }

    res.status(200).json({ status: "Success", booking });
  } catch (error) {
    res.status(500).json({ status: "Error", msg: error.message });
  }
});

// ====================== UPDATE BOOKING STATUS (by Rider) ======================
router.put("/bookings/:id/status", async (req, res) => {
  try {
    const { status } = req.body; // e.g. confirmed, completed
    const allowedStatuses = ["confirmed", "completed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res
        .status(400)
        .json({ status: "Error", msg: "Invalid status update" });
    }

    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, rider: req.user._id },
      { bookingStatus: status },
      { new: true }
    );

    if (!booking) {
      return res
        .status(404)
        .json({ status: "Error", msg: "Booking not found" });
    }

    res
      .status(200)
      .json({ status: "Success", msg: "Booking status updated", booking });
  } catch (error) {
    res.status(500).json({ status: "Error", msg: error.message });
  }
});

module.exports = router;


// // ====================== ASSIGN RIDER TO BOOKING ======================
// router.put("/assign-rider/:bookingId", async (req, res) => {
//   try {
//     const { riderId } = req.body;
//     const { bookingId } = req.params;

//     // 1. Ensure rider exists
//     const rider = await Rider.findById(riderId);
//     if (!rider) {
//       return res.status(404).json({ status: "Error", msg: "Rider not found" });
//     }

//     // 2. Ensure booking exists
//     const booking = await Booking.findById(bookingId);
//     if (!booking) {
//       return res
//         .status(404)
//         .json({ status: "Error", msg: "Booking not found" });
//     }

//     // 3. Assign rider to booking
//     booking.rider = riderId;
//     booking.bookingStatus = "confirmed"; // booking moves forward
//     await booking.save();

//     // 4. Add booking to rider's assignedBookings
//     rider.assignedBookings.push(booking._id);
//     await rider.save();

//     res.status(200).json({
//       status: "Success",
//       msg: "Rider assigned to booking",
//       booking,
//       rider,
//     });
//   } catch (error) {
//     res.status(500).json({ status: "Error", msg: error.message });
//   }
// });

// module.exports = router;
