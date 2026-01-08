const HabitHistory = require('../models/HabitHistory');
const Habit = require('../models/Habit');

const mongoose = require('mongoose');

// @desc    Get heatmap data
// @route   GET /api/heatmap
// @access  Private
exports.getHeatmapData = async (req, res) => {
    try {
        const userId = req.user.id;
        // User could pass year, default to all time or handle in frontend

        // Aggregate completions by date
        const heatmapData = await HabitHistory.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    completed: { $sum: 1 }
                }
            }
        ]);

        // Get total number of active habits to calculate percentage roughly
        const totalHabits = await Habit.countDocuments({ userId });

        const formattedData = heatmapData.map(item => ({
            date: item._id, // Format: "YYYY-MM-DD"
            completed: item.completed,
            total: totalHabits > 0 ? totalHabits : 1 // Avoid division by zero, approximation
        }));

        res.json(formattedData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
