const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// @desc    Check API Health and DB connection
// @route   GET /api/health
// @access  Public
router.get('/', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStateMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        dbState: dbState,
        dbStateString: dbStateMap[dbState] || 'unknown'
    });
});

module.exports = router;
