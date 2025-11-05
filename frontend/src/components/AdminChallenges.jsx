import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from './Notification';
import ChallengeCard from './ChallengeCard';
import AdminPageLayout from './AdminPageLayout';
import { FaEdit, FaTrash } from 'react-icons/fa';

const AdminChallenges = () => {
  const navigate = useNavigate();
  const addNotification = useNotification();
  const [challenges, setChallenges] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  const handleStartChallenge = async (challengeId) => {
    try {
      const token = localStorage.getItem('access_token');
      await api.post(`/admin/challenges/${challengeId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      addNotification('Challenge started successfully!', 'success');
      fetchChallenges();
    } catch (error) {
      console.error('Failed to start challenge:', error);
      addNotification(error.response?.data?.detail || 'Failed to start challenge!', 'error');
    }
  };

  const handleStopChallenge = async (challengeId) => {
    try {
      const token = localStorage.getItem('access_token');
      await api.post(`/admin/challenges/${challengeId}/stop`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      addNotification('Challenge stopped successfully!', 'success');
      fetchChallenges();
    } catch (error) {
      console.error('Failed to stop challenge:', error);
      addNotification(error.response?.data?.detail || 'Failed to stop challenge!', 'error');
    }
  };

  const fetchChallenges = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.get('/admin/challenges/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChallenges(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
      addNotification('Failed to fetch challenges.', 'error');
    }
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (window.confirm('Are you sure you want to delete this challenge? This will soft-delete it.')) {
      try {
        const token = localStorage.getItem('access_token');
        await api.delete(`/admin/challenges/${challengeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        addNotification('Challenge soft-deleted successfully!', 'success');
        fetchChallenges();
      } catch (error) {
        console.error('Failed to delete challenge:', error);
        addNotification('Failed to delete challenge!', 'error');
      }
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const filteredChallenges = challenges
    .filter(challenge => challenge.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(challenge => categoryFilter ? challenge.category === categoryFilter : true)
    .filter(challenge => difficultyFilter ? challenge.difficulty === difficultyFilter : true);

  return (
    <AdminPageLayout title="Manage Challenges">
      <div className="mb-4 flex items-center justify-between">
        <input
          type="text"
          placeholder="Search by title..."
          className="rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-4">
          <select
            className="rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Web">Web</option>
            <option value="Pwn">Pwn</option>
            <option value="Forensics">Forensics</option>
            <option value="Crypto">Crypto</option>
            <option value="Reversing">Reversing</option>
          </select>
          <select
            className="rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Insane">Insane</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChallenges.length === 0 ? (
          <p className="text-gray-400 col-span-full">No challenges match your criteria.</p>
        ) : (
          filteredChallenges.map((challenge) => (
            <div key={challenge.id} className="relative">
              <ChallengeCard challenge={challenge} isAdmin={true} />
              <div className="absolute top-2 right-2 flex space-x-2 z-20">
                {challenge.docker_image && !challenge.ip_address && (
                  <button
                    onClick={() => handleStartChallenge(challenge.id)}
                    className="p-2 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors"
                    title="Start Challenge"
                  >
                    Start
                  </button>
                )}
                {challenge.docker_image && challenge.ip_address && (
                  <button
                    onClick={() => handleStopChallenge(challenge.id)}
                    className="p-2 rounded-full bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                    title="Stop Challenge"
                  >
                    Stop
                  </button>
                )}
                <button
                  onClick={() => navigate(`/admin/edit-challenge/${challenge.id}`)}
                  className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  title="Edit Challenge"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDeleteChallenge(challenge.id)}
                  className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                  title="Delete Challenge"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminPageLayout>
  );
};

export default AdminChallenges;
