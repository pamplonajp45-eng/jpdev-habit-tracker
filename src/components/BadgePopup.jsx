import { useEffect } from "react";
import { STREAK_BADGES } from "../utils/badges";


export default function BadgePopup({ badge, onClose }) {
    const found = STREAK_BADGES.find(b => b.id === badge.id);
    if (!found) return null;

    useEffect(() => {
        // Play celebration sound
        const audio = new Audio("/celebration.mp3");
        audio.volume = 0.5;
        audio.play().catch(e => console.log("Audio play blocked", e));

        const timer = setTimeout(onClose, 5000); // 5s for better feel
        return () => clearTimeout(timer);
    }, []);

    const particles = Array.from({ length: 40 });

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "#000000aa",
            backdropFilter: "blur(8px)",
        }} onClick={onClose}>
            {/* Confetti Particles */}
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
                {particles.map((_, i) => (
                    <div key={i} className="confetti" style={{
                        left: `${Math.random() * 100}%`,
                        backgroundColor: ["#f0d080", "#8060a8", "#6366f1", "#10b981", "#ef4444"][i % 5],
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${2 + Math.random() * 2}s`
                    }} />
                ))}
            </div>

            <div style={{
                background: "linear-gradient(135deg, #1a0a2e, #0f0f1e)",
                border: "2px solid #6366f1",
                padding: "48px",
                textAlign: "center",
                position: "relative",
                borderRadius: "32px",
                animation: "badgePop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
                boxShadow: "0 0 50px rgba(99, 102, 241, 0.3), 0 0 100px rgba(99, 102, 241, 0.1)",
                maxWidth: "360px",
                width: "90%",
                overflow: "hidden"
            }} onClick={e => e.stopPropagation()}>
                {/* Background Glow */}
                <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "300px", height: "300px",
                    background: "radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)",
                    zIndex: 0,
                    animation: "pulseGlow 3s ease infinite"
                }} />

                <style>{`
          @keyframes badgePop {
            0% { transform: scale(0.3); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes floatEmoji {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(5deg); }
          }
          @keyframes pulseGlow {
            0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.2); }
          }
          @keyframes confettiRain {
            0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
          }
          .confetti {
            position: absolute;
            top: -20px;
            width: 10px;
            height: 10px;
            border-radius: 2px;
            animation: confettiRain linear forwards;
          }
        `}</style>

                <div style={{ position: "relative", zIndex: 1 }}>
                    <p style={{
                        color: "var(--text-secondary)",
                        fontSize: "12px",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: "800",
                        letterSpacing: "4px",
                        margin: "0 0 24px",
                        opacity: 0.8
                    }}>
                        UNLOCKED ACHIEVEMENT
                    </p>

                    <div style={{
                        fontSize: "84px",
                        animation: "floatEmoji 3s ease-in-out infinite",
                        marginBottom: "24px",
                        filter: "drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))"
                    }}>
                        {found.emoji}
                    </div>


                    <h2 style={{
                        color: "#f0d080",
                        fontFamily: "'Cinzel', serif",
                        fontSize: "18px",
                        margin: "0 0 8px",
                        textShadow: "0 0 20px #f0a500",
                    }}>
                        {found.label}
                    </h2>

                    <p style={{
                        color: "var(--text-secondary)",
                        opacity: 0.7,
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "12px",
                        margin: "16px 0 0"
                    }}>
                        Tap anywhere to close
                    </p>

                </div>
            </div>
        </div>
    );
}
