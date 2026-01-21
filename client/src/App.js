// client/src/App.js
import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Main from './components/Main';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

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
      <div className="App">
        {user ? (
            <Main user={user} onLogout={handleLogout} />
        ) : showRegister ? (
            <Register
                onRegisterSuccess={() => setShowRegister(false)}
                onBackToLogin={() => setShowRegister(false)}
            />
        ) : (
            <Login
                onLoginSuccess={handleLoginSuccess}
                onShowRegister={() => setShowRegister(true)}
            />
        )}
      </div>
  );
}

export default App;