import { useState, useEffect, useRef } from "react";

const XPBar = ({ currentXP = 0, maxXP = 100, level = 1 }) => {
    const [animating, setAnimating] = useState(false);
    const [particles, setParticles] = useState([]);
    const [justLeveled, setJustLeveled] = useState(false);
    const [gainAmount, setGainAmount] = useState(null);
    const barRef = useRef(null);
    const prevXpRef = useRef(currentXP);
    const prevLevelRef = useRef(level);

    const percentage = Math.min((currentXP / maxXP) * 100, 100);


    useEffect(() => {
        if (currentXP > prevXpRef.current) {
            const amount = currentXP - prevXpRef.current;
            setGainAmount(`+${amount} XP`);
            setAnimating(true);
            setTimeout(() => {
                setAnimating(false);
                setGainAmount(null);
            }, 1400);
        }
        prevXpRef.current = currentXP;
    }, [currentXP]);

    // Trigger Level Up Animation
    useEffect(() => {
        if (level > prevLevelRef.current) {
            setJustLeveled(true);
            spawnParticles();
            setTimeout(() => setJustLeveled(false), 2000);
        }
        prevLevelRef.current = level;
    }, [level]);

    const spawnParticles = () => {
        const newParticles = Array.from({ length: 18 }, (_, i) => ({
            id: Date.now() + i,
            x: Math.random() * 100,
            delay: Math.random() * 0.4,
            size: Math.random() * 4 + 3,
        }));
        setParticles(newParticles);
        setTimeout(() => setParticles([]), 1800);
    };

    return (
        <div className="xp-bar-root" style={{
            width: "100%",
            position: "relative",
            marginBottom: "1.5rem"
        }}>
            <div style={{ position: "relative" }}>
                {/* Level Badge */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "12px",
                    animation: justLeveled ? "levelUp 0.6s ease" : "none",
                }}>
                    <div style={{
                        width: "54px",
                        height: "54px",
                        background: "linear-gradient(135deg, #2a1840, #1a0a28)",
                        border: "2px solid #8060a8",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                        boxShadow: justLeveled ? "0 0 30px #f0a500, 0 0 60px #f0a50055" : "0 0 16px #8060a844",
                        transition: "box-shadow 0.4s",
                        animation: justLeveled ? "levelBadgePop 0.5s ease" : "none",
                    }}>
                        <span style={{ fontSize: "8px", color: "#a080c8", letterSpacing: "1px", fontWeight: 600 }}>LVL</span>
                        <span style={{ fontSize: "18px", color: "#f0e0ff", fontWeight: 900, lineHeight: 1 }}>{level}</span>
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                            <span style={{
                                fontSize: "10px",
                                color: "#8060a8",
                                letterSpacing: "2px",
                                textTransform: "uppercase",
                            }}>Bitaw Level</span>
                            <span style={{ fontSize: "11px", color: "#c0a0e0", letterSpacing: "1px" }}>
                                <span style={{ color: "#f0d080", fontWeight: 600 }}>{currentXP.toLocaleString()}</span>
                                <span style={{ color: "#604880" }}> / {maxXP.toLocaleString()}</span>
                            </span>
                        </div>

                        {/* BAR TRACK */}
                        <div ref={barRef} style={{
                            height: "14px",
                            background: "#0f0818",
                            border: "1px solid #3a2050",
                            position: "relative",
                            overflow: "hidden",
                            boxShadow: "inset 0 2px 8px #00000088",
                        }}>
                            {/* Scanline texture */}
                            <div style={{
                                position: "absolute", inset: 0, zIndex: 3,
                                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, #00000022 2px, #00000022 4px)",
                                pointerEvents: "none",
                            }} />

                            {/* Fill */}
                            <div className="xp-fill" style={{
                                width: `${percentage}%`,
                                height: "100%",
                                background: "linear-gradient(90deg, #6030a0, #9050d0, #c080ff, #f0d080)",
                                position: "relative",
                                animation: animating ? "pulse-glow 0.6s ease" : "none",
                                boxShadow: "0 0 10px #c080ff88",
                            }}>
                                {/* Shimmer sweep */}
                                <div style={{
                                    position: "absolute", top: 0, left: 0, width: "30%", height: "100%",
                                    background: "linear-gradient(90deg, transparent, #ffffff33, transparent)",
                                    animation: "shimmer 2s infinite",
                                }} />
                            </div>

                            {/* Tick marks */}
                            {[25, 50, 75].map(tick => (
                                <div key={tick} style={{
                                    position: "absolute", top: "20%", left: `${tick}%`,
                                    width: "1px", height: "60%",
                                    background: "#3a2050",
                                    zIndex: 2,
                                }} />
                            ))}
                        </div>

                        {/* Progress % */}
                        <div style={{ textAlign: "right", marginTop: "4px" }}>
                            <span style={{ fontSize: "9px", color: "#604880", letterSpacing: "1px" }}>
                                {percentage.toFixed(1)}% to next level
                            </span>
                        </div>
                    </div>
                </div>

                {/* LEVEL UP BANNER */}
                {justLeveled && (
                    <div style={{
                        position: "absolute",
                        top: "-20px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "linear-gradient(90deg, transparent, #f0a50022, #f0a50044, #f0a50022, transparent)",
                        border: "1px solid #f0a500",
                        padding: "6px 32px",
                        whiteSpace: "nowrap",
                        animation: "floatUp 2s ease forwards",
                        zIndex: 10,
                    }}>
                        <span style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#f0d080",
                            letterSpacing: "4px",
                            textShadow: "0 0 16px #f0a500",
                        }}>✦ LEVEL UP ✦</span>
                    </div>
                )}

                {/* XP Float indicator */}
                {gainAmount && (
                    <div style={{
                        position: "absolute",
                        top: "-20px",
                        right: "0",
                        animation: "floatUp 1.4s ease forwards",
                        pointerEvents: "none",
                    }}>
                        <span style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "#a0ff80",
                            textShadow: "0 0 10px #80ff40",
                        }}>{gainAmount}</span>
                    </div>
                )}

                {/* Particles */}
                {particles.map(p => (
                    <div key={p.id} style={{
                        position: "absolute",
                        bottom: "32px",
                        left: `${p.x}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        borderRadius: "50%",
                        background: "#f0d080",
                        boxShadow: "0 0 6px #f0a500",
                        animation: `particle 1s ${p.delay}s ease forwards`,
                        pointerEvents: "none",
                    }} />
                ))}

                {/* Decorative corners */}
                {[["0", "0", "right", "bottom"], ["0", "auto", "right", "top"], ["auto", "0", "left", "bottom"], ["auto", "auto", "left", "top"]].map(([b, t, br, tl], i) => (
                    <div key={i} style={{
                        position: "absolute",
                        bottom: b === "0" ? "-4px" : "auto",
                        top: t === "0" ? "-4px" : "auto",
                        [br]: "-4px",
                        width: "12px",
                        height: "12px",
                        borderBottom: b === "0" ? "1px solid #4a3060" : "none",
                        borderTop: t === "0" ? "1px solid #4a3060" : "none",
                        borderRight: br === "right" ? "1px solid #4a3060" : "none",
                        borderLeft: br === "left" ? "1px solid #4a3060" : "none",
                    }} />
                ))}
            </div>
        </div>
    );
};

export default XPBar;