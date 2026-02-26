// routes/sharedHabits.js
// Mount in your Express app as: app.use("/api/shared-habits", require("./routes/sharedHabits"));
// Requires mongoose models: SharedHabit (below) and your existing User model.

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/auth"); // your existing JWT middleware
const User = require("../models/User"); // your existing User model

// ─────────────────────────────────────────────────
// Mongoose Schema  (put in models/SharedHabit.js)
// ─────────────────────────────────────────────────
const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  completedToday: { type: Boolean, default: false },
  lastCompletedDate: { type: String, default: "" }, // "YYYY-MM-DD"
});

const sharedHabitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  emoji: { type: String, default: "🤝" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [memberSchema],
  streak: { type: Number, default: 0 },
  lastTeamCompletedDate: { type: String, default: "" }, // "YYYY-MM-DD"
  createdAt: { type: Date, default: Date.now },
});

const SharedHabit =
  mongoose.models.SharedHabit || mongoose.model("SharedHabit", sharedHabitSchema);

// ─────────────────────────────────────────────────
// Helper: today's date string
// ─────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────
// Helper: reset completedToday if it's a new day
// ─────────────────────────────────────────────────
function resetIfNewDay(habit) {
  const today = todayStr();
  let changed = false;
  habit.members.forEach((m) => {
    if (m.lastCompletedDate && m.lastCompletedDate !== today && m.completedToday) {
      m.completedToday = false;
      changed = true;
    }
  });
  return changed;
}

// ─────────────────────────────────────────────────
// GET /api/shared-habits  — list habits for current user
// ─────────────────────────────────────────────────
router.get("/", authMiddleware, async (req, res) => {
  try {
    const habits = await SharedHabit.find({
      "members.userId": req.user._id,
    });

    // Reset stale completions (new day)
    const saves = [];
    for (const h of habits) {
      if (resetIfNewDay(h)) saves.push(h.save());
    }
    await Promise.all(saves);

    res.json(habits);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────────
// POST /api/shared-habits  — create a new party habit
// Body: { name, emoji, invitedUsernames: string[] }
// ─────────────────────────────────────────────────
router.post("/", authMiddleware, async (req, res) => {
  const { name, emoji, invitedUsernames } = req.body;

  if (!name || !invitedUsernames?.length) {
    return res.status(400).json({ message: "Name and at least one invitee required." });
  }

  // Look up invited users
  const invitedUsers = await User.find({
    username: { $in: invitedUsernames.map((u) => u.toLowerCase()) },
  });

  const notFound = invitedUsernames.filter(
    (u) => !invitedUsers.find((iu) => iu.username.toLowerCase() === u.toLowerCase())
  );
  if (notFound.length > 0) {
    return res.status(404).json({ message: `Users not found: ${notFound.join(", ")}` });
  }

  const creator = await User.findById(req.user._id);

  const members = [
    { userId: creator._id, username: creator.username, completedToday: false },
    ...invitedUsers.map((u) => ({ userId: u._id, username: u.username, completedToday: false })),
  ];

  const habit = new SharedHabit({
    name,
    emoji: emoji || "🤝",
    createdBy: creator._id,
    members,
  });

  await habit.save();
  res.status(201).json(habit);
});

// ─────────────────────────────────────────────────
// POST /api/shared-habits/:id/toggle  — mark/unmark self complete
// ─────────────────────────────────────────────────
router.post("/:id/toggle", authMiddleware, async (req, res) => {
  try {
    const habit = await SharedHabit.findById(req.params.id);
    if (!habit) return res.status(404).json({ message: "Not found" });

    const member = habit.members.find(
      (m) => m.userId.toString() === req.user._id.toString()
    );
    if (!member) return res.status(403).json({ message: "Not a member" });

    const today = todayStr();

    // Reset new-day stale completions first
    resetIfNewDay(habit);

    // Toggle
    member.completedToday = !member.completedToday;
    if (member.completedToday) {
      member.lastCompletedDate = today;
    }

    // Check if whole team is done → update streak
    const allDone = habit.members.every((m) => m.completedToday);
    if (allDone && habit.lastTeamCompletedDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().slice(0, 10);

      if (habit.lastTeamCompletedDate === yStr) {
        habit.streak += 1;
      } else {
        habit.streak = 1;
      }
      habit.lastTeamCompletedDate = today;
    }

    await habit.save();
    res.json(habit);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────────
// POST /api/shared-habits/:id/leave  — leave a party
// ─────────────────────────────────────────────────
router.post("/:id/leave", authMiddleware, async (req, res) => {
  try {
    const habit = await SharedHabit.findById(req.params.id);
    if (!habit) return res.status(404).json({ message: "Not found" });

    habit.members = habit.members.filter(
      (m) => m.userId.toString() !== req.user._id.toString()
    );

    // If no members left, delete the habit entirely
    if (habit.members.length === 0) {
      await SharedHabit.deleteOne({ _id: habit._id });
      return res.json({ message: "Party disbanded — no members left." });
    }

    await habit.save();
    res.json({ message: "Left party successfully." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────────
// DELETE /api/shared-habits/:id  — creator deletes
// ─────────────────────────────────────────────────
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const habit = await SharedHabit.findById(req.params.id);
    if (!habit) return res.status(404).json({ message: "Not found" });
    if (habit.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the creator can delete." });
    }
    await SharedHabit.deleteOne({ _id: habit._id });
    res.json({ message: "Deleted." });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
