const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendContactEmailToAdmin } = require("../utils/nodemailer"); // 👈 import your email util
const report = require("../models/report");
require("dotenv").config();

const router = express.Router();

// POST /api/reports - Submit a complaint or contact form
router.post("/reports", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userData = null;

    // ✅ If user is logged in (has token)
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        userData = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        console.warn("Invalid token, continuing as guest");
      }
    }

    const {
      user_id,
      user_name,
      user_email,
      firstName,
      lastName,
      email,
      phone,
      service,
      message,
    } = req.body;

    if (!message || !email) {
      return res
        .status(400)
        .json({ success: false, message: "Email and message are required" });
    }

    // ✅ Try to find user in DB (only if not already identified via token)
    let dbUserId = null;
    if (!userData) {
      const Muser = await User.findOne({ email });
      if (Muser) dbUserId = Muser._id;
    }

    // ✅ Create the report
    const newReport = new report({
      user_id: userData ? userData.id : dbUserId || user_id || null,
      user_name: user_name || `${firstName || ""} ${lastName || ""}`.trim(),
      user_email: user_email || email,
      phone: phone || null,
      body: message,
      service_type: service || "General Inquiry",
      timestamp: Date.now(),
      is_resolved: false,
    });

    await newReport.save();

    // ✅ Get all admin emails from User model
      // ✅ Fetch all admins from DB
    const admins = await admin.find();
    const adminEmails = admins.map((a) => a.email);

    if (adminEmails.length === 0) {
      return res.status(404).json({ success: false, message: "No admins found to notify" });
    }

    // ✅ Send notification email to all admins
    await sendContactEmailToAdmin(req.body, adminEmails);

    return res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      report: newReport,
    });
  } catch (err) {
    console.error("Error submitting complaint:", err);
    res.status(500).json({
      success: false,
      message: "Server error while submitting complaint",
    });
  }
});

module.exports = router;
