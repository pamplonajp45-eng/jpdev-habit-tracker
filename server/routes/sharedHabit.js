// routes/sharedHabits.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");
const HabitHistory = require("../models/HabitHistory");
const SharedHabit = require("../models/SharedHabit");

const getLocalTodayUTC = () => {
    const now = new Date();
    const phTimeString = now.toLocaleString("en-US", { timeZone: "Asia/Manila" });
    const localNow = new Date(phTimeString);
    return new Date(Date.UTC(localNow.getFullYear(), localNow.getMonth(), localNow.getDate()));
};

function getTodayStr() {
    const now = new Date();
    const phTimeString = now.toLocaleString("en-US", { timeZone: "Asia/Manila" });
    const localNow = new Date(phTimeString);
    const y = localNow.getFullYear();
    const m = String(localNow.getMonth() + 1).padStart(2, "0");
    const d = String(localNow.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function getYesterdayStr() {
    const now = new Date();
    const phTimeString = now.toLocaleString("en-US", { timeZone: "Asia/Manila" });
    const localNow = new Date(phTimeString);
    localNow.setDate(localNow.getDate() - 1);
    const y = localNow.getFullYear();
    const m = String(localNow.getMonth() + 1).padStart(2, "0");
    const d = String(localNow.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function resetIfNewDay(habit) {
    const todayS = getTodayStr();
    let changed = false;
    habit.members.forEach((m) => {
        if (m.lastCompletedDate && m.lastCompletedDate !== todayS && m.completedToday) {
            m.completedToday = false;
            changed = true;
        }
    });
    return changed;
}

// GET /api/shared-habits
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

        const saves = [];
        for (const h of habits) {
            if (resetIfNewDay(h)) saves.push(h.save());
        }
        await Promise.all(saves);

        res.json(habits);
    } catch (err) {
        console.error("GET /shared-habits error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET /api/shared-habits/invitations
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
        console.error("GET /shared-habits/invitations error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// POST /api/shared-habits
router.post("/", protect, async (req, res) => {
    try {
        const { name, emoji, category, frequency, invitedUsernames } = req.body;

        if (!name || !invitedUsernames?.length) {
            return res.status(400).json({ message: "Name and at least one invitee required." });
        }

        const creator = await User.findById(req.user._id);

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

        const friendIds = creator.friends.map(id => id.toString());
        const notFriends = invitedUsers.filter(u => !friendIds.includes(u._id.toString()));

        if (notFriends.length > 0) {
            return res.status(403).json({
                message: `You can only invite users from your friend list. Not friends: ${notFriends.map(u => u.username).join(", ")}`
            });
        }

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
    } catch (err) {
        console.error("POST /shared-habits error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// POST /api/shared-habits/:id/toggle
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
        const todayS = getTodayStr();
        const yesterdayS = getYesterdayStr();

        resetIfNewDay(habit);

        member.completedToday = !member.completedToday;

        if (member.completedToday) {
            member.lastCompletedDate = todayS;
            member.note = note || "";

            // FIX: Check if HabitHistory model exists before using it
            // This is wrapped separately so a history error doesn't kill the whole toggle
            try {
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
            } catch (histErr) {
                console.error("HabitHistory upsert failed (non-fatal):", histErr.message);
            }
        } else {
            member.note = "";
            try {
                await HabitHistory.deleteOne({
                    userId: req.user._id,
                    habitId: habit._id,
                    date: today
                });
            } catch (histErr) {
                console.error("HabitHistory delete failed (non-fatal):", histErr.message);
            }
        }

        const acceptedMembers = habit.members.filter(m => m.status === "accepted");
        const allDone = acceptedMembers.length > 0 && acceptedMembers.every((m) => m.completedToday);
        if (allDone && habit.lastTeamCompletedDate !== todayS) {
            if (habit.lastTeamCompletedDate === yesterdayS) {
                habit.streak += 1;
            } else {
                habit.streak = 1;
            }
            habit.lastTeamCompletedDate = todayS;
        }

        await habit.save();
        res.json(habit);
    } catch (err) {
        // Now we can actually see what's crashing
        console.error("POST /shared-habits/:id/toggle error:", err);
        res.status(500).json({ message: "Server error", error: err.message, stack: err.stack });
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

        try {
            const today = getLocalTodayUTC();
            await HabitHistory.findOneAndUpdate(
                { userId: req.user._id, habitId: habit._id, date: today },
                { note: note || "" }
            );
        } catch (histErr) {
            console.error("HabitHistory note update failed (non-fatal):", histErr.message);
        }

        res.json(habit);
    } catch (err) {
        console.error("PUT /shared-habits/:id/note error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// POST /api/shared-habits/:id/leave
router.post("/:id/leave", protect, async (req, res) => {
    try {
        const habit = await SharedHabit.findById(req.params.id);
        if (!habit) return res.status(404).json({ message: "Not found" });

        habit.members = habit.members.filter(
            (m) => m.userId.toString() !== req.user._id.toString()
        );

        if (habit.members.length === 0) {
            await SharedHabit.deleteOne({ _id: habit._id });
            return res.json({ message: "Party disbanded — no members left." });
        }

        await habit.save();
        res.json({ message: "Left party successfully." });
    } catch (err) {
        console.error("POST /shared-habits/:id/leave error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// PUT /api/shared-habits/:id
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

        if (name && name !== oldName) {
            try {
                await HabitHistory.updateMany({ habitId: habit._id }, { habitName: name });
            } catch (histErr) {
                console.error("HabitHistory name update failed (non-fatal):", histErr.message);
            }
        }

        res.json(habit);
    } catch (err) {
        console.error("PUT /shared-habits/:id error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// DELETE /api/shared-habits/:id
router.delete("/:id", protect, async (req, res) => {
    try {
        const habit = await SharedHabit.findById(req.params.id);
        if (!habit) return res.status(404).json({ message: "Not found" });
        if (habit.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Only the creator can delete." });
        }
        await SharedHabit.deleteOne({ _id: habit._id });
        res.json({ message: "Deleted." });
    } catch (err) {
        console.error("DELETE /shared-habits/:id error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// POST /api/shared-habits/:id/accept
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
        console.error("POST /shared-habits/:id/accept error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// POST /api/shared-habits/:id/reject
router.post("/:id/reject", protect, async (req, res) => {
    try {
        const habit = await SharedHabit.findById(req.params.id);
        if (!habit) return res.status(404).json({ message: "Not found" });

        habit.members = habit.members.filter(
            (m) => m.userId.toString() !== req.user._id.toString()
        );

        if (habit.members.length === 0) {
            await SharedHabit.deleteOne({ _id: habit._id });
            return res.json({ message: "Invitation rejected and party disbanded." });
        }

        await habit.save();
        res.json({ message: "Invitation rejected." });
    } catch (err) {
        console.error("POST /shared-habits/:id/reject error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

module.exports = router;