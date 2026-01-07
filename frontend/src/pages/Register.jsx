import React, { useState } from 'react';
import { UserPlus, User, Lock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // FRONTEND VALIDATION: Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    // Check password length (optional but recommended)
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registration successful!");
        navigate('/login');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <div className="auth-header">
          <div className="logo">TIME<span className="blue-text">PRO</span></div>
          <h2 className="page-title">Create Account</h2>
        </div>

        {error && <div className="error-message" style={{color: '#ff4d4d', textAlign: 'center', marginBottom: '10px'}}>{error}</div>}

        <form onSubmit={handleSubmit} className="entry-form">
          <div className="input-group">
            <label><User size={14} /> Username</label>
            <input 
              type="text" 
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required 
            />
          </div>

          <div className="input-group">
            <label><Lock size={14} /> Password</label>
            <input 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required 
            />
          </div>

          <div className="input-group">
            <label><CheckCircle size={14} /> Confirm Password</label>
            <input 
              type="password" 
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required 
            />
          </div>

          <button type="submit" className="save-btn auth-btn">
            <UserPlus size={18} /> Register
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <span className="blue-text pointer" onClick={() => navigate('/login')}>Sign In</span>
        </p>
      </div>
    </div>
  );
};

export default Register;