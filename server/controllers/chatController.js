const Message = require('../models/Message');
const User = require('../models/User');
const { encrypt, decrypt } = require('../utils/encryption');

// @desc    Send a message
// @route   POST /api/chat/send
// @access  Private
const sendMessage = async (req, res) => {
    try {
        const { recipientId, text } = req.body;

        // Check if they are friends
        const sender = await User.findById(req.user._id);
        if (!sender.friends.includes(recipientId)) {
            return res.status(403).json({ message: 'You can only message friends' });
        }

        // ENCRYPT before saving
        const encryptedText = encrypt(text);

        const message = await Message.create({
            sender: req.user._id,
            recipient: recipientId,
            text: encryptedText
        });

        // Emit real-time message via Socket.io (DECRYPTED for the recipient)
        const io = req.app.get('io');
        io.to(recipientId).emit('newMessage', {
            id: message._id,
            sender: message.sender,
            text: text, // Send original text to socket for instant delivery
            time: new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        });

        res.status(201).json({
            ...message._doc,
            text: text // Return decrypted to sender
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
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
                { sender: req.params.userId, recipient: req.user._id }
            ]
        }).sort({ createdAt: 1 });

        // DECRYPT each message
        const decryptedMessages = messages.map(m => ({
            ...m._doc,
            text: decrypt(m.text),
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }));

        res.json(decryptedMessages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    sendMessage,
    getChatHistory
};
