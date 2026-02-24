const STREAK_BADGES = [
    { id: "first_step", label: "First Day Yarn?! ", emoji: "🌱", requirement: 1 },
    { id: "three_day_spark", label: "3-Day Spark, Palo!", emoji: "🔥", requirement: 3 },
    { id: "seven_day", label: "7-Day Warrior, Lakas mo boii", emoji: "📅", requirement: 7 },
    { id: "thirty_day", label: "Look at that!, Taking like a Champ! 30-day streak", emoji: "👑", requirement: 30 },
    { id: "hundred_day", label: "100-Day Streak,Bossing, May bitaw kana!", emoji: "🐉", requirement: 100 },
];

const LEVEL_BADGES = [
    { id: "level-5", label: "Rising Seed", emoji: "🪴", requirement: 5 },
    { id: "level-10", label: "Flame Starter", emoji: "🎇", requirement: 10 },
    { id: "level-20", label: "Momentum Maker", emoji: "⚡", requirement: 20 },
    { id: "level-25", label: "Mayabang? Hindi. Resulta Lang 😤", emoji: "😤", requirement: 25 },
    { id: "level-30", label: "Respect the Grind 🎮", emoji: "🎮", requirement: 30 },
    { id: "level-35", label: "Built Different 🧱", emoji: "🧱", requirement: 35 },
    { id: "level-40", label: "Walang Patch Update sa Disiplina 💀", emoji: "💀", requirement: 40 },
    { id: "level-45", label: "Iba kana talaga! 🥇", emoji: "🥇", requirement: 45 },
    { id: "level-50", label: "Discipline Lord, Alamat!", emoji: "🏆", requirement: 50 },
    { id: "level-100", label: "HABITAW God Mode", emoji: "🌌", requirement: 100 },
];

const checkStreakBadges = async (user, currentStreak) => {
    // Ensure badges array exists
    if (!user.badges) user.badges = [];

    let updated = false;
    for (const badge of STREAK_BADGES) {
        // skip if already earned
        const alreadyEarned = user.badges.some(b => b.id === badge.id);
        if (alreadyEarned) continue;

        // award if streak hits the requirement
        if (currentStreak >= badge.requirement) {
            user.badges.push({ id: badge.id, earnedAt: new Date() });
            updated = true;
        }
    }
    return updated; // Return if any new badges were added
};

const checkLevelBadges = async (user) => {
    if (!user.badges) user.badges = [];

    let updated = false;
    for (const badge of LEVEL_BADGES) {
        // skip if already earned
        const alreadyEarned = user.badges.some(b => b.id === badge.id);
        if (alreadyEarned) continue;

        // award if level hits the requirement
        if (user.level >= badge.requirement) {
            user.badges.push({ id: badge.id, earnedAt: new Date() });
            updated = true;
        }
    }
    return updated;
};

const syncUserBadges = async (user) => {
    const Habit = require('../models/Habit');
    const habits = await Habit.find({ userId: user._id });

    let maxStreak = 0;
    if (habits.length) {
        maxStreak = Math.max(...habits.map(h => h.streak), 0);
    }

    const updatedStreak = await checkStreakBadges(user, maxStreak);
    const updatedLevel = await checkLevelBadges(user);

    if (updatedStreak || updatedLevel) {
        await user.save();
        return true;
    }
    return false;
};

module.exports = { STREAK_BADGES, LEVEL_BADGES, checkStreakBadges, checkLevelBadges, syncUserBadges };
