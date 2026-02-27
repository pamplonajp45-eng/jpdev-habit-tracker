// routes/sharedHabits.js
// Mount in your Express app as: app.use("/api/shared-habits", require("./routes/sharedHabits"));
// Requires mongoose models: SharedHabit (below) and your existing User model.

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { protect } = require("../middleware/authMiddleware"); // your existing JWT middleware
const User = require("../models/User"); // your existing User model
const HabitHistory = require("../models/HabitHistory");

// Helper to get local "today" in UTC (Adjusted for Asia/Manila)
const getLocalTodayUTC = () => {
  const now = new Date();
  const phTimeString = now.toLocaleString("en-US", { timeZone: "Asia/Manila" });
  const localNow = new Date(phTimeString);
  return new Date(Date.UTC(localNow.getFullYear(), localNow.getMonth(), localNow.getDate()));
};
const SharedHabit = require("../models/SharedHabit");

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
  const today = getLocalTodayUTC();
  const todayS = today.toISOString().slice(0, 10);
  let changed = false;
  habit.members.forEach((m) => {
    if (m.lastCompletedDate && m.lastCompletedDate !== todayS && m.completedToday) {
      m.completedToday = false;
      changed = true;
    }
  });
  return changed;
}

// ─────────────────────────────────────────────────
// GET /api/shared-habits  — list habits for current user (where status is accepted)
// ─────────────────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    const habits = await SharedHabit.find({
      members: {
        $elemMatch: {
          userId: req.user._id,
          status: "accepted"
        }
      }
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
// GET /api/shared-habits/invitations — list pending invitations
// ─────────────────────────────────────────────────
router.get("/invitations", protect, async (req, res) => {
  try {
    const invitations = await SharedHabit.find({
      members: {
        $elemMatch: {
          userId: req.user._id,
          status: "pending"
        }
      }
    });
    res.json(invitations);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────────
// POST /api/shared-habits  — create a new party habit
// Body: { name, emoji, invitedUsernames: string[] }
// ─────────────────────────────────────────────────
router.post("/", protect, async (req, res) => {
  const { name, emoji, category, frequency, invitedUsernames } = req.body;

  if (!name || !invitedUsernames?.length) {
    return res.status(400).json({ message: "Name and at least one invitee required." });
  }

  // Fetch the current user and their friends list
  const creator = await User.findById(req.user._id);

  // Look up invited users (case-insensitive)
  const invitedUsers = await User.find({
    username: {
      $in: invitedUsernames.map((u) => {
        const escaped = u.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`^${escaped}$`, "i");
      })
    },
  });

  const notFound = invitedUsernames.filter(
    (u) => !invitedUsers.find((iu) => iu.username.toLowerCase() === u.trim().toLowerCase())
  );
  if (notFound.length > 0) {
    return res.status(404).json({ message: `Users not found: ${notFound.join(", ")}` });
  }

  // 🛡️ Restriction: Check if all invited users are actually friends
  const friendIds = creator.friends.map(id => id.toString());
  const notFriends = invitedUsers.filter(u => !friendIds.includes(u._id.toString()));

  if (notFriends.length > 0) {
    return res.status(403).json({
      message: `You can only invite users from your friend list. Not friends: ${notFriends.map(u => u.username).join(", ")}`
    });
  }

  // Map members with appropriate statuses
  // Creator is "accepted", invitees are "pending"
  const members = [
    { userId: creator._id, username: creator.username, completedToday: false, status: "accepted" },
    ...invitedUsers.map((u) => ({
      userId: u._id,
      username: u.username,
      completedToday: false,
      status: "pending"
    })),
  ];

  const habit = new SharedHabit({
    name,
    emoji: emoji || "🤝",
    category: category || "general",
    frequency: frequency || "daily",
    createdBy: creator._id,
    members,
  });

  await habit.save();
  res.status(201).json(habit);
});

// ─────────────────────────────────────────────────
// POST /api/shared-habits/:id/toggle  — mark/unmark self complete
// ─────────────────────────────────────────────────
router.post("/:id/toggle", protect, async (req, res) => {
  try {
    const { note } = req.body;
    const habit = await SharedHabit.findById(req.params.id);
    if (!habit) return res.status(404).json({ message: "Not found" });

    const member = habit.members.find(
      (m) => m.userId.toString() === req.user._id.toString()
    );
    if (!member) return res.status(403).json({ message: "Not a member" });

    const today = getLocalTodayUTC();
    const todayS = today.toISOString().slice(0, 10);

    // Reset new-day stale completions first
    resetIfNewDay(habit);

    // Toggle
    member.completedToday = !member.completedToday;
    if (member.completedToday) {
      member.lastCompletedDate = todayS;
      member.note = note || "";

      // Add to HabitHistory for historical logging
      await HabitHistory.findOneAndUpdate(
        { userId: req.user._id, habitId: habit._id, date: today },
        {
          userId: req.user._id,
          habitId: habit._id,
          habitName: habit.name,
          habitType: "shared",
          date: today,
          status: "completed",
          note: note || ""
        },
        { upsert: true }
      );
    } else {
      member.note = ""; // Clear note when unchecking
      // Remove from HabitHistory
      await HabitHistory.deleteOne({
        userId: req.user._id,
        habitId: habit._id,
        date: today
      });
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

// PUT /api/shared-habits/:id/note
router.put("/:id/note", protect, async (req, res) => {
  try {
    const { note } = req.body;
    const habit = await SharedHabit.findById(req.params.id);
    if (!habit) return res.status(404).json({ message: "Not found" });
    const member = habit.members.find(m => m.userId.toString() === req.user._id.toString());
    if (!member) return res.status(403).json({ message: "Not a member" });
    if (!member.completedToday) return res.status(400).json({ message: "Complete habit first" });
    member.note = note || "";
    await habit.save();

    // Update history note too
    const today = getLocalTodayUTC();
    await HabitHistory.findOneAndUpdate(
      { userId: req.user._id, habitId: habit._id, date: today },
      { note: note || "" }
    );

    res.json(habit);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

// ─────────────────────────────────────────────────
// POST /api/shared-habits/:id/leave  — leave a party
// ─────────────────────────────────────────────────
router.post("/:id/leave", protect, async (req, res) => {
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
// PUT /api/shared-habits/:id  — creator updates name/emoji
// ─────────────────────────────────────────────────
router.put("/:id", protect, async (req, res) => {
  try {
    const { name, emoji } = req.body;
    const habit = await SharedHabit.findById(req.params.id);
    if (!habit) return res.status(404).json({ message: "Not found" });

    if (habit.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the creator can edit." });
    }

    const oldName = habit.name;
    if (name) habit.name = name;
    if (emoji) habit.emoji = emoji;

    await habit.save();

    // If name changed, update HabitHistory for this habitId
    if (name && name !== oldName) {
      await HabitHistory.updateMany(
        { habitId: habit._id },
        { habitName: name }
      );
    }

    res.json(habit);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────────
// DELETE /api/shared-habits/:id  — creator deletes
// ─────────────────────────────────────────────────
router.delete("/:id", protect, async (req, res) => {
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

// ─────────────────────────────────────────────────
// POST /api/shared-habits/:id/accept — accept an invitation
// ─────────────────────────────────────────────────
router.post("/:id/accept", protect, async (req, res) => {
  try {
    const habit = await SharedHabit.findById(req.params.id);
    if (!habit) return res.status(404).json({ message: "Not found" });

    const member = habit.members.find(
      (m) => m.userId.toString() === req.user._id.toString()
    );
    if (!member) return res.status(403).json({ message: "Not invited" });

    member.status = "accepted";
    await habit.save();
    res.json(habit);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────────
// POST /api/shared-habits/:id/reject — reject an invitation
// ─────────────────────────────────────────────────
router.post("/:id/reject", protect, async (req, res) => {
  try {
    const habit = await SharedHabit.findById(req.params.id);
    if (!habit) return res.status(404).json({ message: "Not found" });

    habit.members = habit.members.filter(
      (m) => m.userId.toString() !== req.user._id.toString()
    );

    // If no members left (including accepted ones), delete
    if (habit.members.length === 0) {
      await SharedHabit.deleteOne({ _id: habit._id });
      return res.json({ message: "Invitation rejected and party disbanded." });
    }

    await habit.save();
    res.json({ message: "Invitation rejected." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
