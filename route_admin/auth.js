const Admin = require('../models/admin');
const jwt = require('jsonwebtoken');
const express = require('express')
const route = express.Router()
const crypto = require('crypto');

const bcrypt = require('bcrypt');

const { sendOTP } = require('../utils/nodemailer');
// const sendOTP = require('../utils/nodemailer');



route.post('/signup', async (req, res) => {
    const { name, number, email, password } = req.body;

    try {
        const exists = await Admin.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already in use' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new Admin();

        admin.name = name
        admin.number = number
        admin.email = email
        admin.password = hashedPassword

        await admin.save();

        res.status(201).json({ message: 'Admin created successfully', admin });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
})


route.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please fill in the correct details' });
    }

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        const isMatch = await bcrypt.hash(password, 10)
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        // Generate JWT token
        const token = jwt.sign(
            {
                id: admin._id, email: admin.email, role: admin.role,  // ✅ include this
                name: admin.name,
            },
            process.env.JWT_SECRET || "secret123",
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                number: admin.number,
                role: admin.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});




route.post('/forgot_password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // Find the admin
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        // Generate 5-digit OTP
        const otp = crypto.randomInt(10000, 99999).toString();
        const otpTime = new Date();

        // Save OTP and timestamp in DB
        admin.otp = otp;
        admin.otpTime = otpTime;
        await admin.save();

        // Send OTP via email
        await sendOTP(email, otp);

        res.status(200).json({ message: 'OTP sent to your email' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


route.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        // Check if OTP matches and is not expired (e.g., valid for 10 minutes)
        const now = new Date();
        const expiry = new Date(admin.otpTime);
        expiry.setMinutes(expiry.getMinutes() + 10);

        if (admin.otp !== otp) {
            return res.status(401).json({ message: 'Invalid OTP' });
        }

        if (now > expiry) {
            return res.status(401).json({ message: 'OTP has expired' });
        }

        // OTP is valid
        admin.otp = null; // Clear OTP after use
        admin.otpTime = null;
        await admin.save();

        res.status(200).json({ message: 'OTP verified successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});



module.exports = route