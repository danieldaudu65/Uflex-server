const express = require('express');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const User = require('../models/User');
const { sendOTP } = require('../utils/nodemailer');

function generateUflexId(fullName = '') {
  const cleanName = fullName.replace(/\s+/g, '').toUpperCase().slice(0, 3);
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase(); // 5 chars
  return (cleanName + randomPart).slice(0, 8);
}


const router = express.Router();


// Endpoint for user to sign up
router.post('/signup', async (req, res) => {
  const { password, email, lastName, firstName, phoneNumber } = req.body;

  // Check if any required field is missing
  if (!password || !email || !firstName || !lastName || !phoneNumber) {
    return res.status(400).send({ status: "error", msg: "Fill in your details" });
  }

  try {
    // Check if email already exists
    const found = await User.findOne({ email }).lean();
    if (found) {
      return res.status(400).send({ status: 'error', msg: `User with this email: ${email} already exists` });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      email,
      passwordHash: hashedPassword,  // 👈 FIXED
      lastName,
      firstName,
      phoneNumber
    });

    await newUser.save();
    res.status(201).send({ msg: 'You signed up successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "error", msg: error.message });
  }
});

// Endpoint for user to log in

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ status: 'Error', msg: 'All fields must be filled' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send({ status: 'Error', msg: 'Incorrect email or password' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch)
      return res.status(400).send({ status: 'Error', msg: 'Incorrect email or password' });

    // ✅ Create token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ✅ Mark online
    user.is_online = true;

    // ✅ Generate uflex_Id if not exists
    if (!user.uflex_Id) {
      let newId;
      let isUnique = false;

      // Loop until we get a unique ID
      while (!isUnique) {
        newId = generateUflexId(`${user.firstName || ''}${user.lastName || ''}`);
        const existing = await User.findOne({ uflex_Id: newId });
        if (!existing) isUnique = true;
      }

      user.uflex_Id = newId;
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.__v;

    res.status(200).send({
      status: 'Success',
      msg: 'You have successfully logged in',
      user: userObj,
      token
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "error", msg: error.message });
  }
});
// Forgot password route
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send({ msg: 'User with given email does not exist' });
    }

    const otp = crypto.randomInt(10000, 999999).toString();
    user.otp = otp;
    user.otptime = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();
    await sendOTP(email, otp);

    res.status(200).send({ msg: "OTP sent to email" }); // 👈 Added response

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send({ msg: 'Server error' });
  }
});

// Verify OTP route
// ✅ Verify OTP and Reset Password
router.post('/verify-otp', async (req, res) => {
  const { otp, newPassword } = req.body;

  try {
    // 1️⃣ Validate input
    if (!otp || !newPassword) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    // if (newPassword ) {
    //   return res.status(400).json({ msg: 'Passwords do not match' });
    // }

    // 2️⃣ Find user with OTP
    const user = await User.findOne({ otp });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid OTP' });
    }

    // 3️⃣ Check expiry time (assuming you saved user.otptime when sending OTP)
    if (Date.now() > user.otptime) {
      return res.status(400).json({ msg: 'OTP has expired' });
    }

    // 4️⃣ Hash new password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 5️⃣ Update user record
    user.passwordHash = hashedPassword;
    user.otp = null;        // clear OTP
    user.otptime = null;    // clear OTP time
    await user.save();

    // 6️⃣ Send success response
    res.status(200).json({ msg: 'Password reset successful!' });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Reset password route
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      _id: decoded.userId,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send({ msg: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.passwordHash = hashedPassword; // 👈 FIXED
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).send({ msg: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send({ msg: 'Server error' });
  }
});

module.exports = router;
