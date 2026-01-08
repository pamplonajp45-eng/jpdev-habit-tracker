import React, { useState } from 'react';
import api from '../../utils/api';

const Login = ({ onSuccess, onSwitchToRegister }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
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
            const res = await api.post('/auth/login', formData);
            localStorage.setItem('token', res.data.token);
            // We might want to store user info too
            onSuccess(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2 className="stats-title" style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '1rem' }}>Login to HaBITAW</h2>
            {error && <div className="error-message" style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
            <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="habit-textbox"
                />
                <button type="submit" className="habit-submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <p style={{ marginTop: '1rem', textAlign: 'center', color: '#a0a0b8' }}>
                Don't have an account? <button onClick={onSwitchToRegister} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 'bold' }}>Register</button>
            </p>
        </div>
    );
};

export default Login;
