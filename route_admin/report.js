// ====================== REPORT ROUTES ======================
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");
const Report = require("../models/report");
const Stats = require("../models/stats"); 

// Helper function: verify admin
async function verifyAdmin(token) {
  if (!token) throw new Error("Token is required");

  const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
  const admin = await Admin.findOne({ _id: decoded._id }).select("-password").lean();

  if (!admin) throw new Error("Admin not found");
  if (admin.is_block === true) throw new Error("Account has been blocked, please contact master admin");

  return admin;
}


// Get all unresolved reports from users
router.post("/users_unresolved", async (req, res) => {
  const { token, pageCount = 1, resultPerPage = 10 } = req.body;

  try {
    await verifyAdmin(token);

    const page = Math.max(0, pageCount - 1);
    const query = { reporter: "user", is_resolved: false };

    const [reports, count] = await Promise.all([
      Report.find(query)
        .sort({ timestamp: -1 })
        .limit(resultPerPage)
        .skip(page * resultPerPage)
        .lean(),
      Report.countDocuments(query),
    ]);

    if (count === 0) {
      return res.status(200).send({ status: "ok", msg: "No user reports available presently" });
    }

    return res.status(200).send({ status: "ok", msg: "Success", count, reports });
  } catch (error) {
    console.error(error);
    return res.status(400).send({ status: "error", msg: error.message });
  }
});

// View a single report
router.post("/report", async (req, res) => {
  const { token, report_id } = req.body;

  try {
    await verifyAdmin(token);

    const report = await Report.findById(report_id).lean();
    if (!report) return res.status(404).send({ status: "error", msg: "Report not found" });

    return res.status(200).send({ status: "ok", msg: "Success", report });
  } catch (error) {
    console.error(error);
    return res.status(400).send({ status: "error", msg: error.message });
  }
});

// Resolve a report
router.post("/resolve", async (req, res) => {
  const { token, report_id } = req.body;

  try {
    await verifyAdmin(token);

    let report = await Report.findById(report_id).select("is_resolved").lean();
    if (!report) return res.status(404).send({ status: "error", msg: "Report not found" });

    if (report.is_resolved) {
      return res.status(400).send({ status: "error", msg: "This report has already been resolved" });
    }

    const resolvedReport = await Report.findByIdAndUpdate(
      report_id,
      { is_resolved: true, resolved_timestamp: Date.now() },
      { new: true }
    ).lean();

    // Update statistics
    await Stats.updateOne(
      { doc_type: "admin" },
      { $inc: { total_pending_reports: -1, total_resolved_reports: 1 } },
      { upsert: true }
    );

    return res.status(200).send({ status: "ok", msg: "Report resolved successfully", report: resolvedReport });
  } catch (error) {
    console.error(error);
    return res.status(400).send({ status: "error", msg: error.message });
  }
});

// Get all resolved reports from users
router.post("/users_resolved", async (req, res) => {
  const { token, pageCount = 1, resultPerPage = 10 } = req.body;

  try {
    await verifyAdmin(token);

    const page = Math.max(0, pageCount - 1);
    const query = { reporter: "user", is_resolved: true };

    const [reports, count] = await Promise.all([
      Report.find(query)
        .sort({ resolved_timestamp: -1 })
        .limit(resultPerPage)
        .skip(page * resultPerPage)
        .lean(),
      Report.countDocuments(query),
    ]);

    if (count === 0) {
      return res.status(200).send({ status: "ok", msg: "No resolved reports available presently" });
    }

    return res.status(200).send({ status: "ok", msg: "Success", count, reports });
  } catch (error) {
    console.error(error);
    return res.status(400).send({ status: "error", msg: error.message });
  }
});


module.exports = router;
