const mongoose = require('mongoose');

const ReportsSchema = mongoose.Schema({
    user_name: String, 
    user_id: String,
    user_img_url: String,
    user_email: String,
    body: String, 
    report_img_urls: [String],
    report_img_ids: [String],
    timestamp: Number, 
    service_type: String, 
    is_resolved: Boolean, 
    resolved_timestamp: Number,
}, {collection: 'reports'});

const model = mongoose.model('Report', ReportsSchema)
module.exports = model;