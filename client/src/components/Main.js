import React from 'react';
import LunchRoomList from './LunchRoomList';


function Main({ user, onLogout }) {
    return (
        <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
            {/* Header Area */}
            <div className="bg-white/80 backdrop-blur-md px-8 py-4 flex justify-between items-center shadow-sm z-20">
                <h1 className="text-2xl font-bold text-slate-800">🏴‍☠️ 점심 해적단</h1>
                <div className="flex items-center gap-6">
                    <span className="text-slate-600 font-medium">{user.name || user.email}님 환영합니다!</span>
                    <button
                        onClick={onLogout}
                        className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-bold transition-colors shadow-sm"
                    >
                        로그아웃
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1">
                <LunchRoomList user={user} />
            </div>
        </div>
    );
}

export default Main;