const express = require("express");
const router = express.Router();
const Notification = require("../models/notification");



// Helper function: verify admin
async function verifyAdmin(token) {
  if (!token) throw new Error("Token is required");


  const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
  const admin = await Admin.findById(decoded.id);

  if (!admin) throw new Error("Admin not found");
  if (admin.is_block === true) throw new Error("Account has been blocked, please contact master admin");

  return admin;
}


// ✅ Get all unread notifications
router.post("/unread_notifications", async (req, res) => {
  try {
    const { token } = req.body;
    const admin = await verifyAdmin(token); // verify the admin token

    // Find all unread notifications for this admin
    const notifications = await Notification.find({
      receiver_id: admin._id,
      status: "unread",
    })
      .sort({ timestamp: -1 })
      .lean();

    res.status(200).json({
      status: "ok",
      total: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    res.status(400).json({ status: "error", msg: error.message });
  }
});

module.exports = router;
