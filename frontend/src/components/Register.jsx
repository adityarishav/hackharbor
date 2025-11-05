import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './Notification';
import { FaUser, FaLock, FaEnvelope } from 'react-icons/fa';

import './Auth.css';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const addNotification = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addNotification('Passwords do not match!', 'error');
      return;
    }
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      addNotification('Invalid email format!', 'error');
      return;
    }
    try {
      await api.post('/users/', { username, email, password });
      addNotification('Registration successful! Please login.', 'success');
      navigate('/login');
    } catch (error) {
      console.error('Registration failed:', error);
      if (error.response && error.response.data && error.response.data.detail) {
        // Handle FastAPI validation errors (which can be an array)
        if (Array.isArray(error.response.data.detail)) {
          const errorMsg = error.response.data.detail.map(d => `${d.loc[1]} - ${d.msg}`).join('; ');
          addNotification(`Registration failed: ${errorMsg}`, 'error');
        } else {
          // Handle other string-based detail errors
          addNotification(`Registration failed: ${error.response.data.detail}`, 'error');
        }
      } else {
        addNotification('Registration failed! Please try again.', 'error');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <div className="auth-header">
          <div className="logo"></div>
          <h1>HackHarbor</h1>
          <p>Create your account to start your journey.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <FaUser className="icon" />
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Username" className="bg-gray-700 text-white border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 w-full" />
          </div>
          <div className="form-group">
            <FaEnvelope className="icon" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email" className="bg-gray-700 text-white border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 w-full" />
          </div>
          <div className="form-group">
            <FaLock className="icon" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" className="bg-gray-700 text-white border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 w-full" />
          </div>
          <div className="form-group">
            <FaLock className="icon" />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Confirm Password" className="bg-gray-700 text-white border border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 w-full" />
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