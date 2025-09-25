const express = require('express');
require('dotenv').config();

const Booking = require('../models/booking');
const Payment = require('../models/payment');
const Vehicle = require('../models/vehicle');
const { sendMail } = require('../utils/nodemailer'); // custom email util

const router = express.Router();

// ====================== STEP 1: CREATE BOOKING (without vehicle yet) ======================
router.post('/bookings', async (req, res) => {
  try {
    const {
      pickupLocation,
      dropoffLocation,
      bookingDate,
      bookingTime,
      serviceType,
      notes,
    } = req.body;

    const booking = await Booking.create({
      user: req.user._id,
      pickupLocation,
      dropoffLocation,
      bookingDate,
      bookingTime,
      serviceType,
      notes,
    });

    res.status(201).send({
      status: 'Success',
      msg: 'Booking created. Proceed to select vehicle.',
      booking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: 'Error', msg: error.message });
  }
});

// ====================== STEP 2: ASSIGN VEHICLE & CALCULATE PRICE ======================
router.put('/bookings/:id/vehicle', async (req, res) => {
  try {
    const { vehicleId } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).send({ status: 'Error', msg: 'Vehicle not found' });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!booking) {
      return res.status(404).send({ status: 'Error', msg: 'Booking not found' });
    }

    // Calculate total price (simplified as 1 day trip, but can be dynamic)
    const totalPrice = vehicle.pricePerDay;

    booking.vehicle = vehicle._id;
    booking.totalPrice = totalPrice;
    await booking.save();

    res.status(200).send({
      status: 'Success',
      msg: 'Vehicle assigned. Proceed to payment.',
      booking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: 'Error', msg: error.message });
  }
});

// ====================== STEP 3: INITIATE PAYMENT ======================
router.post('/bookings/:id/payment', async (req, res) => {
  try {
    const { method } = req.body; // e.g. "transfer"

    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!booking) {
      return res.status(404).send({ status: 'Error', msg: 'Booking not found' });
    }

    if (!booking.totalPrice) {
      return res.status(400).send({ status: 'Error', msg: 'Assign vehicle before payment' });
    }

    const payment = await Payment.create({
      booking: booking._id,
      userEmail: req.user.email,
      method,
      amount: booking.totalPrice,
      status: 'awaiting_admin',
    });

    booking.payment = payment._id;
    await booking.save();

    await sendMail(
      req.user.email,
      'Payment Initiated',
      `Hi ${req.user.firstName}, you initiated a payment of ₦${booking.totalPrice}. Please complete the transfer.`
    );

    res.status(201).send({
      status: 'Success',
      msg: 'Payment created. Awaiting confirmation.',
      payment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: 'Error', msg: error.message });
  }
});

// ====================== GET ALL USER BOOKINGS ======================
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('vehicle')
      .populate('payment')
      .populate("rider", "firstName lastName phone email")
      .populate("user", "firstName lastName phone email");

    res.status(200).send({ status: 'Success', bookings });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: 'Error', msg: error.message });
  }
});

// ====================== GET SINGLE BOOKING ======================
router.get('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate('vehicle')
      .populate('payment')
      .populate("rider", "firstName lastName phone email")
      .populate("user", "firstName lastName phone email");

    if (!booking) {
      return res.status(404).send({ status: 'Error', msg: 'Booking not found' });
    }

    res.status(200).send({ status: 'Success', booking });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: 'Error', msg: error.message });
  }
});

// ====================== CANCEL BOOKING ======================
router.delete('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!booking) {
      return res.status(404).send({ status: 'Error', msg: 'Booking not found' });
    }

    if (booking.payment) {
      await Payment.findByIdAndDelete(booking.payment);
    }

    res.status(200).send({
      status: 'Success',
      msg: 'Booking and payment cancelled',
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: 'Error', msg: error.message });
  }
});

// ====================== RESCHEDULE BOOKING ======================
router.put('/bookings/:id/reschedule', async (req, res) => {
  try {
    const { bookingDate, bookingTime, notes } = req.body;

    // Validate inputs
    if (!bookingDate || !bookingTime) {
      return res.status(400).send({
        status: 'Error',
        msg: 'New booking date and time are required',
      });
    }

    // Find booking
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!booking) {
      return res.status(404).send({ status: 'Error', msg: 'Booking not found' });
    }

    // Prevent rescheduling if already completed or cancelled
    if (["completed", "cancelled"].includes(booking.bookingStatus)) {
      return res.status(400).send({
        status: 'Error',
        msg: `Booking cannot be rescheduled because it is already ${booking.bookingStatus}`,
      });
    }

    // Update fields
    booking.bookingDate = bookingDate;
    booking.bookingTime = bookingTime;
    if (notes) booking.notes = notes;

    await booking.save();

    // Send email notification
    await sendMail(
      req.user.email,
      'Booking Rescheduled',
      `Hi ${req.user.firstName}, your booking has been successfully rescheduled to ${bookingDate} at ${bookingTime}.`
    );

    res.status(200).send({
      status: 'Success',
      msg: 'Booking rescheduled successfully',
      booking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: 'Error', msg: error.message });
  }
});


module.exports = router;
