const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded); // 👈 Add this

    // use decoded.userId based on your sign()
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log("No user found for id:", decoded.userId);
      return res.status(401).json({ error: "Invalid token or user not found" });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = authenticateUser