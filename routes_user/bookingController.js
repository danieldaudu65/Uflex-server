const express = require('express');
require('dotenv').config();

const Booking = require('../models/booking');
const Payment = require('../models/payment');
const Vehicle = require('../models/vehicle');
const Notification = require('../models/notification')
const { sendMail, sendBookingEmailToAdmin, sendPaymentConfirmationEmail } = require('../utils/nodemailer'); // custom email util
const authenticateUser = require('./authenticateUser');
const admin = require('../models/admin');
const Statistics = require('../models/statistics')

const router = express.Router();



// ====================== STEP 1: CREATE BOOKING (without vehicle yet) ======================
// router.post('/bookings', authenticateUser, async (req, res) => {
//   try {
//     const {
//       pickupLocation,
//       dropoffLocation,
//       bookingDate,
//       bookingTime,
//       serviceType,
//       notes,
//     } = req.body;

//     const booking = await Booking.create({
//       user: req.user._id,
//       pickupLocation,
//       dropoffLocation,
//       bookingDate,
//       bookingTime,
//       serviceType,
//       notes,
//     });

//     res.status(201).send({
//       status: 'Success',
//       msg: 'Booking created. Proceed to select vehicle.',
//       booking,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ status: 'Error', msg: error.message });
//   }
// });
// // ====================== STEP 2: ASSIGN VEHICLE & CALCULATE PRICE ======================
// router.put('/bookings/:id/vehicle', authenticateUser, async (req, res) => {
//   try {
//     const { vehicleId } = req.body;

//     const vehicle = await Vehicle.findById(vehicleId);
//     if (!vehicle) {
//       return res.status(404).send({ status: 'Error', msg: 'Vehicle not found' });
//     }

//     const booking = await Booking.findOne({
//       _id: req.params.id,
//       user: req.user._id,
//     });

//     if (!booking) {
//       return res.status(404).send({ status: 'Error', msg: 'Booking not found' });
//     }

//     // Calculate total price (simplified as 1 day trip, but can be dynamic)
//     const totalPrice = vehicle.pricePerDay;

//     booking.vehicle = vehicle._id;
//     booking.totalPrice = totalPrice;
//     await booking.save();

//     res.status(200).send({
//       status: 'Success',
//       msg: 'Vehicle assigned. Proceed to payment.',
//       booking,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ status: 'Error', msg: error.message });
//   }
// });
// // ====================== STEP 3: INITIATE PAYMENT ======================
// router.post('/bookings/:id/payment', authenticateUser, async (req, res) => {
//   try {
//     const { method } = req.body; // e.g. "transfer"

//     const booking = await Booking.findOne({
//       _id: req.params.id,
//       user: req.user._id,
//     });

//     if (!booking) {
//       return res.status(404).send({ status: 'Error', msg: 'Booking not found' });
//     }

//     if (!booking.totalPrice) {
//       return res.status(400).send({ status: 'Error', msg: 'Assign vehicle before payment' });
//     }

//     const payment = await Payment.create({
//       booking: booking._id,
//       userEmail: req.user.email,
//       method,
//       amount: booking.totalPrice,
//       status: 'awaiting_admin',
//     });

//     booking.payment = payment._id;
//     await booking.save();

//     await sendMail(
//       req.user.email,
//       'Payment Initiated',
//       `Hi ${req.user.firstName}, you initiated a payment of ₦${booking.totalPrice}. Please complete the transfer.`
//     );

//     res.status(201).send({
//       status: 'Success',
//       msg: 'Payment created. Awaiting confirmation.',
//       payment,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ status: 'Error', msg: error.message });
//   }
// });


// // ====================== GET ALL USER BOOKINGS ======================
// router.get('/bookings', authenticateUser, async (req, res) => {
//   try {
//     const bookings = await Booking.find({ user: req.user._id })
//       .populate('vehicle')
//       .populate('payment')
//       .populate("rider", "firstName lastName phone email")
//       .populate("user", "firstName lastName phone email");

//     res.status(200).send({ status: 'Success', bookings });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ status: 'Error', msg: error.message });
//   }
// });
// // ====================== GET SINGLE BOOKING ======================
// router.get('/bookings/:id', authenticateUser, async (req, res) => {
//   try {
//     const booking = await Booking.findOne({
//       _id: req.params.id,
//       user: req.user._id,
//     })
//       .populate('vehicle')
//       .populate('payment')
//       .populate("rider", "firstName lastName phone email")
//       .populate("user", "firstName lastName phone email");

