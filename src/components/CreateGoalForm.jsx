import React, { useState } from 'react';
import api from '../utils/api';

const CreateGoalForm = ({ habits, onGoalCreated, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'streak', // default
        targetValue: '',
        linkedHabitId: '',
        deadline: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/goals', formData);
            if (onGoalCreated) onGoalCreated(res.data);
            setFormData({
                title: '', description: '', type: 'streak', targetValue: '', linkedHabitId: '', deadline: ''
            });
        } catch (error) {
            console.error('Error creating goal:', error);
            alert('Failed to create goal. Make sure details are valid.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="habit-form" style={{ flexDirection: 'column', gap: '1rem', background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <h3 className="stats-title">Create New Goal</h3>

            <input
                type="text"
                name="title"
                placeholder="Goal Title (e.g., 30 Day Yoga Streak)"
                value={formData.title}
                onChange={handleChange}
                required
                className="habit-textbox"
            />

            <textarea
                name="description"
                placeholder="Description (Optional motivation)"
                value={formData.description}
                onChange={handleChange}
                className="habit-textbox"
                style={{ resize: 'vertical', minHeight: '60px', fontFamily: 'inherit' }}
            />

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '120px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.2rem', display: 'block' }}>Goal Type</label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="habit-textbox"
                        style={{ width: '100%', color: 'black' }}
                    >
                        <option value="streak">Streak (Days in a row)</option>
                        <option value="total_count">Total Completion Count</option>
                        <option value="deadline_count">Count by Deadline</option>
                    </select>
                </div>

                <div style={{ flex: 1, minWidth: '80px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.2rem', display: 'block' }}>Target</label>
                    <input
                        type="number"
                        name="targetValue"
                        placeholder="Target (e.g. 30)"
                        value={formData.targetValue}
                        onChange={handleChange}
                        required
                        className="habit-textbox"
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.2rem', display: 'block' }}>Link to Habit</label>
                    <select
                        name="linkedHabitId"
                        value={formData.linkedHabitId}
                        onChange={handleChange}
                        required
                        className="habit-textbox"
                        style={{ width: '100%', color: 'black' }} // Force black text for readability in selects
                    >
                        <option value="">-- Select Habit --</option>
                        {habits.map(h => (
                            <option key={h._id} value={h._id}>{h.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ flex: 1, minWidth: '120px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.2rem', display: 'block' }}>Deadline (Opt)</label>
                    <input
                        type="date"
                        name="deadline"
                        value={formData.deadline}
                        onChange={handleChange}
                        className="habit-textbox"
                        style={{ width: '100%', color: 'black' }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={onCancel} className="habit-submit" style={{ background: '#333' }}>Cancel</button>
                <button type="submit" className="habit-submit" style={{ flex: 1 }}>Create Goal</button>
            </div>
        </form>
    );
};

export default CreateGoalForm;
