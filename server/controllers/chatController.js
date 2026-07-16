const Message = require("../models/Message");
const User = require("../models/User");
const TypingStatus = require("../models/TypingStatus");
const { encrypt, decrypt } = require("../utils/encryption");
const { sendNotification } = require("./notificationController");

// @desc    Send a message
// @route   POST /api/chat/send
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { recipientId, text } = req.body;

    // Check if they are friends
    const sender = await User.findById(req.user._id);
    if (!sender.friends.includes(recipientId)) {
      return res.status(403).json({ message: "You can only message friends" });
    }

    // ENCRYPT before saving
    const encryptedText = encrypt(text);

    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      text: encryptedText,
    });

    // Emit real-time message via Socket.io (DECRYPTED for the recipient)
    const io = req.app.get("io");
    console.log(
      `[Chat] Emitting newMessage from ${req.user._id} to recipient: ${recipientId}`,
    );

    io.to(recipientId).emit("newMessage", {
      id: message._id,
      sender: message.sender,
      text: text, // Send original text to socket for instant delivery
      time: new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    // Always trigger Push Notification.
    // If they are online but backgrounded, they still need the Web Push.
    console.log(`[Push] Triggering push for recipient: ${recipientId}`);
    sendNotification(recipientId, {
      title: `New message from ${sender.username}`,
      body: text.length > 50 ? text.substring(0, 47) + "..." : text,
      icon: "/HABBITLOGO.png",
      tag: "chat-message",
      data: {
        senderId: sender._id,
        url: "/chat", // Link to chat view
      },
    });

    res.status(201).json({
      ...message._doc,
      text,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get chat history with a specific user
// @route   GET /api/chat/history/:userId
// @access  Private
const getChatHistory = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user._id },
      ],
    }).sort({ createdAt: 1 });

    const decryptedMessages = messages.map((m) => {
      let text = m.text;
      // Support legacy encrypted messages
      if (typeof text === "string" && text.includes(":")) {
        const decrypted = decrypt(text);
        if (decrypted !== "[Encrypted Message]") text = decrypted;
      }
      return {
        ...m._doc,
        text,
        time: new Date(m.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    });

    res.json(decryptedMessages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Set typing status (for polling fallback in production)
// @route   POST /api/chat/typing
// @access  Private
const setTypingStatus = async (req, res) => {
  try {
    const { recipientId, isTyping } = req.body;

    // Store typing status in DB (auto-expires after 30s via TTL)
    await TypingStatus.findOneAndUpdate(
      {
        userId: req.user._id,
        conversationWith: recipientId,
      },
      {
        userId: req.user._id,
        conversationWith: recipientId,
        isTyping: isTyping,
        updatedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    // If we have an active socket connection, also emit via WebSocket
    const io = req.app.get("io");
    if (io) {
      io.to(recipientId).emit("typing", {
        userId: req.user._id,
        isTyping: isTyping,
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get typing status for a user
// @route   GET /api/chat/typing/:userId
// @access  Private
const getTypingStatus = async (req, res) => {
  try {
    // Check if the other user is typing in conversation with current user
    const typingStatus = await TypingStatus.findOne({
      userId: req.params.userId,
      conversationWith: req.user._id,
    });

    res.json({ isTyping: typingStatus ? typingStatus.isTyping : false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
  setTypingStatus,
  getTypingStatus,
};
