import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import { FaUsers, FaServer, FaFlag, FaSignal } from 'react-icons/fa';
import api from '../services/api';

const StatCards = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    active_machines: 0,
    total_submissions: 0,
    active_sessions: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await api.get('/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Total Users" value={stats.total_users} icon={<FaUsers />} />
      <StatCard title="Active Machines" value={stats.active_machines} icon={<FaServer />} />
      <StatCard title="Total Submissions" value={stats.total_submissions} icon={<FaFlag />} />
      <StatCard title="Active Sessions" value={stats.active_sessions} icon={<FaSignal />} />
    </div>
  );
};

export default StatCards;