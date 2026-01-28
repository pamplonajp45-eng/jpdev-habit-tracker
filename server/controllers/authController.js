const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log('Registration failed: User already exists', email);
            return res.status(400).json({ message: 'User already exists' });
        }

        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            console.log('Registration failed: Username already taken', username);
            return res.status(400).json({ message: 'Username already taken' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate Verification Code (6 digits)
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            verificationCode, // Ideally hash this too, but for simplicity storing plain 6-digit for now (or hash it)
            verificationCodeExpires
        });

        // Send email
        const message = `Your verification code is: ${verificationCode}. It expires in 10 minutes.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'HaBITAW Verification Code',
                message,
                html: `<h1>Your Verification Code</h1><p>${verificationCode}</p>`
            });

            res.status(201).json({
                message: 'User registered. Please verify your email.',
                userId: user._id
            });
        } catch (error) {
            console.error('Email sending failed during registration:', error);
            // Rollback user creation if email fails
            await User.findByIdAndDelete(user._id);
            return res.status(500).json({ message: 'Email could not be sent' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Verify Email
// @route   POST /api/auth/verify
// @access  Public
exports.verifyEmail = async (req, res) => {
    try {
        const { userId, code } = req.body;

        const user = await User.findById(userId).select('+verificationCode +verificationCodeExpires');

        if (!user) {
            return res.status(400).json({ message: 'Invalid user' });
        }

        if (user.isVerified) {
            return res.status(200).json({ message: 'User already verified' });
        }

        if (user.verificationCode !== code) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        if (user.verificationCodeExpires < Date.now()) {
            return res.status(400).json({ message: 'Verification code expired' });
        }

        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();

        res.status(200).json({
            message: 'Email verified successfully',
            token: generateToken(user._id),
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(401).json({ message: 'Please verify your email first', userId: user._id });
        }

        // Check password
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user.id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Request Password Reset Code
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            // We return 200 even if user not found for security, but for a habit tracker, 404 is clearer
            return res.status(404).json({ message: 'User with that email does not exist' });
        }

        // Generate Reset Code (6 digits)
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.resetCode = resetCode;
        user.resetCodeExpires = resetCodeExpires;
        await user.save();

        // Send email
        const message = `Your password reset code is: ${resetCode}. It expires in 10 minutes.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'HaBITAW Password Reset Code',
                message,
                html: `<h1>Reset Your Password</h1><p>Your 6-digit reset code is: <strong>${resetCode}</strong></p><p>This code will expire in 10 minutes.</p>`
            });

            res.status(200).json({ message: 'Reset code sent to email' });
        } catch (error) {
            console.error('Email sending failed during forgot password:', error);
            user.resetCode = undefined;
            user.resetCodeExpires = undefined;
            await user.save();
            return res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        const user = await User.findOne({ email }).select('+resetCode +resetCodeExpires');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.resetCode || user.resetCode !== code) {
            return res.status(400).json({ message: 'Invalid reset code' });
        }

        if (user.resetCodeExpires < Date.now()) {
            return res.status(400).json({ message: 'Reset code expired' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear reset fields
        user.resetCode = undefined;
        user.resetCodeExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successful. Please login with your new password.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
