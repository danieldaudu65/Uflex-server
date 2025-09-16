const mongoose = require('mongoose');

const statistics_schema = new mongoose.Schema({
    doc_type: { type: String, default: 'admin' },
    no_of_admins: { type: Number, default: 0 },
    no_of_active_admins: { type: Number, default: 0 },
    no_of_blocked_admins: { type: Number, default: 0 },
    no_of_users: { type: Number, default: 0 },
    no_of_active_users: { type: Number, default: 0 },
    no_of_blocked_users: { type: Number, default: 0 },
    no_of_riders: { type: Number, default: 0 },
    no_of_active_riders: { type: Number, default: 0 },
    no_of_blocked_riders: { type: Number, default: 0 },
    total_bookings: { type: Number, default: 0 },
    total_bookings: { type: Number, default: 0 },
    total_pending: { type: Number, default: 0 },
    total_completed_booking: { type: Number, default: 0 },
    total_cancelled_booking: { type: Number, default: 0 },
    total_cancelled_booking_by_users: { type: Number, default: 0 },
    total_cancelled_booking_by_rider: { type: Number, default: 0 },
    total_user_reports: { type: Number, default: 0 },
    total_pending_reports: { type: Number, default: 0 },
    total_resolved_reports: { type: Number, default: 0 },
    total_revenue: { type: Number, default: 0 },
    total_booking_earnings: { type: Number, default: 0 },
    total_daily_transactions: { type: Number, default: 0 },
    total_weeekly_transactions: { type: Number, default: 0 },
    total_monthly_transactions: { type: Number, default: 0 },
    total_yearly_transactions: { type: Number, default: 0 },

    pickup_radius: { type: Number, default: 50000 },
    active_booking: { type: Number, default: 0 },
}, { collections: 'statistics' });

const model = mongoose.model('Statistics', statistics_schema);
module.exports = model