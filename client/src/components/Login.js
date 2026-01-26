// client/src/components/Login.js
import React, { useState } from 'react';
import '../styles/Login.css';

function Login({ onLoginSuccess, onShowRegister, onShowForgotPassword }) {  // 추가!
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                onLoginSuccess(data.user);
            } else {
                setError(data.message || '로그인에 실패했습니다.');
            }
        } catch (err) {
            setError('서버와 연결할 수 없습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="logo-section">
                    <div className="logo">🏴‍☠️</div>
                    <h1 className="app-title">점심 해적단</h1>
                    <p className="subtitle">함께 점심 먹으러 출항하세요!</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <input
                        type="email"
                        placeholder="이메일 (예: pirate@company.com)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field"
                        required
                    />

                    <input
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field"
                        required
                    />

                    {error && <div className="error-message">{error}</div>}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? '로그인 중...' : '로그인'}
                    </button>
                </form>

                <div className="footer-links">
                    <a href="#" onClick={(e) => {
                        e.preventDefault();
                        onShowForgotPassword();
                    }}>
                        비밀번호 찾기
                    </a>
                    <span className="divider">|</span>
                    <a href="#" onClick={(e) => {
                        e.preventDefault();
                        onShowRegister();
                    }}>
                        회원가입
                    </a>
                </div>
            </div>
        </div>
    );
}

export default Login;