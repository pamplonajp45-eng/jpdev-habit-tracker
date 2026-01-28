import React, { useState } from 'react';
import api from '../../utils/api';

const ForgotPassword = ({ onCodeSent, onBackToLogin }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const res = await api.post('/auth/forgot-password', { email });
            setMessage(res.data.message);
            onCodeSent(email);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2 className="stats-title" style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '1rem' }}>Forgot Password</h2>
            <p style={{ textAlign: 'center', color: '#a0a0b8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Enter your email address and we'll send you a 6-digit code to reset your password.
            </p>

            {error && <div className="error-message" style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
            {message && <div className="success-message" style={{ color: '#10b981', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}

            <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="habit-textbox"
                />
                <button type="submit" className="habit-submit" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Code'}
                </button>
            </form>

            <p style={{ marginTop: '1rem', textAlign: 'center', color: '#a0a0b8' }}>
                Remembered your password? <button onClick={onBackToLogin} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 'bold' }}>Login</button>
            </p>
        </div>
    );
};

export default ForgotPassword;
