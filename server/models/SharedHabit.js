const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    completedToday: { type: Boolean, default: false },
    lastCompletedDate: { type: String, default: "" }, // "YYYY-MM-DD"
    note: { type: String, default: "" },
});

const sharedHabitSchema = new mongoose.Schema({
    name: { type: String, required: true },
    emoji: { type: String, default: "🤝" },
    category: { type: String, default: "general" },
    frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
        default: "daily"
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    members: [memberSchema],
    streak: { type: Number, default: 0 },
    lastTeamCompletedDate: { type: String, default: "" }, // "YYYY-MM-DD"
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.SharedHabit || mongoose.model("SharedHabit", sharedHabitSchema);
