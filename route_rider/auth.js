const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendMail } = require("../utils/nodemailer");
require("dotenv").config();

const Rider = require("../models/rider");
const Blacklist = require("../models/blacklist");
const riderAuth = require("../riderAuth"); 

const router = express.Router();

// ====================== SIGNUP RIDER ======================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, number, car, password } = req.body;

    if (!name || !email || !number || !car || !password) {
      return res.status(400).send({ status: "Error", msg: "All fields are required" });
    }

    // Check if rider already exists
    const existingRider = await Rider.findOne({ email });
    if (existingRider) {
      return res.status(400).send({ status: "Error", msg: "Rider already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const rider = await Rider.create({
      name,
      email,
      number,
      car,
      password: hashedPassword,
    });

    res.status(201).send({
      status: "Success",
      msg: "Rider registered successfully",
      rider: { id: rider._id, name: rider.name, email: rider.email, car: rider.car },
    });
  } catch (error) {
    res.status(500).send({ status: "Error", msg: error.message });
  }
});

// ====================== LOGIN RIDER ======================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({ status: "Error", msg: "Email and password are required" });
    }

    const rider = await Rider.findOne({ email });
    if (!rider) {
      return res.status(404).send({ status: "Error", msg: "Rider not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, rider.password);
    if (!isMatch) {
      return res.status(400).send({ status: "Error", msg: "Invalid credentials" });
    }

    // Create JWT
    const token = jwt.sign(
      { id: rider._id, email: rider.email, role: "rider" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).send({
      status: "Success",
      msg: "Login successful",
      token,
      rider: { id: rider._id, name: rider.name, email: rider.email, car: rider.car },
    });
  } catch (error) {
    res.status(500).send({ status: "Error", msg: error.message });
  }
});

// ====================== GET RIDER PROFILE ======================
router.get("/me", riderAuth, async (req, res) => {
  try {
    const rider = await Rider.findById(req.rider.id).select("-password");
    if (!rider) return res.status(404).send({ status: "Error", msg: "Rider not found" });

    res.status(200).send({ status: "Success", rider });
  } catch (error) {
    res.status(500).send({ status: "Error", msg: error.message });
  }
});

// ====================== FORGOT PASSWORD ======================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const rider = await Rider.findOne({ email });
    if (!rider) {
      return res.status(404).send({ status: "Error", msg: "Rider not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    rider.resetToken = resetToken;
    rider.resetTokenExpiry = Date.now() + 1000 * 60 * 15; // 15 minutes expiry
    await rider.save();

    // Send reset link via email
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendMail(
      rider.email,
      "Password Reset Request",
      `Hello ${rider.name},\n\nPlease use the link below to reset your password:\n${resetLink}\n\nThis link will expire in 15 minutes.`
    );

    res.status(200).send({ status: "Success", msg: "Password reset link sent to email" });
  } catch (error) {
    res.status(500).send({ status: "Error", msg: error.message });
  }
});

// ====================== RESET PASSWORD ======================
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).send({ status: "Error", msg: "New password is required" });
    }

    const rider = await Rider.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!rider) {
      return res.status(400).send({ status: "Error", msg: "Invalid or expired token" });
    }

    // Hash new password
    rider.password = await bcrypt.hash(newPassword, 10);

    // Clear reset fields
    rider.resetToken = undefined;
    rider.resetTokenExpiry = undefined;
    await rider.save();

    res.status(200).send({ status: "Success", msg: "Password reset successful" });
  } catch (error) {
    res.status(500).send({ status: "Error", msg: error.message });
  }
});

// ====================== SIGNOUT RIDER ======================
router.post("/signout", riderAuth, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.decode(token);

    // Save token in blacklist until expiration
    await Blacklist.create({
      token,
      expiresAt: new Date(decoded.exp * 1000),
    });

    res.status(200).send({ status: "Success", msg: "Signed out successfully" });
  } catch (error) {
    res.status(500).send({ status: "Error", msg: error.message });
  }
});

module.exports = router;
