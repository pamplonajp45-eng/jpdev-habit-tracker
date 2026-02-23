const Habit = require("../models/Habit");
const HabitHistory = require("../models/HabitHistory");
const Goal = require("../models/Goal");
const User = require("../models/User"); // Import Goal model
const { checkStreakBadges } = require("../utils/badges");
const { isHabitDue, getPreviousDueDate } = require("../utils/habitUtils");

exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    // Check completion status for today for each habit
    const now = new Date();
    const today = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
    );
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Strict Streak Validation: Reset streak if broken (missed yesterday)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    for (const habit of habits) {
      if (habit.streak > 0) {
        const lastCompleted = habit.lastCompletedDate
          ? new Date(habit.lastCompletedDate)
          : null;
        const prevDueDate = getPreviousDueDate(habit, today);

        // If lastCompleted is older than the previous due date, streak is broken
        if (!lastCompleted || lastCompleted < prevDueDate) {
          habit.streak = 0;
          await habit.save();
        }
      }
    }

    const historyToday = await HabitHistory.find({
      userId: req.user.id,
      date: { $gte: today, $lt: tomorrow },
      status: "completed",
    });

    const completedHabitIds = new Set(
      historyToday.map((h) => h.habitId.toString()),
    );

    const habitsWithStatus = habits.map((habit) => ({
      ...habit.toObject(),
      completedToday: completedHabitIds.has(habit._id.toString()),
      isDueToday: isHabitDue(habit, today),
    }));

    res.json(habitsWithStatus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a habit
// @route   POST /api/habits
// @access  Private
exports.createHabit = async (req, res) => {
  try {
    const { name, frequencyType, frequencyData, reminderTime } = req.body;

    const habit = await Habit.create({
      userId: req.user.id,
      name,
      frequencyType,
      frequencyData,
      reminderTime
    });

    res.status(201).json(habit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update a habit
// @route   PUT /api/habits/:id
// @access  Private
exports.updateHabit = async (req, res) => {
  try {
    let habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    if (habit.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    habit = await Habit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(habit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a habit
// @route   DELETE /api/habits/:id
// @access  Private
exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    if (habit.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await habit.deleteOne(); // Triggers middleware if we added any, but here just robust delete
    await HabitHistory.deleteMany({ habitId: req.params.id }); // Clean up history

    res.json({ message: "Habit removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
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
    if (!habit) return res.status(404).json({ message: "Habit not found" });
    if (habit.userId.toString() !== userId)
      return res.status(401).json({ message: "Not authorized" });

    const now = new Date();
    const today = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
    );

    const historyEntry = await HabitHistory.findOne({
      userId,
      habitId,
      date: today,
    });

    if (historyEntry) {
      await HabitHistory.findByIdAndDelete(historyEntry._id);
      const streak = await calculateStreak(userId, habitId);
      habit.streak = streak;

      const lastHistory = await HabitHistory.findOne({ userId, habitId }).sort({
        date: -1,
      });
      habit.lastCompletedDate = lastHistory ? lastHistory.date : null;

      await habit.save();

      await updateLinkedGoals(userId, habitId, habit);

      const user = await User.findById(userId);
      return res.json({ message: "Habit unchecked", habit, user: { xp: user.xp, level: user.level, badges: user.badges } });

    }
    // Check: Add history and update streak
    await HabitHistory.create({
      userId,
      habitId,
      date: today,
      status: "completed",
    });

    // Check if completed on the previous due date to continue streak
    const prevDueDate = getPreviousDueDate(habit, today);

    const completedPrev = await HabitHistory.findOne({
      userId,
      habitId,
      date: prevDueDate,
    });

    if (completedPrev) {
      habit.streak += 1;
    } else {
      habit.streak = 1; // Start/Reset streak
    }

    habit.lastCompletedDate = today;
    await habit.save();

    const user = await User.findById(userId);
    if (user) {

      const habits = await Habit.find({ userId });
      const maxStreak = Math.max(...habits.map(h => h.streak), habit.streak);
      await checkStreakBadges(user, maxStreak);

      const xpGain = (user.xpGain = 10);
      user.xp += xpGain;

      const xpNeeded = user.level * 100;
      if (user.xp >= xpNeeded) {
        user.level += 1;
        user.xp = 0;
      }
      await user.save();
    }


    // UPDATE GOALS
    await updateLinkedGoals(userId, habitId, habit);

    const updatedUser = await User.findById(userId);
    return res.json({
      message: "Habit checked",
      habit,
      user: {
        xp: updatedUser.xp,
        level: updatedUser.level,
        badges: updatedUser.badges
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper to calculate streak (Counting backwards)
const calculateStreak = async (userId, habitId) => {
  let streak = 0;
  const now = new Date();
  let currentDate = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
  // Move to yesterday since we just unchecked today
  currentDate.setDate(currentDate.getDate() - 1);

  while (true) {
    const entry = await HabitHistory.findOne({
      userId,
      habitId,
      date: currentDate,
    });
    if (entry && entry.status === "completed") {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

const updateLinkedGoals = async (userId, habitId, habit) => {
  try {
    const goals = await Goal.find({
      userId,
      linkedHabitId: habitId,
      status: "active",
    });

    for (const goal of goals) {
      let updated = false;
      const prevStatus = goal.status;

      // 1. Streak Goals
      if (goal.type === "streak") {
        if (goal.currentValue !== habit.streak) {
          goal.currentValue = habit.streak;
          updated = true;
        }
      }

      // 2. Count Goals (Total or Deadline)
      else if (goal.type === "total_count" || goal.type === "deadline_count") {
        // Need to count total history
        // Optimization: could store a counter in Habit, but for now cache query
        const totalCount = await HabitHistory.countDocuments({
          userId,
          habitId,
          status: "completed",
        });

        if (goal.currentValue !== totalCount) {
          goal.currentValue = totalCount;
          updated = true;
        }
      }

      if (goal.currentValue >= goal.targetValue) {
        if (goal.deadline && new Date() > goal.deadline) {
          goal.status = "failed";
        } else {
          goal.status = "completed";
          goal.completedAt = Date.now();
        }
        updated = true;
      }

      if (updated) {
        await goal.save();

        // If goal just became completed, award XP reward
        if (prevStatus === "active" && goal.status === "completed" && goal.xpReward) {
          await addXpToUser(userId, goal.xpReward);
        }
      }
    }
  } catch (err) {
    console.error("Error updating goals:", err);
  }
};

// Helper: Award XP to user and handle level up
const addXpToUser = async (userId, amount) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    user.xp += amount;
    const xpNeeded = user.level * 100;

    if (user.xp >= xpNeeded) {
      user.level += 1;
      user.xp = user.xp - xpNeeded; // Carry over surplus XP
    }

    await user.save();
  } catch (err) {
    console.error("Error adding XP to user:", err);
  }
};


