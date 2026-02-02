// client/src/components/Login.js
import React, { useState } from 'react';

function Login({ onLoginSuccess, onShowRegister, onShowForgotPassword }) {
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
        <div className="bg-white text-slate-800 flex flex-col items-center justify-center font-sans antialiased relative overflow-hidden h-screen selection:bg-blue-100 selection:text-blue-700">
            {/* Background Blobs */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-white">
                <div className="absolute top-[-10%] right-[-5%] w-[60vh] h-[60vh] bg-slate-50 rounded-full blur-[80px] opacity-80"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50vh] h-[50vh] bg-blue-50/40 rounded-full blur-[100px]"></div>
            </div>

            <main className="relative z-10 w-full max-w-[420px] px-8 flex flex-col items-center justify-center min-h-[100dvh]">
                <div className="flex flex-col items-center mb-12 w-full animate-float" style={{ animationDuration: '4s' }}>
                    <div className="relative group mt-10 mb-9">
                        <img src="/assets/RoomList/login-1.png" alt="Logo" className="w-80 h-auto object-contain drop-shadow-xl transform transition-all duration-500 hover:scale-105" />
                    </div>
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                            점심 해적단
                        </h1>
                        <p className="text-slate-400 font-medium text-sm tracking-wide">
                            함께 점심 먹으러 출항하세요!
                        </p>
                    </div>
                </div>

                <form className="w-full space-y-4" onSubmit={handleLogin}>
                    <div className="group relative">
                        <label className="sr-only" htmlFor="email">이메일</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-20">
                                <span className="material-icons-round text-slate-400 group-focus-within:text-blue-600 transition-colors text-[20px]">alternate_email</span>
                            </div>
                            <input
                                className="block w-full pl-12 pr-4 py-[18px] bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-transparent focus:border-blue-100 rounded-2xl text-slate-800 placeholder-slate-400 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all duration-300"
                                id="email"
                                type="email"
                                placeholder="이메일 (예: pirate@company.com)"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="group relative">
                        <label className="sr-only" htmlFor="password">비밀번호</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-20">
                                <span className="material-icons-round text-slate-400 group-focus-within:text-blue-600 transition-colors text-[20px]">lock_outline</span>
                            </div>
                            <input
                                className="block w-full pl-12 pr-4 py-[18px] bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-transparent focus:border-blue-100 rounded-2xl text-slate-800 placeholder-slate-400 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all duration-300"
                                id="password"
                                type="password"
                                placeholder="비밀번호"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            className="w-full relative overflow-hidden group bg-blue-600 hover:bg-blue-700 text-white font-bold py-[18px] rounded-2xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 transform hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98]"
                            type="submit"
                            disabled={loading}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2 text-[16px]">
                                {loading ? '로그인 중...' : '로그인'}
                                {!loading && <span className="material-icons-round text-lg opacity-80 group-hover:translate-x-1 transition-transform">arrow_forward</span>}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                        </button>
                    </div>

                    <div className="pt-6 flex items-center justify-center gap-6 text-[13px]">
                        <a
                            className="text-slate-400 hover:text-slate-900 transition-colors duration-200 font-medium cursor-pointer"
                            onClick={(e) => {
                                e.preventDefault();
                                onShowForgotPassword();
                            }}
                        >
                            비밀번호 찾기
                        </a>
                        <div className="w-px h-3 bg-slate-200"></div>
                        <a
                            className="text-slate-400 hover:text-slate-900 transition-colors duration-200 font-medium cursor-pointer"
                            onClick={(e) => {
                                e.preventDefault();
                                onShowRegister();
                            }}
                        >
                            회원가입
                        </a>
                    </div>
                </form>

                <div className="mt-16 opacity-100 transition-opacity duration-500">
                    <p className="text-[10px] text-slate-300 uppercase tracking-[0.2em] font-bold font-display">
                        Lunch Pirates Group © 2026
                    </p>
                </div>
            </main>
        </div>
    );
}

export default Login;