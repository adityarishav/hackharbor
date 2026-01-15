import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { useNotification } from '../components/Notification';
import { FaUser, FaLock, FaSave, FaEnvelope } from 'react-icons/fa';
import { countries } from '../constants/countries';

const SettingsPage = () => {
    const { user, setUser } = useContext(AuthContext); // Assuming setUser is available in context to update local state
    const addNotification = useNotification();

    const [email, setEmail] = useState(user?.email || '');
    const [country, setCountry] = useState(user?.country || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    React.useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem('access_token');
                // Note: Backend defines this with a trailing slash
                const response = await api.get('/users/me/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('User profile fetched:', response.data);
                if (response.data.email) {
                    setEmail(response.data.email);
                } else {
                    console.log('No email found in user profile');
                }
                if (response.data.country) {
                    setCountry(response.data.country);
                }
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
            }
        };

        if (user) {
            fetchUserProfile();
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await api.put('/users/me', { email, country }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local user context if needed, though usually it might fetch from /users/me again
            // For now, let's assume we might need to refresh the page or the context updates itself
            addNotification('Profile updated successfully', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            addNotification(error.response?.data?.detail || 'Failed to update profile', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            addNotification('New passwords do not match', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            await api.put('/users/me', {
                current_password: currentPassword,
                password: newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addNotification('Password updated successfully', 'success');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Error updating password:', error);
            addNotification(error.response?.data?.detail || 'Failed to update password', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8 flex justify-center">
            <div className="w-full max-w-2xl space-y-8">
                <h2 className="text-3xl font-bold text-white neon-text mb-8">Account Settings</h2>

                {/* Profile Settings */}
                <div className="glass-panel p-8 rounded-2xl">
                    <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
                        <div className="p-3 rounded-lg bg-purple-500/20 text-purple-300">
                            <FaUser size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Profile Information</h3>
                            <p className="text-sm text-gray-400">Update your account details</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                            <input
                                type="text"
                                value={user?.username || ''}
                                disabled
                                className="w-full glass-input rounded-xl p-3 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">Username cannot be changed.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                            <div className="relative">
                                <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full glass-input rounded-xl p-3 pl-10 text-white focus:ring-2 focus:ring-purple-500/50 transition-all"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                            <select
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                className="w-full glass-input rounded-xl p-3 text-white bg-gray-800 focus:ring-2 focus:ring-purple-500/50 transition-all"
                            >
                                <option value="">Select a country</option>
                                {countries.map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.flag} {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="glass-button px-6 py-2 rounded-xl text-white flex items-center gap-2 hover:bg-purple-600/20 transition-all"
                            >
                                <FaSave />
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Password Settings */}
                <div className="glass-panel p-8 rounded-2xl">
                    <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
                        <div className="p-3 rounded-lg bg-blue-500/20 text-blue-300">
                            <FaLock size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Security</h3>
                            <p className="text-sm text-gray-400">Change your password</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full glass-input rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500/50 transition-all"
                                placeholder="Enter current password"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full glass-input rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full glass-input rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="glass-button px-6 py-2 rounded-xl text-white flex items-center gap-2 hover:bg-blue-600/20 transition-all"
                            >
                                <FaSave />
                                {isLoading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
