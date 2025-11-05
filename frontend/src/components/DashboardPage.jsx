import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import HeroSection from './HeroSection';
import ActivitySection from './ActivitySection';
import ComingSoonSection from './ComingSoonSection';

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [score, setScore] = useState(0);
  const [totalMachines, setTotalMachines] = useState(0);
  const [completedMachines, setCompletedMachines] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };

        const [userRes, scoreRes, machinesRes, submissionsRes] = await Promise.all([
          api.get('/users/me', { headers }),
          api.get('/users/me/score', { headers }),
          api.get('/machines/', { headers }),
          api.get('/users/me/submissions', { headers })
        ]);

        setUser(userRes.data);
        setScore(scoreRes.data.score);
        setTotalMachines(machinesRes.data.length);
        const completedMachineIds = new Set(submissionsRes.data.map(sub => sub.machine_id));
        setCompletedMachines(completedMachineIds.size);

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        if (error.response && error.response.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchData();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {user && (
        <HeroSection 
          username={user.username} 
          score={score} 
          completedMachines={completedMachines} 
          totalMachines={totalMachines} 
        />
      )}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search machines..."
          className="w-full p-2 rounded bg-gray-800 text-white"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <ActivitySection searchQuery={searchQuery} />
      <ComingSoonSection />
    </div>
  );
};

export default DashboardPage;