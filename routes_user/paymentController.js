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
    const { paymentProof } = req.body;

    // Find payment belonging to the user
    const payment = await Payment.findOne({
      _id: req.params.id,
      userEmail: req.user.email,
    }).populate('booking');

    if (!payment) {
      return res.status(404).send({ status: 'Error', msg: 'Payment not found' });
    }

    // Prevent skipping statuses
    if (payment.status !== 'awaiting_user') {
      return res.status(400).send({
        status: 'Error',
        msg: `Invalid action. Current status is "${payment.status}"`,
      });
    }

    // Update status + proof
    payment.status = 'paid';
    payment.paymentProof = paymentProof;
    await payment.save();

    // Notify user
    await sendMail(
      payment.userEmail,
      'Payment Submitted',
      `Your payment proof for booking ${payment.booking._id} has been submitted. Please wait for admin confirmation.`
    );

    res.status(200).send({
      status: 'Success',
      msg: 'Payment marked as paid',
      payment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: 'Error', msg: error.message });
  }
});

/**
 * Get all payments for logged-in user
 */
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find({ userEmail: req.user.email })
      .populate('booking')
      .sort({ createdAt: -1 });

    res.status(200).send({ status: 'Success', payments });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: 'Error', msg: error.message });
  }
});

/**
 * Get a single payment
 */
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      userEmail: req.user.email,
    }).populate('booking');

    if (!payment) {
      return res.status(404).send({ status: 'Error', msg: 'Payment not found' });
    }

    res.status(200).send({ status: 'Success', payment });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: 'Error', msg: error.message });
  }
});

module.exports = router;
