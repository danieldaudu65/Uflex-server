const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../models/User"); // your user schema

// connect to DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("DB Error:", err));

const seedUsers = async () => {
  try {
    // 1. Read users.json from dump
    const dataPath = path.join(__dirname, "../dump/users.json");
    const users = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

    // 2. Clear old data (optional)
    await User.deleteMany();

    // 3. Insert new users
    await User.insertMany(users);

    console.log("✅ Users seeded into DB!");
    process.exit();
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

seedUsers();