//     if (!booking) {
//       return res.status(404).send({ status: 'Error', msg: 'Booking not found' });
//     }

//     res.status(200).send({ status: 'Success', booking });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ status: 'Error', msg: error.message });
//   }
// });
// // ====================== CANCEL BOOKING ======================
// router.delete('/bookings/:id', authenticateUser, async (req, res) => {
//   try {
//     const booking = await Booking.findOneAndDelete({
//       _id: req.params.id,
//       user: req.user._id,
//     });

//     if (!booking) {
//       return res.status(404).send({ status: 'Error', msg: 'Booking not found' });
//     }

//     if (booking.payment) {
//       await Payment.findByIdAndDelete(booking.payment);
//     }

//     res.status(200).send({
//       status: 'Success',
//       msg: 'Booking and payment cancelled',
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ status: 'Error', msg: error.message });
//   }
// });
// // ====================== RESCHEDULE BOOKING ======================
// router.put('/bookings/:id/reschedule',authenticateUser, async (req, res) => {
//   try {
//     const { bookingDate, bookingTime, notes } = req.body;

//     // Validate inputs
//     if (!bookingDate || !bookingTime) {
//       return res.status(400).send({
//         status: 'Error',
//         msg: 'New booking date and time are required',
//       });
//     }

//     // Find booking
//     const booking = await Booking.findOne({
//       _id: req.params.id,
//       user: req.user._id,
//     });

//     if (!booking) {
//       return res.status(404).send({ status: 'Error', msg: 'Booking not found' });
//     }

//     // Prevent rescheduling if already completed or cancelled
//     if (["completed", "cancelled"].includes(booking.bookingStatus)) {
//       return res.status(400).send({
//         status: 'Error',
//         msg: `Booking cannot be rescheduled because it is already ${booking.bookingStatus}`,
//       });
//     }

//     // Update fields
//     booking.bookingDate = bookingDate;
//     booking.bookingTime = bookingTime;
//     if (notes) booking.notes = notes;

//     await booking.save();

//     // Send email notification
//     await sendMail(
//       req.user.email,
//       'Booking Rescheduled',
//       `Hi ${req.user.firstName}, your booking has been successfully rescheduled to ${bookingDate} at ${bookingTime}.`
//     );

//     res.status(200).send({
//       status: 'Success',
//       msg: 'Booking rescheduled successfully',
//       booking,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ status: 'Error', msg: error.message });
//   }
// });



// ===== Endpoint to Create a Booking ===== //


