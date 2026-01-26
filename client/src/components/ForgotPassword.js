// client/src/components/ForgotPassword.js

import React, { useState } from 'react';
import '../styles/ForgotPassword.css';

function ForgotPassword({ onBackToLogin }) {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/auth/request-password-reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(
                    `비밀번호 재설정 링크가 발송되었습니다.\n` +
                    `📧 ${email}\n\n` +
                    `메일함을 확인해주세요.\n\n` +
                    `💡 메일이 오지 않는다면:\n` +
                    `1. 스팸함을 확인해주세요\n` +
                    `2. 이메일 주소가 올바른지 확인해주세요\n` +
                    `3. 가입되지 않은 이메일일 수 있습니다`
                );
                setEmail('');
            } else {
                setError(data.message || '오류가 발생했습니다');
            }
        } catch (err) {
            console.error('비밀번호 재설정 요청 오류:', err);
            setError('서버와 연결할 수 없습니다');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-card">
                <div className="logo-section">
                    <div className="logo">🔑</div>
                    <h1 className="app-title">비밀번호 찾기</h1>
                    <p className="subtitle">가입하신 이메일을 입력해주세요</p>
                </div>

                {message && (
                    <div className="success-message" style={{ whiteSpace: 'pre-line' }}>
                        {message}
                    </div>
                )}

                {!message && (
                    <form onSubmit={handleSubmit} className="forgot-password-form">
                        <input
                            type="email"
                            placeholder="이메일 주소"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                            required
                        />

                        {error && <div className="error-message">{error}</div>}

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={loading}
                        >
                            {loading ? '전송 중...' : '재설정 링크 받기'}
                        </button>
                    </form>
                )}

                <div className="footer-links">
                    <a href="#" onClick={(e) => {
                        e.preventDefault();
                        onBackToLogin();
                    }}>
                        ← 로그인으로 돌아가기
                    </a>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;