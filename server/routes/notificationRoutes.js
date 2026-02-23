const express = require('express');
const router = express.Router();
const { subscribe, unsubscribe, remindHabits } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/subscribe', protect, subscribe);
router.post('/unsubscribe', protect, unsubscribe);
router.get('/remind-habits', remindHabits);

module.exports = router;
