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
    <div className="xp-bar-root">
      <div className="xp-bar-inner">
        {/* Level Badge */}
        <div className={`xp-level-badge ${justLeveled ? "just-leveled" : ""}`}>
          <span className="xp-level-label">LVL</span>
          <span className="xp-level-number">{level}</span>
        </div>

        <div className="xp-bar-content">
          <div className="xp-bar-header">
            <span className="xp-bar-label">Bitaw Level</span>
            <span className="xp-bar-numbers">
              <span className="xp-bar-current">
                {currentXP.toLocaleString()}
              </span>
              <span className="xp-bar-max"> / {maxXP.toLocaleString()}</span>
            </span>
          </div>

          {/* BAR TRACK */}
          <div ref={barRef} className="xp-bar-track">
            {/* Fill */}
            <div
              className={`xp-bar-fill ${animating ? "animating" : ""}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Progress % */}
          <div className="xp-bar-percent">
            {percentage.toFixed(1)}% to next level
          </div>
        </div>
      </div>

      {/* LEVEL UP BANNER */}
      {justLeveled && (
        <div className="xp-level-up-banner">
          <span className="xp-level-up-text">✦ Level Up ✦</span>
        </div>
      )}

      {/* XP Float indicator */}
      {gainAmount && (
        <div className="xp-float">
          <span className="xp-float-text">{gainAmount}</span>
        </div>
      )}

      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="xp-particle"
          style={{
            left: `${p.x}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

export default XPBar;
