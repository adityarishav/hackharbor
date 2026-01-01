import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNotification } from '../components/Notification';
import ChallengeCard from '../components/ChallengeCard';
import Leaderboard from './Leaderboard';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaClock, FaGamepad, FaTrophy } from 'react-icons/fa';

const CountdownTimer = ({ targetDate, onComplete }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        } else {
            onComplete && onComplete();
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    const formatTime = (value) => value < 10 ? `0${value}` : value;

    if (Object.keys(timeLeft).length === 0) {
        return <span className="text-green-400 font-bold">Unlocking...</span>;
    }

    return (
        <div className="flex space-x-2 text-sm font-mono text-purple-300 bg-gray-800 px-3 py-1 rounded-md border border-purple-500/30">
            <FaClock className="mt-1" />
            <span>
                {timeLeft.days > 0 && `${timeLeft.days}d `}
                {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
            </span>
        </div>
    );
};

const ChallengesPage = () => {
    const [challenges, setChallenges] = useState([]);
    const [activeChallenges, setActiveChallenges] = useState([]);
    const [upcomingChallenges, setUpcomingChallenges] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'upcoming'
    const addNotification = useNotification();
    const navigate = useNavigate();

    const fetchChallenges = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await api.get('/challenges', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const allChallenges = response.data;
            setChallenges(allChallenges);

            // Process challenges
            const now = new Date();
            const active = [];
            const upcoming = [];

            allChallenges.forEach(c => {
                if (c.release_date) {
                    const releaseDate = new Date(c.release_date);
                    if (releaseDate > now) {
                        upcoming.push(c);
                    } else {
                        active.push(c);
                    }
                } else {
                    active.push(c); // No release date means active immediately
                }
            });

            setActiveChallenges(active);
            setUpcomingChallenges(upcoming);

            const uniqueCategories = ['All', ...new Set(allChallenges.map(c => c.category))];
            setCategories(uniqueCategories);
        } catch (error) {
            console.error('Error fetching challenges:', error);
            addNotification(error.response?.data?.detail || 'Error fetching challenges', 'error');
        }
    };

    useEffect(() => {
        fetchChallenges();
        const interval = setInterval(fetchChallenges, 60000); // Refresh every minute to check for unlocks
        return () => clearInterval(interval);
    }, []);

    const handleCategoryFilter = (category) => {
        setSelectedCategory(category);
    };

    const handleChallengeClick = (challenge) => {
        navigate(`/challenges/${challenge.id}`);
    };

    const handleUnlock = () => {
        fetchChallenges(); // Re-fetch to move challenge from upcoming to active
        addNotification('A new challenge has been unlocked!', 'success');
    };

    const filterChallenges = (list) => {
        if (selectedCategory === 'All') return list;
        return list.filter(c => c.category === selectedCategory);
    };

    const displayedChallenges = activeTab === 'active'
        ? filterChallenges(activeChallenges)
        : filterChallenges(upcomingChallenges);

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <h1 className="text-4xl font-bold neon-text mb-4 md:mb-0">
                            Challenges
                        </h1>

                        {/* Tabs */}
                        <div className="glass-panel p-1 rounded-xl flex space-x-1">
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${activeTab === 'active'
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <FaGamepad /> Active
                            </button>
                            <button
                                onClick={() => setActiveTab('upcoming')}
                                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${activeTab === 'upcoming'
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <FaClock /> Upcoming
                                {upcomingChallenges.length > 0 && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {upcomingChallenges.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-3 glass-panel p-4 rounded-xl inline-flex">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => handleCategoryFilter(category)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${selectedCategory === category
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}>
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Challenges Grid */}
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        <AnimatePresence>
                            {displayedChallenges.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="glass-panel p-12 rounded-xl text-center col-span-full"
                                >
                                    <p className="text-gray-400 text-lg">No challenges found in this category.</p>
                                </motion.div>
                            ) : (
                                displayedChallenges.map(challenge => (
                                    <motion.div
                                        key={challenge.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="relative group h-full">
                                            {activeTab === 'upcoming' && (
                                                <div className="absolute top-3 right-3 z-10">
                                                    <CountdownTimer
                                                        targetDate={challenge.release_date}
                                                        onComplete={handleUnlock}
                                                    />
                                                </div>
                                            )}
                                            <div className={`h-full ${activeTab === 'upcoming' ? 'opacity-75 pointer-events-none grayscale' : ''}`}>
                                                <ChallengeCard
                                                    challenge={challenge}
                                                    onChallengeClick={activeTab === 'active' ? handleChallengeClick : undefined}
                                                />
                                            </div>
                                            {activeTab === 'upcoming' && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                                                    <span className="text-white font-bold bg-black/60 px-4 py-2 rounded-lg border border-white/20 backdrop-blur-md">
                                                        Locked
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Sidebar / Leaderboard */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <Leaderboard />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChallengesPage;