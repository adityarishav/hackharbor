import React, { useState, useContext } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../components/Notification';
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/30 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass-panel p-8 rounded-2xl">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-2 neon-text">HackHarbor</h1>
            <p className="text-gray-400">Welcome back, hacker.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <FaUser className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Username"
                className="w-full glass-input rounded-xl py-3 pl-12 pr-4 outline-none"
              />
            </div>
            <div className="relative group">
              <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                className="w-full glass-input rounded-xl py-3 pl-12 pr-4 outline-none"
              />
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300 hover:underline">
                Forgot Password?
              </Link>
            </div>
            <button
              type="submit"
              className="w-full glass-button text-white font-bold py-3 rounded-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Login
            </button>
          </form>
          <div className="text-center mt-6">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold hover:underline decoration-purple-400/50">
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
