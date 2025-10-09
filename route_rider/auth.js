const express = require("express");
const router = express.Router();
// const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Rider = require("../models/rider");
const bcrypt = require("bcryptjs");



const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    req.user = decoded; // attach the decoded user info (id, email)
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};




// ==== Rider Signup ==== //
router.post("/signup", async (req, res) => {
    const { firstName, lastName, email, phone, vehicle, password } = req.body;

    try {
        const exists = await Rider.findOne({ email });
        if (exists) return res.status(400).json({ message: "Email already in use" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const rider = new Rider({
            firstName,
            lastName,
            email,
            phone,
            vehicle,
            password: hashedPassword,
        });

        await rider.save();

        const token = jwt.sign(
            { id: rider._id, email: rider.email },
            process.env.JWT_SECRET || "secret123",
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "Rider created successfully",
            token,
            rider,
        });
    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ message: "Server error during signup" });
    }
});


// ==== Rider Login ==== //
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const rider = await Rider.findOne({ email });
    if (!rider) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, rider.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: rider._id, email: rider.email },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "7d" }
    );

    // Remove password before sending response
    const { password: _, ...riderWithoutPassword } = rider.toObject();

    res.status(200).json({
      message: "Login successful",
      token,
      rider: riderWithoutPassword, // <-- no password here
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});


module.exports = router;
