const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  sendFriendRequest,
  getPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  heartbeat,
  getFriendStatuses,
} = require("../controllers/friendController");

router.post("/request/:username", protect, sendFriendRequest);
router.get("/requests", protect, getPendingRequests);
router.put("/accept/:requestId", protect, acceptFriendRequest);
router.put("/reject/:requestId", protect, rejectFriendRequest);
router.get("/", protect, getFriends);
router.post("/heartbeat", protect, heartbeat);
router.get("/status", protect, getFriendStatuses);

module.exports = router;
