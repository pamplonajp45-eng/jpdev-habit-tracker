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
    required: true,
    index: true,
  },
  habitName: String, // Store name for easier historical display
  habitType: {
    type: String,
    enum: ["personal", "shared"],
    default: "personal"
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
  note: {
    type: String,
    default: "",
  },
});

// Ensure a user can only have one history record per habit per day
HabitHistorySchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("HabitHistory", HabitHistorySchema);
