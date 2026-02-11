// client/src/App.js
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
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
import io from 'socket.io-client';
import API_BASE_URL from './apiConfig';
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

  //  [전역] 자원 절약형 출항 알람 감시 (30분 단위 체크)
  useEffect(() => {
    const isElectron = window.navigator.userAgent.toLowerCase().includes('electron');
    if (!isElectron || !user) return;

    let lastCheckedMinute = -1; // 중복 호출 방지

    const checkNow = async () => {
      const now = new Date();
      const minutes = now.getMinutes();

      // 1. 딱 정각(00분) 혹은 30분일 때만 실행
      if ((minutes === 0 || minutes === 30) && lastCheckedMinute !== minutes) {
        lastCheckedMinute = minutes;
        console.log(`⏰ [정밀체크] ${minutes}분 정각 감지! 서버 승선 확인...`);

        try {
          const token = sessionStorage.getItem('token');
          const response = await fetch(`${API_BASE_URL}/api/rooms`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await response.json();

          if (data.success) {
            console.log(`🔍 [검사중] 불러온 방 개수: ${data.rooms.length}`);
            // 내가 참여 중인 방 중 '지금'이 출항 시간인 방이 있는지 확인
            const isDeparting = data.rooms.find(r => {
              if (!r.is_participant) return false;
              const dep = new Date(r.departure_time);
              const isMatch = dep.getHours() === now.getHours() && dep.getMinutes() === now.getMinutes();
              if (isMatch) {
                console.log(`[매칭성공] ${r.restaurant_name} - 출발시간: ${r.departure_time}`);
              }
              return isMatch;
            });

            if (isDeparting) {
              // 혼자 있는 방은 알람 울리지 않음 (오류 방지 및 UX)
              if (isDeparting.current_participants < 2) {
                console.log(`⛵ [출항취소] ${isDeparting.restaurant_name} 호, 인원 부족(1명)으로 출항 알림 생략`);
                return;
              }

              console.log(`⛵ [출항] ${isDeparting.restaurant_name} 호, 지금 출항합니다!`);
              try {
                if (window.require) {
                  const { ipcRenderer } = window.require('electron');
                  ipcRenderer.send('show-wallpaper', {
                    participants: isDeparting.participants,
                    restaurant_name: isDeparting.restaurant_name
                  });
                }
              } catch (e) {
                console.error('IPC 전송 실패:', e);
              }
            } else {
              console.log('👀 [확인] 지금 이 시간에 출항하는 내가 속한 해적선이 없습니다.');
            }
          }
        } catch (error) {
          console.error('알람 체크 실패:', error);
        }
      } else if (minutes !== 0 && minutes !== 30) {
        lastCheckedMinute = -1; // 0분/30분이 지나면 초기화
      }
    };

    const interval = setInterval(checkNow, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // [전역] 새 해적선 알림 감시
  useEffect(() => {
    const socket = io(API_BASE_URL);
    const isElectron = window.navigator.userAgent.toLowerCase().includes('electron');

    socket.on('new_room_created', (data) => {
      console.log('새로운 해적선 포착:', data);
      if (isElectron) {
        try {
          if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('show-notification', data);
          }
        } catch (e) {
          console.error('IPC 전송 실패:', e);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <HashRouter>
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
    </HashRouter >
  );
}

export default App;