const mongoose = require("mongoose");

const HabitHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Habit",
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    index: true, // Key for querying heatmap data
  },
  status: {
    type: String,
    enum: ["completed", "missed"],
    default: "completed",
  },
});

// Ensure a user can only have one history record per habit per day
HabitHistorySchema.index({ habitId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("HabitHistory", HabitHistorySchema);
