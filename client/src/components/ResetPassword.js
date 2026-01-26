// client/src/components/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/ResetPassword.css';

function ResetPassword() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [token, setToken] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tokenFromUrl = params.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        } else {
            setError('유효하지 않은 재설정 링크입니다');
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다');
            return;
        }

        if (newPassword.length < 6) {
            setError('비밀번호는 6자 이상이어야 합니다');
            return;
        }

        const specialCharPattern = /[!@#$%^&*(),.?":{}|<>]/;
        if (!specialCharPattern.test(newPassword)) {
            setError('비밀번호에 특수문자를 포함해주세요');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    newPassword
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('비밀번호가 변경되었습니다! 🎉\n새 비밀번호로 로그인해주세요.');
                setTimeout(() => {
                    window.location.href = '/';
                }, 5000);
            } else {
                setError(data.message || '비밀번호 변경에 실패했습니다');
            }
        } catch (err) {
            console.error('비밀번호 재설정 오류:', err);
            setError('서버와 연결할 수 없습니다');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reset-password-container">
            <div className="reset-password-card">
                <div className="logo-section">
                    <div className="logo">🔐</div>
                    <h1 className="app-title">새 비밀번호 설정</h1>
                </div>

                {message && (
                    <div className="success-message" style={{ whiteSpace: 'pre-line' }}>
                        {message}
                    </div>
                )}

                {!message && (
                    <form onSubmit={handleSubmit} className="reset-password-form">
                        <input
                            type="password"
                            placeholder="새 비밀번호 (특수문자 포함 6자 이상)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="input-field"
                            required
                        />

                        <input
                            type="password"
                            placeholder="새 비밀번호 확인"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="input-field"
                            required
                        />

                        {error && <div className="error-message">{error}</div>}

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={loading || !token}
                        >
                            {loading ? '변경 중...' : '비밀번호 변경'}
                        </button>
                    </form>
                )}

                <div className="footer-links">
                    <a href="/" style={{ color: '#667eea', textDecoration: 'none' }}>
                        ← 로그인으로 돌아가기
                    </a>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;