const mongoose = require("mongoose");

const ReactionSchema = new mongoose.Schema(
  {
    emoji: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { _id: false },
);

const MessageSchema = new mongoose.Schema({
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
  text: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
  replyTo: {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    text: { type: String, default: "" },
    sender: { type: String, default: "" },
  },
  reactions: [ReactionSchema],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound index for chat history queries (most common query pattern)
MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
MessageSchema.index({ recipient: 1, sender: 1, createdAt: -1 });

module.exports = mongoose.model("Message", MessageSchema);
