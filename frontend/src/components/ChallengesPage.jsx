import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNotification } from './Notification';
import ChallengeCard from './ChallengeCard'; // Import ChallengeCard
import { useNavigate } from 'react-router-dom';

const ChallengesPage = () => {
    const [challenges, setChallenges] = useState([]);
    const [filteredChallenges, setFilteredChallenges] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const addNotification = useNotification();
    const navigate = useNavigate();

    const fetchChallenges = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await api.get('/challenges', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setChallenges(response.data);
            const uniqueCategories = ['All', ...new Set(response.data.map(c => c.category))];
            setCategories(uniqueCategories);
        } catch (error) {
            console.error('Error fetching challenges:', error);
            addNotification(error.response?.data?.detail || 'Error fetching challenges', 'error');
        }
    };

    useEffect(() => {
        fetchChallenges();
    }, []);

    useEffect(() => {
        if (selectedCategory === 'All') {
            setFilteredChallenges(challenges);
        } else {
            setFilteredChallenges(challenges.filter(c => c.category === selectedCategory));
        }
    }, [selectedCategory, challenges]);

    const handleCategoryFilter = (category) => {
        setSelectedCategory(category);
    };

    const handleChallengeClick = (challenge) => {
        navigate(`/challenges/${challenge.id}`);
    };

    return (
        <div className="container mx-auto px-4 py-8 bg-gray-900 text-white min-h-screen">
            <h1 className="text-4xl font-bold mb-6 text-purple-400">Challenges</h1>
            <div className="flex flex-wrap gap-4 mb-8">
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => handleCategoryFilter(category)}
                        className={`px-5 py-2 rounded-full font-semibold transition-colors ${
                            selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}>
                        {category}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredChallenges.length === 0 ? (
                    <p className="text-gray-400 col-span-full">No challenges available in this category.</p>
                ) : (
                    filteredChallenges.map(challenge => (
                        <ChallengeCard key={challenge.id} challenge={challenge} onChallengeClick={handleChallengeClick} />
                    ))
                )}
            </div>

            
        </div>
    );
};

export default ChallengesPage;