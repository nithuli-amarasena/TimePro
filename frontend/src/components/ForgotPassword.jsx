import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    const data = await res.json();
    setMessage(data.message);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Forgot Password</h2>
        <form onSubmit={handleSubmit} className="entry-form">
          <input 
            type="text" 
            placeholder="Enter your username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
          <button type="submit" className="auth-btn">Get Reset Link</button>
        </form>
        {message && <p className="info-text">{message}</p>}
        <Link to="/login" className="back-link">← Back to Login</Link>
      </div>
    </div>
  );
}