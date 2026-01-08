const Goal = require('../models/Goal');
const Habit = require('../models/Habit');

// @desc    Get all goals
// @route   GET /api/goals
// @access  Private
exports.getGoals = async (req, res) => {
    try {
        const goals = await Goal.find({ userId: req.user.id }).populate('linkedHabitId', 'name');
        res.json(goals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a goal
// @route   POST /api/goals
// @access  Private
exports.createGoal = async (req, res) => {
    try {
        const { title, targetValue, linkedHabitId } = req.body;

        const goal = await Goal.create({
            userId: req.user.id,
            title,
            targetValue,
            linkedHabitId
        });

        res.status(201).json(goal);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a goal
// @route   PUT /api/goals/:id
// @access  Private
exports.updateGoal = async (req, res) => {
    try {
        let goal = await Goal.findById(req.params.id);

        if (!goal) return res.status(404).json({ message: 'Goal not found' });
        if (goal.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        goal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(goal);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a goal
// @route   DELETE /api/goals/:id
// @access  Private
exports.deleteGoal = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id);

        if (!goal) return res.status(404).json({ message: 'Goal not found' });
        if (goal.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        await goal.deleteOne();
        res.json({ message: 'Goal removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
