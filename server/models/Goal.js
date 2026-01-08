const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    targetValue: {
        type: Number,
        required: true
    },
    currentProgress: {
        type: Number,
        default: 0
    },
    linkedHabitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habit'
    },
    completed: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Goal', GoalSchema);
