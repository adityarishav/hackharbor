import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNotification } from '../components/Notification';
import { FaTrophy, FaMedal, FaUserAstronaut } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { countries, getCountryFlagUrl } from '../constants/countries';
import { FaGlobe as FaGlobeIcon } from 'react-icons/fa';

const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCountry, setSelectedCountry] = useState('');
    const addNotification = useNotification();

    const fetchLeaderboard = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const url = selectedCountry ? `/leaderboard?country=${selectedCountry}` : '/leaderboard';
            const response = await api.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setLeaderboard(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, [selectedCountry]); // Re-fetch when country changes

    const getRankIcon = (index) => {
        switch (index) {
            case 0: return <FaTrophy className="text-yellow-400 text-2xl" />;
            case 1: return <FaMedal className="text-gray-300 text-xl" />;
            case 2: return <FaMedal className="text-orange-400 text-xl" />;
            default: return <span className="font-bold text-gray-400">#{index + 1}</span>;
        }
    };

    const getRowStyle = (index) => {
        if (index === 0) return "bg-yellow-900/20 border-yellow-500/30";
        if (index === 1) return "bg-gray-800/50 border-gray-500/30";
        if (index === 2) return "bg-orange-900/20 border-orange-500/30";
        return "bg-gray-800/30 border-gray-700/30";
    };

    if (loading) return <div className="text-center text-gray-400 py-8">Loading leaderboard...</div>;

    return (
        <div className="glass-panel p-6 rounded-2xl">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold neon-text flex items-center gap-3">
                    <FaTrophy className="text-yellow-500" /> Leaderboard
                </h2>

                <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="glass-input px-4 py-2 rounded-xl text-sm text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                    <option value="">Global (All Countries)</option>
                    {countries.map(country => (
                        <option key={country.code} value={country.code}>
                            {country.flag} {country.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-3">
                {leaderboard.map((user, index) => (
                    <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center justify-between p-4 rounded-xl border backdrop-blur-md ${getRowStyle(index)} hover:bg-white/10 transition-all duration-300`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-8 flex justify-center">
                                {getRankIcon(index)}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/5 rounded-full border border-white/10">
                                    <FaUserAstronaut className="text-purple-400" />
                                </div>
                                <span className={`font-semibold text-lg flex items-center gap-2 ${index < 3 ? 'text-white' : 'text-gray-300'}`}>
                                    {user.username}
                                    {user.country ? (
                                        <img
                                            src={getCountryFlagUrl(user.country)}
                                            alt={user.country}
                                            className="h-5 w-auto rounded-sm shadow-sm"
                                            title={user.country}
                                        />
                                    ) : (
                                        <FaGlobeIcon className="text-gray-500 text-sm opacity-50" title="Global" />
                                    )}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-purple-400">{user.score}</span>
                            <span className="text-xs text-gray-500 uppercase tracking-wider">pts</span>
                        </div>
                    </motion.div>
                ))}
                {leaderboard.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        No scores found for this filter.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
