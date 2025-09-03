const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
const app = express();

// connect to DB
connectDB();

// middlewares
app.use(express.json());
app.use(cors());

// routes
app.use("/auth", require("./routes_user/auth"));
app.use("/authenticateUser", require("./routes_user/authenticateUser"));

// server
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
