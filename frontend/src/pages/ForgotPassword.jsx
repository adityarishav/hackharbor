import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../components/Notification';
import { FaEnvelope, FaKey, FaLock } from 'react-icons/fa';

function ForgotPassword() {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const addNotification = useNotification();

    const handleRequestReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            addNotification('Reset code sent to your email!', 'success');
            setStep(2);
        } catch (error) {
            console.error('Forgot Password Request failed:', error);
            if (error.response?.data?.detail) {
                addNotification(`Failed: ${error.response.data.detail}`, 'error');
            } else {
                addNotification('Failed to send reset code.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/reset-password', { email, otp, new_password: newPassword });
            addNotification('Password reset successfully! Please login.', 'success');
            navigate('/login');
        } catch (error) {
            console.error('Reset Password failed:', error);
            if (error.response?.data?.detail) {
                addNotification(`Failed: ${error.response.data.detail}`, 'error');
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
                        <h1 className="text-4xl font-bold mb-2 neon-text">Password Reset</h1>
                        <p className="text-gray-400">
                            {step === 1 ? "Enter your email to receive a code." : "Enter code and new password."}
                        </p>
                    </div>

                    {step === 1 ? (
                        <form onSubmit={handleRequestReset} className="space-y-6">
                            <div className="relative group">
                                <FaEnvelope className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Enter your email"
                                    className="w-full glass-input rounded-xl py-3 pl-12 pr-4 outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full glass-button text-white font-bold py-3 rounded-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
                            >
                                {loading ? "Sending..." : "Send Reset Code"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="text-center mb-4 text-sm text-gray-300">
                                Code sent to <strong>{email}</strong>
                            </div>
                            <div className="relative group">
                                <FaKey className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    maxLength={4}
                                    placeholder="4-digit Code"
                                    className="w-full glass-input rounded-xl py-3 pl-12 pr-4 outline-none tracking-widest text-center text-xl font-mono"
                                />
                            </div>
                            <div className="relative group">
                                <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="New Password"
                                    className="w-full glass-input rounded-xl py-3 pl-12 pr-4 outline-none"
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
                                    {loading ? "Resetting..." : "Reset Password"}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="text-center mt-6">
                        <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold hover:underline decoration-purple-400/50">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
