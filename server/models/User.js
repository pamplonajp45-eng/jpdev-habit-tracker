const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    badges: [{
        id: { type: String },
        earnedAt: { type: Date, default: Date.now }
    }],

    level: {
        type: Number,
        default: 1
    },
    xp: {
        type: Number,
        default: 0
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please fill a valid email address'
        ]
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String,
        select: false // ito yung verfication code na magsesend sa gmail ng user
    },
    verificationCodeExpires: {
        type: Date,
        select: false
    },
    resetCode: {
        type: String,
        select: false
    },
    resetCodeExpires: {
        type: Date,
        select: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isOnline: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);
