// client/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import EmailVerification from './components/EmailVerification';
import Main from './components/Main';
import CreateRoom from './components/CreateRoom';
import RoomLobby from './components/RoomLobby';
import RankingPage from './components/RankingPage';
import MyRoom from './components/MyRoom';
import GachaPage from './components/GachaPage';
import GachaResult from './components/GachaResult';
import CustomCursor from './components/CustomCursor';
import AllRoomList from './components/AllRoomList'; // Import AllRoomList
import { AlertProvider } from './contexts/AlertContext';
import './App.css';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('user');
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
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  };
  return (
    <BrowserRouter>
      <AlertProvider>
        <div className="App">
          <div className="electron-nav"></div>
          <CustomCursor />
          <Routes>
            {/* 이메일 인증 (라우터 필요) */}
            <Route path="/verify-email" element={<EmailVerification />} />

            {/* 비밀번호 재설정 (라우터 필요) */}
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* 방 만들기 페이지 */}
            <Route path="/create-room" element={<CreateRoom user={user} />} />
            <Route path="/room/:roomId" element={<RoomLobby user={user} />} />
            <Route path="/rankings" element={<RankingPage user={user} />} />
            <Route path="/my-room" element={<MyRoom user={user} onBack={() => window.history.back()} />} />
            <Route path="/gacha" element={<GachaPage />} />
            <Route path="/gacha/result" element={<GachaResult />} />
            <Route path="/all-rooms" element={<AllRoomList />} /> {/* New Route */}

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
          </Routes >
        </div >
      </AlertProvider>
    </BrowserRouter >
  );
}

export default App;