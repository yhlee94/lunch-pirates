// client/src/components/ResetPassword.js
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import API_BASE_URL from '../apiConfig';

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
            const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
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
                }, 3000);
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
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-slate-900 font-sans antialiased">
            <main className="w-full max-w-[360px] relative z-10 flex flex-col items-center -mt-24">
                <div className="-mb-16 relative flex justify-center">
                    <img
                        alt="Password Reset Icon"
                        className="w-[600px] h-[600px] object-contain max-w-none"
                        src="/assets/Common/reset.png"
                    />
                </div>

                <div className="text-center w-full mb-8 space-y-3">
                    <h1 className="text-2xl font-bold text-black tracking-tight leading-tight">
                        새 비밀번호 설정
                    </h1>
                    <p className="text-slate-600 text-sm font-medium tracking-wide">
                        새로운 비밀번호를 입력해주세요
                    </p>
                </div>

                {message ? (
                    <div className="w-full p-6 bg-blue-50 text-primary rounded-2xl text-center font-bold whitespace-pre-line leading-relaxed border border-blue-100 mb-6 shadow-sm">
                        {message}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="w-full space-y-6">
                        <div className="space-y-4">
                            <input
                                type="password"
                                placeholder="새 비밀번호 (특수문자 포함 6자 이상)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-white text-slate-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 text-base shadow-sm"
                                required
                            />

                            <input
                                type="password"
                                placeholder="새 비밀번호 확인"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-white text-slate-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 text-base shadow-sm"
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center font-medium bg-red-50 py-3 rounded-xl border border-red-100">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary-bright text-white font-bold text-base py-4 rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/40 active:scale-[0.98] transition-all duration-300 ease-out disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={loading || !token}
                        >
                            {loading ? '변경 중...' : '비밀번호 변경'}
                            {!loading && <span className="material-icons-round text-lg opacity-80">check_circle</span>}
                        </button>
                    </form>
                )}

                <div className="mt-10 w-full text-center">
                    <a
                        href="/"
                        className="inline-flex items-center justify-center text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors duration-200 group py-2 px-4 cursor-pointer no-underline"
                    >
                        <span className="material-icons-round text-lg mr-1.5 text-slate-500 group-hover:text-slate-800 group-hover:-translate-x-1 transition-all duration-200">arrow_back</span>
                        로그인으로 돌아가기
                    </a>
                </div>
            </main>
        </div>
    );
}

export default ResetPassword;