const STREAK_BADGES = [
    { id: "first_step", label: "First Step yarn?", emoji: "🌱", requirement: 1 },
    { id: "three_day_spark", label: "Palo!, 3-Day Spark", emoji: "🔥", requirement: 3 },
    { id: "seven_days", label: "Day 7 kana boss!", emoji: "🔥🔥", requirement: 7 },
    { id: "thirty_days", label: "30-Day Champ!!", emoji: "👑", requirement: 30 },
    { id: "hundred_days", label: "YAN ANG BATA KO!, 100-Day Champ!!", emoji: "👑👑", requirement: 100 },
];
module.exports = { STREAK_BADGES };

//ito yung mag checheck ng streak
const checkStreakBadges = async (user, currentStreak) => {
    for (const badge of STREAK_BADGES) {
        //mag sskip kapag nakuha na yung badge para di maaward pa ulet

        const alreadyEarned = user.badges.some(b => b.id === badge.id);
        if (alreadyEarned) continue;

        //mag aaward kapag na hit na yung requirement
        if (currentStreak >= badge.requirement) {
            user.badges.push({ id: badge.id, earnedAt: new Date() });
        }
    } await user.save();

};
module.exports = { STREAK_BADGES, checkStreakBadges };
