import React from 'react';
import '../styles/Main.css';

function Main({ user, onLogout }) {
    return (
        <div className="main-container">
            <div className="header">
                <h1>🏴‍☠️ 점심 해적단</h1>
                <div className="user-info">
                    <span>{user.name || user.email}님 환영합니다!</span>
                    <button onClick={onLogout} className="logout-btn">로그아웃</button>
                </div>
            </div>

            <div className="content">
                <h2>메인 화면</h2>
                <p>로그인 성공! 🎉</p>
                <p>여기에 점심방 목록이 들어갈 예정입니다.</p>
            </div>
        </div>
    );
}

export default Main;