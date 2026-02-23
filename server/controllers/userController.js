const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');

// @desc    Search all users
// @route   GET /api/users/search
// @access  Private
const searchUsers = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.json([]);
        }

        const users = await User.find({
            username: { $regex: query, $options: 'i' },
            _id: { $ne: req.user._id }
        }).select('username level xp friends isOnline lastSeen');

        // Enhance results with friendship status
        const enhancedUsers = await Promise.all(users.map(async (user) => {
            const isFriend = req.user.friends.includes(user._id);

            let requestStatus = null;
            if (!isFriend) {
                const pendingRequest = await FriendRequest.findOne({
                    $or: [
                        { sender: req.user._id, recipient: user._id, status: 'pending' },
                        { sender: user._id, recipient: req.user._id, status: 'pending' }
                    ]
                });
                if (pendingRequest) {
                    requestStatus = pendingRequest.sender.toString() === req.user._id.toString() ? 'sent' : 'received';
                }
            }

            return {
                _id: user._id,
                username: user.username,
                level: user.level,
                xp: user.xp,
                isOnline: user.isOnline,
                lastSeen: user.lastSeen,
                isFriend,
                requestStatus
            };
        }));

        res.json(enhancedUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { timezone } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { timezone },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    searchUsers,
    updateProfile
};
