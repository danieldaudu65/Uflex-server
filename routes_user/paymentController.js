const express = require('express');
require('dotenv').config();

const Payment = require('../models/payment');

const router = express.Router();

// Make a payment
router.post('/payments', async (req, res) => {
  try {
    const payment = await Payment.create(req.body);
    res.status(201).json({ status: 'Success', msg: 'Payment created', payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'Error', msg: error.message });
  }
});

// Get all payments
router.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.find().populate('booking');
    res.status(200).json({ status: 'Success', payments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'Error', msg: error.message });
  }
});

// Get single payment by ID
router.get('/payments/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('booking');
    if (!payment) {
      return res.status(404).json({ status: 'Error', msg: 'Payment not found' });
    }
    res.status(200).json({ status: 'Success', payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'Error', msg: error.message });
  }
});

module.exports = router;
