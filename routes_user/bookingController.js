const express = require('express');
require('dotenv').config();

const Booking = require('../models/booking');
const Payment = require('../models/payment');
const { sendMail } = require('../utils/nodemailer'); // custom email util

const router = express.Router();

// Create a new booking
router.post('/bookings', async (req, res) => {
  try {
    // 1. Create booking
    const booking = await Booking.create({
      ...req.body,
      user: req.user, // assuming middleware attaches user
    });

    // 2. Create linked payment with initial status
    const payment = await Payment.create({
      booking: booking._id,
      userEmail: req.user.email,
      status: 'awaiting_admin',
    });

    // Link payment back to booking
    booking.payment = payment._id;
    await booking.save();

    // 3. Send email to user
    await sendMail(
      req.user.email,
      'Booking Created',
      `Hi ${req.user.firstName}, your booking has been created. The admin will contact you with payment details.`
    );

    res.status(201).json({
      status: 'Success',
      msg: 'Booking and payment created',
      booking,
      payment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'Error', msg: error.message });
  }
});

// Get all bookings for logged-in user
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user })
      .populate('vehicle')
      .populate('payment'); // show payment info too

    res.status(200).json({ status: 'Success', bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'Error', msg: error.message });
  }
});

// Get single booking by ID
router.get('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('vehicle')
      .populate('payment');
    if (!booking) {
      return res.status(404).json({ status: 'Error', msg: 'Booking not found' });
    }
    res.status(200).json({ status: 'Success', booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'Error', msg: error.message });
  }
});

// Update a booking
router.put('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('payment');
    if (!booking) {
      return res.status(404).json({ status: 'Error', msg: 'Booking not found' });
    }
    res.status(200).json({ status: 'Success', msg: 'Booking updated', booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'Error', msg: error.message });
  }
});

// Delete a booking
router.delete('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ status: 'Error', msg: 'Booking not found' });
    }

    // Also delete linked payment if it exists
    if (booking.payment) {
      await Payment.findByIdAndDelete(booking.payment);
    }

    res.status(200).json({ status: 'Success', msg: 'Booking and payment cancelled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'Error', msg: error.message });
  }
});

module.exports = router;
