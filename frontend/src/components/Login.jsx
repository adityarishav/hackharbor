import React, { useState, useContext } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './Notification';
import { FaUser, FaLock } from 'react-icons/fa';
import { AuthContext } from '../contexts/AuthContext';

import './Auth.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const addNotification = useNotification();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/token', new URLSearchParams({
        username,
        password,
      }));
      login(response.data.access_token);
    } catch (error) {
      console.error('Login failed:', error);
      if (error.response && error.response.data && error.response.data.detail) {
        addNotification(`Login failed: ${error.response.data.detail}`, 'error');
      } else {
        addNotification('Login failed! Please check your credentials.', 'error');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <div className="auth-header">
          <div className="logo"></div>
          <h1>HackHarbor</h1>
          <p>Welcome back. Please log in to your account.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <FaUser className="icon" />
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Username" className="bg-gray-700 text-white border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 w-full" />
          </div>
          <div className="form-group">
            <FaLock className="icon" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" className="bg-gray-700 text-white border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 w-full" />
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