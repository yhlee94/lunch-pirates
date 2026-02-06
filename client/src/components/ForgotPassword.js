// client/src/components/ForgotPassword.js

import React, { useState } from 'react';
import API_BASE_URL from '../apiConfig';

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
            const response = await fetch(`${API_BASE_URL}/api/auth/request-password-reset`, {
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
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-slate-900 font-sans antialiased">
            <main className="w-full max-w-[360px] relative z-10 flex flex-col items-center">
                <div className="-mb-8 relative flex justify-center">
                    <img
                        alt="3D Gold Key Icon"
                        className="w-[450px] h-[450px] object-contain max-w-none"
                        src={process.env.PUBLIC_URL + "/assets/Common/password.png"}
                    />
                </div>
                <div className="text-center w-full mb-8 space-y-3">
                    <h1 className="text-2xl font-bold text-black tracking-tight leading-tight">
                        비밀번호 찾기
                    </h1>
                    <p className="text-slate-600 text-sm font-medium tracking-wide">
                        가입하신 이메일을 입력해주세요
                    </p>
                </div>

                {message ? (
                    <div className="w-full p-4 bg-blue-50 text-blue-800 rounded-xl text-sm font-medium whitespace-pre-line leading-relaxed border border-blue-100 mb-6">
                        {message}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="w-full space-y-6">
                        <div className="group">
                            <label className="sr-only" htmlFor="email">이메일 주소</label>
                            <div className="relative">
                                <input
                                    className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-white text-slate-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-0 transition-colors duration-200 text-base"
                                    id="email"
                                    name="email"
                                    placeholder="이메일 주소"
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-xl">
                                {error}
                            </div>
                        )}

                        <button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base py-4 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98] transition-all duration-300 ease-out disabled:opacity-70 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? '전송 중...' : '재설정 링크 받기'}
                        </button>
                    </form>
                )}

                <div className="mt-10 w-full text-center">
                    <a
                        className="inline-flex items-center justify-center text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors duration-200 group py-2 px-4 cursor-pointer"
                        onClick={(e) => {
                            e.preventDefault();
                            onBackToLogin();
                        }}
                    >
                        <span className="material-icons-round text-lg mr-1.5 text-slate-500 group-hover:text-slate-800 group-hover:-translate-x-1 transition-all duration-200">arrow_back</span>
                        로그인으로 돌아가기
                    </a>
                </div>
            </main>
        </div>
    );
}

export default ForgotPassword;