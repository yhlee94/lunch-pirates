// client/src/App.js
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import EmailVerification from './components/EmailVerification';
import Main from './components/Main';
import CreateRoom from './components/CreateRoom';
import RoomLobby from './components/RoomLobby';
import './App.css';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // 로그인 성공 시 호출
  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  // 로그아웃
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* 이메일 인증 (라우터 필요) */}
          <Route path="/verify-email" element={<EmailVerification />} />

          {/* 비밀번호 재설정 (라우터 필요) */}
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* 방 만들기 페이지 (라우터 추가) */}
          <Route path="/create-room" element={<CreateRoom user={user} />} />
          <Route path="/room/:roomId" element={<RoomLobby user={user} />} />

          {/* 기본 화면들 (라우터 불필요, 기존 방식 유지) */}
          <Route path="*" element={
            user ? (
              <Main user={user} onLogout={handleLogout} />
            ) : showForgotPassword ? (
              <ForgotPassword
                onBackToLogin={() => setShowForgotPassword(false)}
              />
            ) : showRegister ? (
              <Register
                onRegisterSuccess={() => setShowRegister(false)}
                onBackToLogin={() => setShowRegister(false)}
              />
            ) : (
              <Login
                onLoginSuccess={handleLoginSuccess}
                onShowRegister={() => setShowRegister(true)}
                onShowForgotPassword={() => setShowForgotPassword(true)}
              />
            )
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;