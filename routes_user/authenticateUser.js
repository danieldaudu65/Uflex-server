const { verifyToken } = require("../config/jwt");
const User = require("../models/User");

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = verifyToken(token); // ✅ now using config/jwt.js
    const user = await User.findOne({ _id: decoded._id, "tokens.token": token });

    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Please authenticate." });
  }
};

module.exports = authenticateUser;
