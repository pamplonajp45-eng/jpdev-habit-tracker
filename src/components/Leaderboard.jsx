import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Leaderboard = () => {
    const [leaders, setLeaders] = useState([]);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

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
            <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '1rem', border: '1px solid var(--card-border)' }}>
                <h3 className="stats-title" style={{ textAlign: 'center', marginBottom: '1rem' }}>Top Streaks 🏆</h3>
                <div className="habit-list">
                    {leaders.length > 0 ? leaders.map((user, index) => (
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
                    )) : (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No rankings yet...</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
