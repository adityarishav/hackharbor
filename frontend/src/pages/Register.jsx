import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../components/Notification';
import { FaUser, FaLock, FaEnvelope, FaKey } from 'react-icons/fa';

function Register() {
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const addNotification = useNotification();

  const handleRegisterRequest = async (e) => {
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

    setLoading(true);
    try {
      await api.post('/auth/register-request', { username, email, password });
      addNotification('Verification code sent to your email!', 'success');
      setStep(2);
    } catch (error) {
      console.error('Registration Request failed:', error);
      if (error.response?.data?.detail) {
        addNotification(`Failed: ${error.response.data.detail}`, 'error');
      } else {
        addNotification('Failed to send verification code.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-register', { email, otp });
      addNotification('Registration successful! Please login.', 'success');
      navigate('/login');
    } catch (error) {
      console.error('Verification failed:', error);
      if (error.response?.data?.detail) {
        addNotification(`Verification failed: ${error.response.data.detail}`, 'error');
      } else {
        addNotification('Invalid code or expired.', 'error');
      }
    } finally {
      setLoading(false);
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
            <p className="text-gray-400">
              {step === 1 ? "Join the elite. Create your account." : "Verify your email."}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleRegisterRequest} className="space-y-6">
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
                <FaEnvelope className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Email"
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
              <div className="relative group">
                <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm Password"
                  className="w-full glass-input rounded-xl py-3 pl-12 pr-4 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full glass-button text-white font-bold py-3 rounded-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
              >
                {loading ? "Sending Code..." : "Next: Verify Email"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyRegister} className="space-y-6">
              <div className="text-center mb-4 text-sm text-gray-300">
                Enter the 4-digit code sent to <strong>{email}</strong>
              </div>
              <div className="relative group">
                <FaKey className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={4}
                  placeholder="Enter 4-digit Code"
                  className="w-full glass-input rounded-xl py-3 pl-12 pr-4 outline-none tracking-widest text-center text-xl font-mono"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 glass-button bg-gray-600/50 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 glass-button text-white font-bold py-3 rounded-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Complete Registration"}
                </button>
              </div>
            </form>
          )}

          <div className="text-center mt-6">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold hover:underline decoration-purple-400/50">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
