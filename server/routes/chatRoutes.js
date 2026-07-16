const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  sendMessage,
  getChatHistory,
  setTypingStatus,
  getTypingStatus,
} = require("../controllers/chatController");

router.post("/send", protect, sendMessage);
router.get("/history/:userId", protect, getChatHistory);
router.post("/typing", protect, setTypingStatus);
router.get("/typing/:userId", protect, getTypingStatus);

module.exports = router;
