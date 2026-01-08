const express = require('express');
const router = express.Router();
const { getHeatmapData } = require('../controllers/heatmapController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getHeatmapData);

module.exports = router;
