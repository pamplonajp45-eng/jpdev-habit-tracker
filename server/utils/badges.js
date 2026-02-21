const STREAK_BADGES = [
    { id: "first_step", label: "First Day Yarn?! ", emoji: "🌱", requirement: 1 },
    { id: "three_day_spark", label: "3-Day Spark, Palo!", emoji: "🔥", requirement: 3 },
    { id: "seven_day", label: "7-Day Warrior, Lakas mo boii", emoji: "📅", requirement: 7 },
    { id: "thirty_day", label: "Look at that!, Taking like a Champ! 30-day streak", emoji: "👑", requirement: 30 },
    { id: "hundred_day", label: "100-Day Streak,Bossing, May bitaw kana!", emoji: "🐉", requirement: 100 },

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

const syncUserBadges = async (user) => {
    const Habit = require('../models/Habit');
    const habits = await Habit.find({ userId: user._id });
    if (!habits.length) return false;

    const maxStreak = Math.max(...habits.map(h => h.streak), 0);
    const updated = await checkStreakBadges(user, maxStreak);

    if (updated) {
        await user.save();
    }
    return updated;
};

module.exports = { STREAK_BADGES, checkStreakBadges, syncUserBadges };
