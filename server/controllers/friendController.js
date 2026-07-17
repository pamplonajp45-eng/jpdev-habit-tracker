const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");

// @desc    Send a friend request
// @route   POST /api/friends/request/:username
// @access  Private
const sendFriendRequest = async (req, res) => {
  try {
    const recipient = await User.findOne({ username: req.params.username })
      .select("_id username")
      .lean();
    if (!recipient) {
      return res.status(404).json({ message: "User not found" });
    }

    if (recipient._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot add yourself" });
    }

    // Check if already friends
    if (req.user.friends.includes(recipient._id)) {
      return res.status(400).json({ message: "Already friends" });
    }

    // Check if there's a pending request
    const existingRequest = await FriendRequest.findOne({
      sender: req.user._id,
      recipient: recipient._id,
      status: "pending",
    }).lean();

    if (existingRequest) {
      return res.status(400).json({ message: "Request already sent" });
    }

    const friendRequest = await FriendRequest.create({
      sender: req.user._id,
      recipient: recipient._id,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get pending requests
// @route   GET /api/friends/requests
// @access  Private
const getPendingRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      recipient: req.user._id,
      status: "pending",
    })
      .populate("sender", "username level xp")
      .lean();
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Accept friend request
// @route   PUT /api/friends/accept/:requestId
// @access  Private
const acceptFriendRequest = async (req, res) => {
  try {
    const friendRequest = await FriendRequest.findById(req.params.requestId);
    if (
      !friendRequest ||
      friendRequest.recipient.toString() !== req.user._id.toString()
    ) {
      return res.status(404).json({ message: "Request not found" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    // Add to both users' friends list
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });
    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.json({ message: "Friend request accepted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Reject friend request
// @route   PUT /api/friends/reject/:requestId
// @access  Private
const rejectFriendRequest = async (req, res) => {
  try {
    const friendRequest = await FriendRequest.findById(req.params.requestId);
    if (
      !friendRequest ||
      friendRequest.recipient.toString() !== req.user._id.toString()
    ) {
      return res.status(404).json({ message: "Request not found" });
    }

    friendRequest.status = "rejected";
    await friendRequest.save();

    res.json({ message: "Friend request rejected" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get friends list
// @route   GET /api/friends
// @access  Private
const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("friends", "username level xp isOnline lastSeen")
      .lean();
    res.json(user.friends);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Heartbeat - update online status and get latest friend statuses
// @route   POST /api/friends/heartbeat
// @access  Private
const heartbeat = async (req, res) => {
  try {
    // Update current user's online status
    await User.findByIdAndUpdate(req.user._id, {
      lastSeen: Date.now(),
      isOnline: true,
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get friend statuses (polling fallback)
// @route   GET /api/friends/status
// @access  Private
const getFriendStatuses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("friends", "_id isOnline lastSeen")
      .lean();
    const statuses = {};
    user.friends.forEach((friend) => {
      statuses[friend._id] = {
        isOnline: friend.isOnline,
        lastSeen: friend.lastSeen,
      };
    });
    res.json(statuses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  sendFriendRequest,
  getPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  heartbeat,
  getFriendStatuses,
};
