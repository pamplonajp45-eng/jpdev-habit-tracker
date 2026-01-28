const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    frequencyType: {
        type: String,
        enum: ['daily', 'weekly', 'custom'],
        default: 'daily'
    },
    frequencyData: {
        type: [Number], // For weekly: [0,1,2] (Sun, Mon, Tue); For custom: [interval]
        default: []
    },
    streak: {
        type: Number,
        default: 0
    },
    lastCompletedDate: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Habit', HabitSchema);
