const User = require('../models/User');
const Habit = require('../models/Habit');
const HabitHistory = require('../models/HabitHistory');

// @desc    Get global leaderboard
// @route   GET /api/leaderboard
// @access  Private
exports.getLeaderboard = async (req, res) => {
    try {
        // Aggregate max streak per user
        const leaderboard = await Habit.aggregate([
            {
                $group: {
                    _id: "$userId",
                    maxStreak: { $max: "$streak" }
                }
            },
            { $sort: { maxStreak: -1 } },
            { $limit: 50 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    username: "$user.username",
                    maxStreak: 1,
                    _id: 0
                }
            }
        ]);

        res.json(leaderboard);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
