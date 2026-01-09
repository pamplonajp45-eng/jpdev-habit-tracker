const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['streak', 'total_count', 'deadline_count'],
        required: true,
        default: 'total_count'
    },
    targetValue: {
        type: Number,
        required: true,
        min: 1
    },
    currentValue: {
        type: Number,
        default: 0
    },
    linkedHabitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habit',
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    deadline: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'failed', 'paused'],
        default: 'active'
    },
    completedAt: {
        type: Date
    },
    badge: {
        type: String,
        default: 'default_goal_badge.png'
    },
    xpReward: {
        type: Number,
        default: 50
    }
}, { timestamps: true });

// Index for efficient querying of active goals for a user
GoalSchema.index({ userId: 1, status: 1 });
GoalSchema.index({ linkedHabitId: 1, status: 1 });

module.exports = mongoose.model('Goal', GoalSchema);
