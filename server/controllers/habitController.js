const Habit = require('../models/Habit');
const HabitHistory = require('../models/HabitHistory');

// @desc    Get all habits
// @route   GET /api/habits
// @access  Private
exports.getHabits = async (req, res) => {
    try {
        const habits = await Habit.find({ userId: req.user.id }).sort({ createdAt: -1 });

        // Check completion status for today for each habit
        const now = new Date();
        const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const historyToday = await HabitHistory.find({
            userId: req.user.id,
            date: { $gte: today, $lt: tomorrow },
            status: 'completed'
        });

        const completedHabitIds = new Set(historyToday.map(h => h.habitId.toString()));

        const habitsWithStatus = habits.map(habit => ({
            ...habit.toObject(),
            completedToday: completedHabitIds.has(habit._id.toString())
        }));

        res.json(habitsWithStatus);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a habit
// @route   POST /api/habits
// @access  Private
exports.createHabit = async (req, res) => {
    try {
        const { name, goal, schedule } = req.body;

        const habit = await Habit.create({
            userId: req.user.id,
            name,
            goal,
            schedule
        });

        res.status(201).json(habit);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update a habit
// @route   PUT /api/habits/:id
// @access  Private
exports.updateHabit = async (req, res) => {
    try {
        let habit = await Habit.findById(req.params.id);

        if (!habit) {
            return res.status(404).json({ message: 'Habit not found' });
        }

        if (habit.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        habit = await Habit.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(habit);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a habit
// @route   DELETE /api/habits/:id
// @access  Private
exports.deleteHabit = async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);

        if (!habit) {
            return res.status(404).json({ message: 'Habit not found' });
        }

        if (habit.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await habit.deleteOne(); // Triggers middleware if we added any, but here just robust delete
        await HabitHistory.deleteMany({ habitId: req.params.id }); // Clean up history

        res.json({ message: 'Habit removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


// @desc    Toggle habit completion for today
// @route   POST /api/habits/:id/toggle
// @access  Private
exports.toggleHabitCompletion = async (req, res) => {
    try {
        const habitId = req.params.id;
        const userId = req.user.id;

        const habit = await Habit.findById(habitId);
        if (!habit) return res.status(404).json({ message: 'Habit not found' });
        if (habit.userId.toString() !== userId) return res.status(401).json({ message: 'Not authorized' });

        const now = new Date();
        const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

        // Check availability
        const historyEntry = await HabitHistory.findOne({
            userId,
            habitId,
            date: today
        });

        if (historyEntry) {
            // Uncheck: Remove history and recalculate streak
            await HabitHistory.findByIdAndDelete(historyEntry._id);

            // Recalculate streak (expensive but correct)
            // Or just decrement if we track previous state? 
            // Let's recalculate streak by counting contiguous previous days
            const streak = await calculateStreak(userId, habitId);
            habit.streak = streak;

            // Find last completed date
            // This is complex. If we remove today, last completed might be yesterday.
            // Simplified:
            const lastHistory = await HabitHistory.findOne({ userId, habitId }).sort({ date: -1 });
            habit.lastCompletedDate = lastHistory ? lastHistory.date : null;

            await habit.save();
            return res.json({ message: 'Habit unchecked', habit });

        } else {
            // Check: Add history and update streak
            await HabitHistory.create({
                userId,
                habitId,
                date: today,
                status: 'completed'
            });

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            // Check if completed yesterday
            const completedYesterday = await HabitHistory.findOne({
                userId,
                habitId,
                date: yesterday
            });

            if (completedYesterday) {
                habit.streak += 1;
            } else {
                habit.streak = 1; // Reset or start new
            }

            habit.lastCompletedDate = today;
            await habit.save();
            return res.json({ message: 'Habit checked', habit });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


// Helper to calculate streak (Counting backwards)
const calculateStreak = async (userId, habitId) => {
    let streak = 0;
    const now = new Date();
    let currentDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    // Move to yesterday since we just unchecked today
    currentDate.setDate(currentDate.getDate() - 1);

    while (true) {
        const entry = await HabitHistory.findOne({
            userId,
            habitId,
            date: currentDate
        });
        if (entry && entry.status === 'completed') {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
};
