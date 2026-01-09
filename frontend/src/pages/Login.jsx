import React, { useState } from 'react';
import { LogIn, User, Lock, Eye, EyeOff } from 'lucide-react';
import './Auth.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        await login(); 
        navigate(from, { replace: true }); // Send them back to their intended page!
      }
    } catch (err) {
      setError("Cannot connect to server. Is Flask running?");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Sign In</h2>
        {error && <div className="error-banner">{error}</div>}
        
        <form onSubmit={handleSubmit} className="entry-form">
          <div className="input-group">
            <label><User size={14} /> Username</label>
            <input 
              type="text" 
              placeholder="Your username"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required 
            />
          </div>

          <div className="input-group">
            <label><Lock size={14} /> Password</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required 
              />
              <button 
                type="button" 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                style={{ padding: 10, scrollSnapPointsX: 'none', margin: 0, border: 'none', background: 'none' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ textAlign: 'right', marginTop: '5px' }}>
              <span 
                className="blue-text pointer" 
                style={{ fontSize: '0.8rem' }}
                onClick={() => navigate('/forgot-password')}
              >
                Forgot password?
              </span>
            </div>
          </div>

          <button type="submit" className="save-btn auth-btn">
            <LogIn size={18} /> Sign In
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <span className="blue-text pointer" onClick={() => navigate('/register')}>Create one</span>
        </p>
      </div>
    </div>
  );
};

export default Login;