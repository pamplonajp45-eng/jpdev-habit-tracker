import React, { useState } from 'react';
import api from '../../utils/api';

const Register = ({ onRegistered, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/register', formData);
            onRegistered(res.data.userId, formData.email);
        } catch (err) {
            // Handle array of errors from express-validator or single message
            const msg = err.response?.data?.errors
                ? err.response.data.errors.map(e => e.msg).join(', ')
                : err.response?.data?.message || 'Registration failed';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2 className="stats-title" style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '1rem' }}>Create Account</h2>
            {error && <div className="error-message" style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
            <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="habit-textbox"
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="habit-textbox"
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password (Min 8 chars, 1 Upper, 1 Special)"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="habit-textbox"
                />
                <button type="submit" className="habit-submit" disabled={loading}>
                    {loading ? 'Signing Up...' : 'Register'}
                </button>
            </form>
            <p style={{ marginTop: '1rem', textAlign: 'center', color: '#a0a0b8' }}>
                Already have an account? <button onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 'bold' }}>Login</button>
            </p>
        </div>
    );
};

export default Register;
