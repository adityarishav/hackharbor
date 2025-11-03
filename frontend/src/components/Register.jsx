import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './Notification';

import './Auth.css';

import './Auth.css';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const addNotification = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/', { username, password });
      addNotification('Registration successful! Please login.', 'success');
      navigate('/login');
    } catch (error) {
      console.error('Registration failed:', error);
      addNotification('Registration failed!', 'error');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <div className="auth-header">
          <h1>VulnVerse</h1>
          <p>Create your account to start your journey.</p>
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
          <button type="submit" className="btn btn-primary">Register</button>
        </form>
        <div className="auth-footer">
          <p>Already have an account? <a href="/login">Login here</a></p>
        </div>
      </div>
    </div>
  );
}

export default Register;
