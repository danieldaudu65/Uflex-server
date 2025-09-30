const jwt = require("jsonwebtoken");
require("dotenv").config();

function riderAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).send({ status: "Error", msg: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "rider") {
      return res.status(403).send({ status: "Error", msg: "Access denied. Rider only." });
    }

    req.rider = decoded; // attach rider details to request
    next();
  } catch (error) {
    res.status(401).send({ status: "Error", msg: "Invalid or expired token" });
  }
}

module.exports = riderAuth;
