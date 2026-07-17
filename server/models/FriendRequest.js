const mongoose = require("mongoose");

const FriendRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for pending requests query
FriendRequestSchema.index({ recipient: 1, status: 1 });
FriendRequestSchema.index({ sender: 1, recipient: 1, status: 1 });

module.exports = mongoose.model("FriendRequest", FriendRequestSchema);
