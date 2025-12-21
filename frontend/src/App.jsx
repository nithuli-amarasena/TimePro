import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Clock, List, Settings } from 'lucide-react';

// We will create these files in Step 4
import TimeLogger from './pages/TimeLogger';
import AllLogs from './pages/AllLogs';
import Management from './pages/Management';

import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* --- PERSISTENT NAVIGATION BAR --- */}
        <header className="app-header">
          <div className="nav-content">
            <div className="logo">
              TIME<span className="blue-text">PRO</span>
            </div>
            
            <nav className="nav-links">
              <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                <Clock size={18} />
                <span>Time Logger</span>
              </NavLink>
              
              <NavLink to="/logs" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                <List size={18} />
                <span>History</span>
              </NavLink>
              
              <NavLink to="/management" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
                <Settings size={18} />
                <span>Management</span>
              </NavLink>
            </nav>
          </div>
        </header>

        {/* --- DYNAMIC PAGE CONTENT --- */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<TimeLogger />} />
            <Route path="/logs" element={<AllLogs />} />
            <Route path="/management" element={<Management />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;