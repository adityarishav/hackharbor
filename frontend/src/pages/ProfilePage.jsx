import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNotification } from '../components/Notification';
import { motion } from 'framer-motion';
import { FaTrophy, FaFlag, FaServer, FaUserCircle, FaMedal, FaHistory, FaGlobe, FaBomb, FaBaby, FaUserSecret, FaSkull, FaChartPie, FaCalendarAlt } from 'react-icons/fa';

import { getCountryFlagUrl } from '../constants/countries';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

const ProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'history'
    const addNotification = useNotification();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await api.get('/users/profile', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setProfile(response.data);
            } catch (error) {
                console.error('Failed to fetch profile:', error);
                addNotification('Failed to load profile data.', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [addNotification]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    if (!profile) {
        return <div className="min-h-screen bg-gray-900 text-white p-8">Profile not found.</div>;
    }

    // Prepare Radar Chart Data
    const radarData = {
        labels: Object.keys(profile.category_scores || {}).length > 0 ? Object.keys(profile.category_scores) : ['Web', 'Pwn', 'Crypto', 'Forensics', 'Misc'],
        datasets: [
            {
                label: 'Skill Level',
                data: Object.keys(profile.category_scores || {}).length > 0 ? Object.values(profile.category_scores) : [0, 0, 0, 0, 0],
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                borderColor: 'rgba(139, 92, 246, 1)',
                borderWidth: 2,
            },
        ],
    };

    const radarOptions = {
        scales: {
            r: {
                angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                pointLabels: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 12 } },
                ticks: { display: false, backdropColor: 'transparent' },
            },
        },
        plugins: {
            legend: { display: false },
        },
    };

    // Helper to get icon component
    const getIcon = (iconName) => {
        const icons = { FaBaby, FaUserSecret, FaSkull, FaGlobe, FaBomb };
        const IconComponent = icons[iconName] || FaMedal;
        return <IconComponent />;
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-8 border border-gray-700 shadow-xl flex flex-col md:flex-row items-center gap-8"
                >
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-4xl font-bold shadow-lg">
                            {profile.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-gray-900 rounded-full p-2 border border-gray-700">
                            <FaUserCircle className="text-2xl text-gray-400" />
                        </div>
                    </div>
                    <div className="text-center md:text-left flex-grow">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                                {profile.username}
                            </h1>
                            {profile.country ? (
                                <img
                                    src={getCountryFlagUrl(profile.country)}
                                    alt={profile.country}
                                    className="h-8 w-auto rounded shadow-sm hover:scale-110 transition-transform cursor-help"
                                    title={profile.country}
                                />
                            ) : (
                                <FaGlobe className="text-3xl text-blue-400 hover:text-blue-300 transition-colors cursor-help" title="Global / No Country Selected" />
                            )}
                        </div>
                        <p className="text-gray-400 mb-4">{profile.email}</p>
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                            <span className="px-4 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-sm font-medium">
                                {profile.role}
                            </span>
                            <span className="px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-sm font-medium flex items-center gap-2">
                                <FaTrophy className="text-xs" /> Rank #{profile.rank}
                            </span>
                        </div>
                    </div>

                    {/* Total Score Card */}
                    <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700 min-w-[200px] text-center">
                        <p className="text-gray-400 text-sm uppercase tracking-wider mb-1">Total Score</p>
                        <p className="text-4xl font-bold text-purple-400">{profile.total_score}</p>
                    </div>
                </motion.div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'overview' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        Overview
                        {activeTab === 'overview' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-3 font-medium text-sm transition-colors relative ${activeTab === 'history' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        Solves History
                        {activeTab === 'history' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />}
                    </button>
                </div>

                {/* Overview Tab Content */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Stats & Radar */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-gray-800/30 rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 rounded-lg bg-blue-500/20 text-blue-400">
                                            <FaFlag className="text-2xl" />
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Challenges Solved</p>
                                            <p className="text-2xl font-bold">{profile.solved_challenges}</p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-gray-800/30 rounded-xl p-6 border border-gray-700 hover:border-green-500/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 rounded-lg bg-green-500/20 text-green-400">
                                            <FaServer className="text-2xl" />
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">Machines Pwned</p>
                                            <p className="text-2xl font-bold">{profile.solved_machines}</p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-gray-800/30 rounded-xl p-6 border border-gray-700 hover:border-red-500/50 transition-colors md:col-span-2 lg:col-span-1 lg:col-start-1 lg:col-end-3"
                                >
                                    <div className="flex items-center gap-4 justify-center lg:justify-start">
                                        <div className="p-4 rounded-lg bg-red-500/20 text-red-400">
                                            <FaSkull className="text-2xl" />
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm">First Bloods</p>
                                            <p className="text-2xl font-bold">{profile.first_blood_count || 0}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Activity Heatmap (Simplified) */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <FaCalendarAlt className="text-purple-400 text-xl" />
                                    <h2 className="text-2xl font-bold">Activity Log</h2>
                                </div>
                                <div className="space-y-4">
                                    {profile.recent_activity.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No recent activity found.</p>
                                    ) : (
                                        profile.recent_activity.map((activity, index) => (
                                            <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-md ${activity.type === 'Machine' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                        {activity.type === 'Machine' ? <FaServer /> : <FaFlag />}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-white">{activity.name}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {new Date(activity.date).toLocaleDateString()} • {new Date(activity.date).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-purple-400 font-mono font-bold">
                                                    +{activity.points} <span className="text-xs text-gray-500 font-sans font-normal">pts</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Column: Radar & Badges */}
                        <div className="space-y-8">
                            {/* Skill Radar */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700 flex flex-col items-center"
                            >
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <FaChartPie className="text-purple-400" /> Skill Breakdown
                                </h3>
                                <div className="w-full aspect-square max-w-[300px]">
                                    <Radar data={radarData} options={radarOptions} />
                                </div>
                            </motion.div>

                            {/* Badges */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700"
                            >
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <FaMedal className="text-yellow-500" /> Badges
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {profile.badges && profile.badges.length > 0 ? (
                                        profile.badges.map((badge, index) => (
                                            <div key={index} className="flex flex-col items-center text-center group relative">
                                                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-2xl text-yellow-400 mb-2 group-hover:bg-gray-600 transition-colors cursor-help">
                                                    {getIcon(badge.icon)}
                                                </div>
                                                <span className="text-xs font-medium text-gray-300">{badge.name}</span>

                                                {/* Tooltip */}
                                                <div className="absolute bottom-full mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                    {badge.description}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="col-span-3 text-center text-gray-500 text-sm">No badges unlocked yet.</p>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* History Tab Content */}
                {activeTab === 'history' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-gray-800/30 rounded-2xl p-8 border border-gray-700"
                    >
                        <h2 className="text-2xl font-bold mb-6">Full Solves History</h2>
                        {/* Reusing the activity list style for now, but this would be the place for a full table or paginated list */}
                        <div className="space-y-4">
                            {profile.recent_activity.map((activity, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-md ${activity.type === 'Machine' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {activity.type === 'Machine' ? <FaServer /> : <FaFlag />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{activity.name}</p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(activity.date).toLocaleDateString()} • {new Date(activity.date).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-purple-400 font-mono font-bold">
                                        +{activity.points} <span className="text-xs text-gray-500 font-sans font-normal">pts</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

            </div>
        </div>
    );
};

export default ProfilePage;
