import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './Notification';

import './Auth.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const addNotification = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/token', new URLSearchParams({
        username,
        password,
      }));
      localStorage.setItem('access_token', response.data.access_token);
      
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      addNotification('Login failed!', 'error');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <div className="auth-header">
          <h1>VulnVerse</h1>
          <p>Welcome back. Please log in to your account.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary">Login</button>
        </form>
        <div className="auth-footer">
          <p>Don't have an account? <a href="/register">Register here</a></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
