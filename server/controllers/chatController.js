const Message = require("../models/Message");
const User = require("../models/User");
const TypingStatus = require("../models/TypingStatus");
const { encrypt, decrypt } = require("../utils/encryption");
const { sendNotification } = require("./notificationController");

// Default page size for messages
const MESSAGES_PER_PAGE = 50;

// @desc    Send a message
// @route   POST /api/chat/send
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { recipientId, text } = req.body;

    // Quick friend check using lean
    const sender = await User.findById(req.user._id)
      .select("username friends")
      .lean();
    if (
      !sender.friends ||
      !sender.friends.some((f) => f.toString() === recipientId)
    ) {
      return res.status(403).json({ message: "You can only message friends" });
    }

    const encryptedText = encrypt(text);

    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      text: encryptedText,
    });

    // Emit real-time message via Socket.io
    const io = req.app.get("io");
    if (io) {
      io.to(recipientId).emit("newMessage", {
        id: message._id,
        sender: message.sender,
        text: text,
        time: new Date(message.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: message.createdAt,
      });
    }

    // Trigger push notification (async, don't await)
    sendNotification(recipientId, {
      title: `New message from ${sender.username}`,
      body: text.length > 50 ? text.substring(0, 47) + "..." : text,
      icon: "/HABBITLOGO.png",
      tag: "chat-message",
      data: {
        senderId: sender._id,
        url: "/chat",
      },
    }).catch((err) => console.error("[Push] Error:", err));

    res.status(201).json({
      _id: message._id,
      sender: message.sender,
      recipient: message.recipient,
      text,
      read: false,
      createdAt: message.createdAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get chat history with a specific user (with pagination + cursor-based)
// @route   GET /api/chat/history/:userId
// @query   ?before=<cursor_id>&limit=50
// @access  Private
const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { before, limit } = req.query;
    const pageSize = Math.min(parseInt(limit) || MESSAGES_PER_PAGE, 100);

    const query = {
      $or: [
        { sender: req.user._id, recipient: userId },
        { sender: userId, recipient: req.user._id },
      ],
    };

    // Cursor-based pagination: fetch messages before this ID
    if (before) {
      const beforeMsg = await Message.findById(before)
        .select("createdAt")
        .lean();
      if (beforeMsg) {
        query.createdAt = { $lt: beforeMsg.createdAt };
      }
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(pageSize + 1) // Fetch one extra to check for more
      .select("sender recipient text read createdAt")
      .lean();

    const hasMore = messages.length > pageSize;
    if (hasMore) messages.pop();

    const decryptedMessages = messages.reverse().map((m) => {
      let text = m.text;
      if (typeof text === "string" && text.includes(":")) {
        const decrypted = decrypt(text);
        if (decrypted !== "[Encrypted Message]") text = decrypted;
      }
      return {
        _id: m._id,
        sender: m.sender,
        text,
        read: m.read || false,
        createdAt: m.createdAt,
        time: new Date(m.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    });

    res.json({
      messages: decryptedMessages,
      hasMore,
      nextCursor:
        hasMore && decryptedMessages.length > 0
          ? decryptedMessages[0]._id
          : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Set typing status
// @route   POST /api/chat/typing
// @access  Private
const setTypingStatus = async (req, res) => {
  try {
    const { recipientId, isTyping } = req.body;

    // Only write to DB every 2s to reduce writes (debounce via client)
    await TypingStatus.findOneAndUpdate(
      {
        userId: req.user._id,
        conversationWith: recipientId,
      },
      {
        userId: req.user._id,
        conversationWith: recipientId,
        isTyping,
        updatedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    // Emit via WebSocket for instant delivery
    const io = req.app.get("io");
    if (io) {
      io.to(recipientId).emit("typing", {
        userId: req.user._id,
        isTyping,
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get typing status
// @route   GET /api/chat/typing/:userId
// @access  Private
const getTypingStatus = async (req, res) => {
  try {
    const typingStatus = await TypingStatus.findOne({
      userId: req.params.userId,
      conversationWith: req.user._id,
    }).lean();

    res.json({ isTyping: typingStatus ? typingStatus.isTyping : false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chat/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { senderId } = req.body;

    const result = await Message.updateMany(
      {
        sender: senderId,
        recipient: req.user._id,
        read: false,
      },
      { $set: { read: true } },
    );

    // Notify sender their messages were read
    const io = req.app.get("io");
    if (io && result.modifiedCount > 0) {
      io.to(senderId).emit("messagesRead", {
        readerId: req.user._id,
        senderId,
      });
    }

    res.json({ success: true, modifiedCount: result.modifiedCount });
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
  markAsRead,
};
