const express = require('express');
require('dotenv').config();

const Booking = require('../models/booking');

const router = express.Router();

// Create a new booking
router.post('/bookings', async (req, res) => {
  try {
    const booking = await Booking.create({
      ...req.body,
      user: req.user, // assuming middleware attaches user
    });
    res.status(201).json({ status: 'Success', msg: 'Booking created', booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'Error', msg: error.message });
  }
});

// Get all bookings for logged-in user
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user }).populate('vehicle');
    res.status(200).json({ status: 'Success', bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'Error', msg: error.message });
  }
});

// Get single booking by ID
router.get('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('vehicle');
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
    );
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
    res.status(200).json({ status: 'Success', msg: 'Booking cancelled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'Error', msg: error.message });
  }
});

module.exports = router;
