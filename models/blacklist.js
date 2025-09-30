const mongoose = require("mongoose");

const BlacklistSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

// TTL index → MongoDB will auto-delete expired tokens
BlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Blacklist", BlacklistSchema);
