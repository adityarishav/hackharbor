import React, { useState, useContext } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from './Notification';
import { FaUser, FaLock } from 'react-icons/fa';
import { AuthContext } from '../contexts/AuthContext';

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
      addNotification('Login successful! Welcome back.', 'success');
      navigate('/dashboard'); 
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
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-purple-400">HackHarbor</h1>
            <p className="text-gray-400 mt-2">Welcome back, hacker.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <FaUser className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                placeholder="Username" 
                className="w-full bg-gray-700 text-white border-2 border-gray-600 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition" 
              />
            </div>
            <div className="relative">
              <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="Password" 
                className="w-full bg-gray-700 text-white border-2 border-gray-600 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition" 
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
            >
              Login
            </button>
          </form>
          <div className="text-center mt-6">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