router.post("/create_booking", authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      pickupLocation,
      dropoffLocation,
      phone_no,
      userEmail,
      firstName,
      serviceType,
      vehicle,
      bookingDate,
      is_excort,
      bookingTime,
      totalPrice,
      notes,
    } = req.body;

    // Validate required fields
    if (
      !pickupLocation ||
      !dropoffLocation ||
      !userEmail ||
      !firstName ||
      !serviceType ||
      !vehicle ||
      !bookingTime
    ) {
      return res.status(400).json({ msg: "Missing required booking details" });
    }

    // Safely handle totalPrice
    const safePrice =
      totalPrice && !isNaN(Number(totalPrice)) ? Number(totalPrice) : 0;

    const timestamp = Date.now();

    const newBooking = new Booking({
      user: userId,
      pickupLocation,
      dropoffLocation,
      serviceType,
      vehicle,
      is_excort,
      bookingDate,
      bookingTime,
      notes,
      bookingId: timestamp,
      totalPrice: safePrice, // ✅ safe numeric fallback
    });

    await newBooking.save();

    // Notify admins
    const admins = await admin.find();
    if (admins.length > 0) {
      const notifications = admins.map((admin) => ({
        noti_type: "info",
        event: "New Booking",
        event_id: newBooking._id.toString(),
        message: `A new booking has been placed by ${firstName}`,
        timestamp: Date.now(),
        receiver_id: admin._id,
        sender_id: userId,
      }));

      await Notification.insertMany(notifications);

      const adminEmails = admins.map((a) => a.email).filter(Boolean);
      sendBookingEmailToAdmin(newBooking, req.user, phone_no, adminEmails);
    } else {
      console.warn("No admins found — skipping notifications");
    }

    // Update statistics
    const stats = await Statistics.findOne({ doc_type: "admin" });
    if (stats) {
      stats.total_bookings += 1;
      stats.total_pending_bookings += 1;
      stats.active_bookings += 1;
      await stats.save();
    } else {
      await Statistics.create({
        doc_type: "admin",
        total_bookings: 1,
        total_pending_bookings: 1,
        active_bookings: 1,
      });
    }

    // Response
    res.status(201).json({
      msg: "Booking created successfully",
      booking: {
        ...newBooking._doc,
        user: {
          _id: req.user._id,
          fullName: `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim(),
          email: req.user.email,
        },
      },
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ msg: "Server error while creating booking" });
  }
});

// ===== Get a Single Booking by ID =====
router.get("/booking/:id", authenticateUser, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("user", "name email");
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // check if booking belongs to user
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.json(booking);
  } catch (error) {
    console.error("Fetch booking error:", error);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});


// ===== Endpoint to Rebook a Previous Booking ===== //
router.post("/bookings/rebook/:id", authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const oldBooking = await Booking.findById(id);
    if (!oldBooking) {
      return res.status(404).json({ msg: "Booking not found" });
    }

    // Ensure user owns the booking
    if (oldBooking.user.toString() !== userId.toString()) {
      return res.status(403).json({ msg: "Unauthorized to rebook this ride" });
    }

    // Create new booking using the old one’s details (but new date/time)
    const { bookingDate, bookingTime } = req.body;

    if (!bookingDate || !bookingTime) {
      return res.status(400).json({ msg: "Please provide new booking date and time" });
    }

    const newBooking = new Booking({
      user: userId,
      pickupLocation: oldBooking.pickupLocation,
      dropoffLocation: oldBooking.dropoffLocation,
      serviceType: oldBooking.serviceType,
      vehicle: oldBooking.vehicle,
      bookingDate,
      bookingTime,
      totalPrice: oldBooking.totalPrice || "-",
      notes: oldBooking.notes || "",
    });

    await newBooking.save();

    res.status(201).json({
      msg: "Ride rebooked successfully",
      booking: newBooking,
    });
  } catch (error) {
    console.error("Error rebooking:", error);
    res.status(500).json({ msg: "Server error while rebooking" });
  }
});

// ======= Get all booking of a user ====== //
router.get("/bookings/all", authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;

    const bookings = await Booking.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("rider", "name email")
      .populate("user", "name email");


    if (!bookings || bookings.length === 0) {
      return res.status(200).json({ msg: "No bookings found", bookings: [] });
    }


    res.status(200).json({
      msg: "All user bookings retrieved successfully",
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== Endpoint to Get a user's Recent Bookings ====//
router.get("/bookings/user", authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("Authenticated user:", userId);


    // Use `user` instead of `userId`
    const bookings = await Booking.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("rider", "name email") // optional if you want rider info
      .populate("user", "name email"); // optional

    res.status(200).json({
      msg: "Bookings retrieved successfully",
      bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/refresh_booking", authenticateUser, async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: "bookingId required" });
    }

    // Find the booking and populate user + rider info
    const booking = await Booking.findById(bookingId)
      .populate("user", "firstName lastName email")
      .populate("rider", "firstName lastName email");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({
      success: true,
      message: "Booking refreshed successfully",
      data: booking,
    });
  } catch (err) {
    console.error("Error refreshing booking:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});



router.post("/confirm_payment", authenticateUser, async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: "bookingId is required" });
    }

    const booking = await Booking.findById(bookingId).populate("user", "firstName lastName email");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // ✅ Fetch all admins from DB
    const admins = await admin.find();
    const adminEmails = admins.map((a) => a.email);

    if (adminEmails.length === 0) {
      return res.status(404).json({ success: false, message: "No admins found to notify" });
    }

    // ✅ Send mail to all admin emails
    await sendPaymentConfirmationEmail(booking, adminEmails);

    res.status(200).json({
      success: true,
      message: "Payment confirmation sent to all admins.",
    });
  } catch (err) {
    console.error("Error confirming payment:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// Check Payment Status
router.post("/check_payment_status", async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: "bookingId is required" });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({
      success: true,
      paymentStatus: booking.paymentStatus || "pending",
    });
  } catch (err) {
    console.error("Error checking payment status:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
});



module.exports = router;
