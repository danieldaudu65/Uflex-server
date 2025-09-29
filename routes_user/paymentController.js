const express = require('express');
require('dotenv').config();

const Payment = require('../models/payment');
const { sendMail } = require('../utils/nodemailer');

const router = express.Router();

/**
 * User uploads proof of payment
 */
router.put('/:id/user-paid', async (req, res) => {
  try {
    const payment = await Payment.findOneAndUpdate(
      { _id: req.params.id, userEmail: req.user.email }, // ensure it's their payment
      {
        status: 'paid',
        paymentProof: req.body.paymentProof, // e.g. receipt image URL
      },
      { new: true }
    ).populate('booking');

    if (!payment) {
      return res.status(404).json({ status: 'Error', msg: 'Payment not found' });
    }

    // Notify user
    await sendMail(
      payment.userEmail,
      'Payment Submitted',
      `Your payment proof for booking ${payment.booking._id} has been submitted. Please wait for confirmation.`
    );

    res.send({ status: 'Success', msg: 'Payment marked as paid', payment });
  } catch (error) {
    res.status(500).send({ status: 'Error', msg: error.message });
  }
});

/**
 * Get all payments for logged-in user
 */
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find({ userEmail: req.user.email }).populate('booking');
    res.status(200).json({ status: 'Success', payments });
  } catch (error) {
    res.status(500).json({ status: 'Error', msg: error.message });
  }
});

/**
 * Get a single payment
 */
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, userEmail: req.user.email }).populate('booking');
    if (!payment) {
      return res.status(404).json({ status: 'Error', msg: 'Payment not found' });
    }
    res.status(200).json({ status: 'Success', payment });
  } catch (error) {
    res.status(500).json({ status: 'Error', msg: error.message });
  }
});

module.exports = router;
