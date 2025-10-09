const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const route = express.Router();

// ===== Middleware to verify token =====

const verifyToken = (req, res, next) => {
    // Try to get token from either header or body
    let token = req.headers.authorization?.split(" ")[1] || req.body.token;

    if (!token) {
        return res.status(401).json({ message: "Token is required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
        req.admin = decoded; // store decoded token info in request
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};


// ===== Get all admins =====
route.post('/all', verifyToken, async (req, res) => {
    try {
        // Only allow master admins to fetch all admins
        if (req.admin.role !== 'master') {
            return res.status(403).json({ message: 'Access denied. Only master admin can view all admins.' });
        }

        const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: admins.length, admins });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching admins' });
    }
});


// ===== Create Admin =====
// ===== Create Admin =====
route.post('/create', verifyToken, async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
    }

    try {
        // ✅ Ensure only master admin can create new admins
        if (req.admin.role !== 'master') {
            return res.status(403).json({ message: 'Access denied. Only master admin can create admins.' });
        }

        const exists = await Admin.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already exists' });

        // ✅ Generate random 6-character alphanumeric password
        const generatedPassword = Math.random().toString(36).slice(-6);

        // ✅ Hash it
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        // ✅ Create new admin
        const newAdmin = new Admin({
            name,
            email,
            password: hashedPassword,
            role: 'standard',
        });

        await newAdmin.save();

        // ✅ Send email with password
        const { sendNewAdminPasswordEmail } = require('../utils/nodemailer');
        await sendNewAdminPasswordEmail(newAdmin.email, newAdmin.name, generatedPassword);

        res.status(201).json({
            message: 'Admin created successfully',
            admin: {
                name: newAdmin.name,
                email: newAdmin.email,
                role: newAdmin.role,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


// ===== Delete Admin =====
route.post('/delete', verifyToken, async (req, res) => {
    const { adminId } = req.body;
    if (!adminId) return res.status(400).json({ message: 'Admin ID is required' });

    try {
        const deleted = await Admin.findByIdAndDelete(adminId);
        if (!deleted) return res.status(404).json({ message: 'Admin not found' });
        res.status(200).json({ message: 'Admin deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== Update Admin =====
route.post('/update', verifyToken, async (req, res) => {
    const { adminId, name, number, email, password } = req.body;
    if (!adminId) return res.status(400).json({ message: 'Admin ID is required' });

    try {
        const admin = await Admin.findById(adminId);
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        if (name) admin.name = name;
        if (number) admin.number = number;
        if (email) admin.email = email;
        if (password) admin.password = await bcrypt.hash(password, 10);

        await admin.save();
        res.status(200).json({ message: 'Admin updated successfully', admin });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Deactivate admin
route.put('/deactivate', async (req, res) => {
    const { id } = req.body; // id comes in body
    if (!id) return res.status(400).json({ success: false, message: 'Admin ID required' });

    try {
        const admin = await Admin.findById(id);
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

        // Prevent deactivation of master admin
        if (admin.role === 'master') {
            return res.status(403).json({ success: false, message: 'Cannot deactivate a master admin' });
        }

        // Deactivate admin
        admin.is_block = true;
        await admin.save();

        res.json({ success: true, admin });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Deactivate admin
route.put('/activate', async (req, res) => {
    const { id } = req.body; // id comes in body
    if (!id) return res.status(400).json({ success: false, message: 'Admin ID required' });

    try {
        const admin = await Admin.findById(id);
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

        // Prevent deactivation of master admin
        if (admin.role === 'master') {
            return res.status(403).json({ success: false, message: 'Cannot deactivate a master admin' });
        }

        // Deactivate admin
        admin.is_block = false;
        await admin.save();

        res.json({ success: true, admin });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// Edit admin role
route.put('/edit-role', async (req, res) => {
    const { id, role } = req.body; // id + role in body

    if (!id) return res.status(400).json({ success: false, message: 'Admin ID required' });
    if (!['master', 'standard'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    try {
        const admin = await Admin.findByIdAndUpdate(id, { role }, { new: true });
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

        res.json({ success: true, admin });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// ===== Block / Unblock Admin =====
route.post('/block', verifyToken, async (req, res) => {
    const { adminId, block } = req.body; // block: true or false
    if (!adminId || typeof block !== 'boolean') return res.status(400).json({ message: 'Admin ID and block status are required' });

    try {
        const admin = await Admin.findById(adminId);
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        admin.is_block = block;
        await admin.save();
        res.status(200).json({ message: `Admin ${block ? 'blocked' : 'unblocked'} successfully`, admin });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = route;
