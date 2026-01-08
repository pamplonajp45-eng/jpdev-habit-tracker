import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Leaderboard = () => {
    const [leaders, setLeaders] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchLeaderboard();
        }
    }, [isOpen]);

    const fetchLeaderboard = async () => {
        try {
            const res = await api.get('/leaderboard');
            setLeaders(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ marginTop: '1rem' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="habit-submit"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--card-border)' }}
            >
                🏆 {isOpen ? 'Hide Leaderboard' : 'Show Leaderboard'}
            </button>

            {isOpen && (
                <div style={{ marginTop: '1rem', background: 'var(--card-bg)', borderRadius: '16px', padding: '1rem', border: '1px solid var(--card-border)' }}>
                    <h3 className="stats-title" style={{ textAlign: 'center', marginBottom: '1rem' }}>Top Streaks</h3>
                    <div className="habit-list">
                        {leaders.map((user, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '0.75rem',
                                borderBottom: index < leaders.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontWeight: 'bold', color: index < 3 ? 'var(--accent)' : 'var(--text-secondary)' }}>#{index + 1}</span>
                                    <span style={{ color: 'var(--text-primary)' }}>{user.username}</span>
                                </div>
                                <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{user.maxStreak} <small style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>streak</small></span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
