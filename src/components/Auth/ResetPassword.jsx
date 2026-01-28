import React, { useState } from 'react';
import api from '../../utils/api';

const ResetPassword = ({ email, onResetSuccess, onBackToLogin }) => {
    const [formData, setFormData] = useState({ code: '', newPassword: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/reset-password', {
                email,
                code: formData.code,
                newPassword: formData.newPassword
            });
            onResetSuccess(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2 className="stats-title" style={{ textAlign: 'center', fontSize: '1.5rem', marginBottom: '1rem' }}>Reset Password</h2>
            <p style={{ textAlign: 'center', color: '#a0a0b8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Enter the 6-digit code sent to <strong>{email}</strong> and your new password.
            </p>

            {error && <div className="error-message" style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                    type="text"
                    name="code"
                    placeholder="6-digit Code"
                    value={formData.code}
                    onChange={handleChange}
                    required
                    maxLength="6"
                    className="habit-textbox"
                    style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}
                />
                <input
                    type="password"
                    name="newPassword"
                    placeholder="New Password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    className="habit-textbox"
                />
                <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm New Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="habit-textbox"
                />
                <button type="submit" className="habit-submit" disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                </button>
            </form>

            <button
                onClick={onBackToLogin}
                style={{ background: 'none', border: 'none', color: '#a0a0b8', cursor: 'pointer', marginTop: '1rem', width: '100%' }}
            >
                Back to Login
            </button>
        </div>
    );
};

export default ResetPassword;
