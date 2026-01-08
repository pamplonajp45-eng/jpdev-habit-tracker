import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const GoalList = ({ habits }) => {
    const [goals, setGoals] = useState([]);
    const [newGoal, setNewGoal] = useState({ title: '', targetValue: '', linkedHabitId: '' });
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchGoals();
        }
    }, [isOpen]);

    const fetchGoals = async () => {
        try {
            const res = await api.get('/goals');
            setGoals(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddGoal = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/goals', newGoal);
            setGoals([...goals, res.data]);
            setNewGoal({ title: '', targetValue: '', linkedHabitId: '' });
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteGoal = async (id) => {
        try {
            await api.delete(`/goals/${id}`);
            setGoals(goals.filter(g => g._id !== id));
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
                🎯 {isOpen ? 'Hide Goals' : 'Manage Goals'}
            </button>

            {isOpen && (
                <div style={{ marginTop: '1rem', background: 'var(--card-bg)', borderRadius: '16px', padding: '1rem', border: '1px solid var(--card-border)' }}>
                    <h3 className="stats-title" style={{ marginBottom: '1rem' }}>Set New Goal</h3>
                    <form onSubmit={handleAddGoal} className="habit-form" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                        <input
                            type="text"
                            placeholder="Goal Title (e.g., Run 100km)"
                            value={newGoal.title}
                            onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                            required
                            className="habit-textbox"
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="number"
                                placeholder="Target Value"
                                value={newGoal.targetValue}
                                onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                                required
                                className="habit-textbox"
                                style={{ flex: 1 }}
                            />
                            <select
                                value={newGoal.linkedHabitId}
                                onChange={(e) => setNewGoal({ ...newGoal, linkedHabitId: e.target.value })}
                                className="habit-textbox"
                                style={{ flex: 1, color: 'black', fontWeight: 'normal' }}
                            >
                                <option value="">Link Habit (Optional)</option>
                                {habits.map(h => (
                                    <option key={h._id} value={h._id}>{h.name}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="habit-submit">Add Goal</button>
                    </form>

                    <div style={{ marginTop: '1.5rem' }}>
                        <h3 className="stats-title">My Goals</h3>
                        <div className="habit-list">
                            {goals.map(goal => (
                                <div key={goal._id} style={{
                                    padding: '0.75rem',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '12px',
                                    marginBottom: '0.5rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>{goal.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            Target: {goal.targetValue} {goal.linkedHabitId && `• Linked to: ${goal.linkedHabitId.name}`}
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteGoal(goal._id)} className="deleteHabit" style={{ width: '24px', height: '24px', fontSize: '0.9rem' }}>×</button>
                                </div>
                            ))}
                            {goals.length === 0 && <p className="text-center">No goals set yet.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoalList;
