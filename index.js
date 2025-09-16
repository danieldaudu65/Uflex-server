const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// Connect to DB
connectDB();

// Middlewares
app.use(express.json());

// Allowed origins
const allowedOrigins = [
  "http://localhost:5175",
  "http://localhost:5173",
  "http://localhost:5174",
];

// CORS middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Session middleware (required for Twitter OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || "uflex_secret_key",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000, 
  },
}));

// Routes
app.use("/auth", require("./routes_user/auth"));
app.use("/authenticateUser", require("./routes_user/authenticateUser"));
app.use("/bookingController", require("./routes_user/bookingController"));
app.use("/paymentController", require("./routes_user/paymentController"));
app.use("/vehicleController", require("./routes_user/vehicleController"));

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
