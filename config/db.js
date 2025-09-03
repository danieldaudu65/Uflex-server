const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ DB Connection Successful");

    // handle mongoose disconnected
    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ Mongoose lost connection with MongoDB");
    });

  } catch (error) {
    console.error(`❌ DB Connection error: ${error.message}`);
    process.exit(1); // Exit app if DB fails
  }
};

module.exports = connectDB;
