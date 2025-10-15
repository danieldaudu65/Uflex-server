const mongoose = require('mongoose');

const ReportsSchema = new mongoose.Schema({
  user_name: String,
  user_id: String,
  user_img_url: String,
  user_email: String,
  body: String,
  timestamp: Number,
  service_type: String,
  is_resolved: Boolean,
  resolved_timestamp: Number,
}, { collection: 'reports' });

module.exports = mongoose.models.Report || mongoose.model('Report', ReportsSchema);
