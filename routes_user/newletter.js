const express = require("express");
const router = express.Router();
const Admin = require("../models/admin");
const Newsletter = require("../models/newsletter");
const {
  sendEmailToAdminForNewsLetterJoin,
  sendEmailToUserForNewsLetterJoin,
} = require("../utils/nodemailer"); // adjust path as needed

// ====== Subscribe Endpoint ======
router.post("/newsletter/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // ✅ Check if already subscribed
    const exists = await Newsletter.findOne({ email });
    if (exists)
      return res.status(409).json({ message: "Email already subscribed" });

    // ✅ Save to database
    const newEntry = new Newsletter({ email });
    await newEntry.save();

    // ✅ Fetch all admins from DB
    const admins = await Admin.find();
    const adminEmails = admins.map((a) => a.email);

    // ✅ Send emails
    await sendEmailToAdminForNewsLetterJoin(email, adminEmails);
    await sendEmailToUserForNewsLetterJoin(email);

    return res.status(200).json({ message: "Subscription successful" });
  } catch (error) {
    console.error("❌ Error subscribing to newsletter:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
