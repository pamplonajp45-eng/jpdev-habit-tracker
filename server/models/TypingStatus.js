const mongoose = require("mongoose");

const TypingStatusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  conversationWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isTyping: {
    type: Boolean,
    default: false,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    expires: 30, // Auto-delete after 30 seconds (MongoDB TTL)
  },
});

// Compound index for efficient querying
TypingStatusSchema.index({ userId: 1, conversationWith: 1 }, { unique: true });

module.exports = mongoose.model("TypingStatus", TypingStatusSchema);
