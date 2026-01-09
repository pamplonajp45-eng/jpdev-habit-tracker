import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import CreateGoalForm from './CreateGoalForm';

const GoalList = ({ habits }) => {
    const [goals, setGoals] = useState([]);
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        fetchGoals();
    }, []);

    // Refresh goals when habits change (in case progress updated) or just periodically
    // ideally dependent on habits update, but simple fetch on mount/open is okay

    // We can also Listen to a refresh event if we wanted, but let's stick to mount + manual trigger

    const fetchGoals = async () => {
        try {
            const res = await api.get('/goals');
            setGoals(res.data);
        } catch (error) {
            console.error('Error fetching goals:', error);
        }
    };

    const handleGoalCreated = (newGoal) => {
        setGoals([...goals, newGoal]);
        setShowCreate(false);
    };

    const handleDeleteGoal = async (id) => {
        if (!window.confirm('Delete this goal?')) return;
        try {
            await api.delete(`/goals/${id}`);
            setGoals(goals.filter(g => g._id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const getProgressPercentage = (current, target) => {
        if (!target || target === 0) return 0;
        const pct = Math.round((current / target) * 100);
        return pct > 100 ? 100 : pct;
    };

    return (
        <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="stats-title" style={{ fontSize: '1.2rem', margin: 0 }}>🏆 Goals & Milestones</h2>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="habit-submit"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', width: 'auto' }}
                >
                    {showCreate ? 'Close' : '+ New Goal'}
                </button>
            </div>

            {showCreate && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <CreateGoalForm
                        habits={habits}
                        onGoalCreated={handleGoalCreated}
                        onCancel={() => setShowCreate(false)}
                    />
                </div>
            )}

            <div className="habit-list">
                {goals.map(goal => {
                    const pct = getProgressPercentage(goal.currentValue, goal.targetValue);
                    const isCompleted = goal.status === 'completed';

                    return (
                        <div key={goal._id} style={{
                            padding: '1rem',
                            background: isCompleted ? 'rgba(79, 70, 229, 0.1)' : 'rgba(255,255,255,0.03)',
                            border: isCompleted ? '1px solid rgba(79, 70, 229, 0.3)' : '1px solid var(--card-border)',
                            borderRadius: '12px',
                            marginBottom: '0.8rem',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.3rem 0', fontWeight: 'bold' }}>
                                        {goal.title} {isCompleted && '🎉'}
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {goal.description || `Target: ${goal.targetValue}`}
                                    </p>
                                    {goal.linkedHabitId && (
                                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#888' }}>
                                            🔗 {goal.linkedHabitId.name || 'Linked Habit'}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDeleteGoal(goal._id)}
                                    style={{
                                        background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1.2rem'
                                    }}
                                >
                                    &times;
                                </button>
                            </div>

                            <div style={{ marginTop: '0.8rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                                    <span>{goal.currentValue} / {goal.targetValue}</span>
                                    <span>{pct}%</span>
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: '6px',
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '3px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${pct}%`,
                                        height: '100%',
                                        background: isCompleted ? '#10B981' : 'var(--primary-color)',
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
                {goals.length === 0 && !showCreate && (
                    <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem', padding: '1rem' }}>
                        No goals active. Set a goal to stay motivated!
                    </p>
                )}
            </div>
        </div>
    );
};

export default GoalList;
