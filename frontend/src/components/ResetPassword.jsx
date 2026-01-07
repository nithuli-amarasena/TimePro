import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    const data = await res.json();
    if (res.ok) {
      alert("Password updated successfully!");
      navigate('/login');
    } else {
      setMessage(data.message);
    }
  };

  if (!token) return (
    <div className="auth-container">
      <div className="auth-card">
        <p className="error-message">Invalid or missing reset token.</p>
      </div>
    </div>
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Set New Password</h2>
        <form onSubmit={handleSubmit} className="entry-form">
          <input 
            type="password" 
            placeholder="New Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" className="auth-btn">Update Password</button>
        </form>
        {message && <p className="error-message">{message}</p>}
      </div>
    </div>
  );
}