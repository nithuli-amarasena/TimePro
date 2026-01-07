import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Clock, List, Settings, LogOut, LogIn } from 'lucide-react';
import { useAuth } from './context/AuthContext'; 

// Core Pages
import TimeLogger from './pages/TimeLogger';
import AllLogs from './pages/AllLogs';
import Management from './pages/ProjectManagement';
import Login from './pages/Login';
import Register from './pages/Register';

// Components
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

import './App.css';

function App() {
  const { user, logout, loading } = useAuth();

  // Show a professional loading screen while checking the session
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Verifying Session...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <div className="nav-content">
            <div className="logo">TIME<span className="blue-text">PRO</span></div>
            
            <nav className="nav-links">
              {user ? (
                <>
                  <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                    <Clock size={18} /><span>Time Logger</span>
                  </NavLink>
                  <NavLink to="/logs" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                    <List size={18} /><span>All Logs</span>
                  </NavLink>
                  <NavLink to="/management" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                    <Settings size={18} /><span>Management</span>
                  </NavLink>
                  <button onClick={logout} className="nav-item logout-btn">
                    <LogOut size={18} /><span>Logout</span>
                  </button>
                </>
              ) : (
                <NavLink to="/login" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                  <LogIn size={18} /><span>Login</span>
                </NavLink>
              )}
            </nav>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            {/* PROTECTED ROUTES */}
            <Route path="/" element={user ? <TimeLogger /> : <Navigate to="/login" replace />} />
            <Route path="/logs" element={user ? <AllLogs /> : <Navigate to="/login" replace />} />
            <Route path="/management" element={user ? <Management /> : <Navigate to="/login" replace />} />

            {/* PUBLIC ROUTES */}
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* FALLBACK: Redirect any unknown URL to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;