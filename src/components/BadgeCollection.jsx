import { STREAK_BADGES, LEVEL_BADGES } from "../utils/badges";

export default function BadgeCollection({ user }) {
    const earnedIds = new Set((user?.badges || []).map(b => b.id));

    const renderBadge = (badge, type) => {
        const earned = earnedIds.has(badge.id);
        const requirementText = type === "streak" ? `${badge.requirement} day streak` : `Level ${badge.requirement}`;

        return (
            <div key={badge.id} style={{
                background: earned ? "linear-gradient(135deg, #2a1840, #1a0a28)" : "#111",
                border: `1px solid ${earned ? "#8060a8" : "#2a2a2a"}`,
                padding: "16px",
                textAlign: "center",
                opacity: earned ? 1 : 0.4,
                filter: earned ? "none" : "grayscale(1)",
                transition: "all 0.3s",
                position: "relative",
            }}>
                <div style={{ fontSize: "36px", marginBottom: "8px" }}>
                    {badge.emoji}
                </div>
                <p style={{
                    color: earned ? "#f0d080" : "#555",
                    fontSize: "11px",
                    fontFamily: "'Cinzel', serif",
                    margin: 0,
                    letterSpacing: "0.5px",
                }}>
                    {badge.label}
                </p>
                {!earned && (
                    <p style={{
                        color: "var(--text-secondary)",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "10px",
                        marginTop: "4px"
                    }}>
                        {requirementText}
                    </p>
                )}

                {earned && (
                    <div style={{
                        position: "absolute", top: "6px", right: "6px",
                        fontSize: "10px", color: "#a0ff80",
                    }}>✓</div>
                )}
            </div>
        );
    };

    return (
        <div style={{ padding: "16px" }}>
            <h2 style={{
                color: "#a080c8", fontFamily: "'Inter', sans-serif",
                fontWeight: "800", textTransform: "uppercase", fontSize: "1.2rem",
                letterSpacing: "1px", marginBottom: "24px"
            }}>
                Achievements
            </h2>

            <h3 style={{ color: "#eee", fontFamily: "'Inter', sans-serif", fontSize: "1rem", marginBottom: "12px" }}>
                Streak Badges
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "32px" }}>
                {STREAK_BADGES.map(badge => renderBadge(badge, "streak"))}
            </div>

            <h3 style={{ color: "#eee", fontFamily: "'Inter', sans-serif", fontSize: "1rem", marginBottom: "12px" }}>
                Level Badges
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {LEVEL_BADGES.map(badge => renderBadge(badge, "level"))}
            </div>
        </div>
    );
}