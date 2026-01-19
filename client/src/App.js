import logo from './logo.svg';
import './App.css';

// client/src/App.js
import React, { useState } from 'react';
import Login from './components/Login';
import Main from './components/Main';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

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
        ) : (
            <Login onLoginSuccess={handleLoginSuccess} />
        )}
      </div>
  );
}

export default App;
