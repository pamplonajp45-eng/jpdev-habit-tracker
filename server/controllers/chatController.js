const Message = require('../models/Message');
const User = require('../models/User');

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

        const message = await Message.create({
            sender: req.user._id,
            recipient: recipientId,
            text
        });

        // Emit real-time message via Socket.io
        const io = req.app.get('io');
        io.to(recipientId).emit('newMessage', {
            id: message._id,
            sender: message.sender,
            text: message.text,
            time: new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        });

        res.status(201).json(message);
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

        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    sendMessage,
    getChatHistory
};
