import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from './Notification';
import { AuthContext } from '../contexts/AuthContext';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { FaUsers, FaServer, FaFlag, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { motion } from 'framer-motion';
import AdminPageLayout from './AdminPageLayout';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StatCard = ({ title, value, trend, icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="rounded-lg bg-gray-800 p-6 shadow-lg"
  >
    <div className="flex items-center">
      <div className="mr-4 text-4xl text-purple-500">{icon}</div>
      <div>
        <p className="text-3xl font-bold text-white">{value !== undefined && value !== null ? value : 0}</p>
        <p className="text-sm text-gray-400">{title}</p>
      </div>
    </div>
    {trend && (
      <div className={`mt-4 flex items-center text-sm ${trend.includes('+') ? 'text-green-400' : 'text-red-400'}`}>
        {trend.includes('+') ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
        {trend}
      </div>
    )}
  </motion.div>
);

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const addNotification = useNotification();
  const { user } = useContext(AuthContext);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      addNotification('Access Denied: Not an administrator.', 'error');
      navigate('/dashboard');
    }
  }, [user, navigate, addNotification]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        const response = await api.get(`/admin/analytics?days=${dateRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAnalyticsData(response.data);
      } catch (err) {
        console.error('Failed to fetch analytics data:', err);
        addNotification('Failed to load analytics data.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [dateRange]);

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { ticks: { color: '#9CA3AF' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
      y: { ticks: { color: '#9CA3AF' }, grid: { color: 'rgba(255, 255, 255, 0.1)' }, beginAtZero: true },
    },
  };

  const barChartOptions = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { ticks: { color: '#9CA3AF' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
      y: { ticks: { color: '#9CA3AF' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
    },
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;
  }

  if (!analyticsData) {
    return <div className="flex h-screen items-center justify-center text-white">No data available.</div>;
  }

  const userRegistrationData = {
    labels: analyticsData.user_registration_trends.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'New Users',
        data: analyticsData.user_registration_trends.map(item => item.count),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const machinePopularityData = {
    labels: analyticsData.machine_popularity.slice(0, 10).map(item => item.name),
    datasets: [
      {
        label: 'Solves',
        data: analyticsData.machine_popularity.slice(0, 10).map(item => item.submission_count),
        backgroundColor: '#8B5CF6',
      },
    ],
  };

  return (
    <AdminPageLayout title="Analytics Dashboard">
      <div className="mb-8 flex items-center justify-end">
        <select
          onChange={(e) => setDateRange(e.target.value)}
          value={dateRange}
          className="rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Users" value={analyticsData.total_users} trend={`+${analyticsData.new_users_trend} this week`} icon={<FaUsers />} />
        <StatCard title="Total Machines" value={analyticsData.total_machines} trend={`+${analyticsData.new_machines_trend} this week`} icon={<FaServer />} />
        <StatCard title="Total Submissions" value={analyticsData.total_submissions} trend={`+${analyticsData.new_submissions_trend} this week`} icon={<FaFlag />} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-lg bg-gray-800 p-6">
            <h3 className="mb-4 text-xl font-bold text-white">User Registration Trends</h3>
            {analyticsData.user_registration_trends && analyticsData.user_registration_trends.length > 0 ? (
              <Line data={userRegistrationData} options={lineChartOptions} />
            ) : (
              <p className="text-gray-400">No user registration data available.</p>
            )}
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-lg bg-gray-800 p-6">
            <h3 className="mb-4 text-xl font-bold text-white">Top Users</h3>
            {analyticsData.top_users && analyticsData.top_users.length > 0 ? (
              <ul className="divide-y divide-gray-700">
                {analyticsData.top_users.map((u, index) => (
                  <li key={u.username} className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <span className="mr-4 text-lg font-bold text-gray-400">{index + 1}</span>
                      <span className="text-white">{u.username}</span>
                    </div>
                    <span className="font-semibold text-purple-400">{u.score}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No top users data available.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="rounded-lg bg-gray-800 p-6">
          <h3 className="mb-4 text-xl font-bold text-white">Top 10 Most Solved Machines</h3>
          {analyticsData.machine_popularity && analyticsData.machine_popularity.length > 0 ? (
            <Bar data={machinePopularityData} options={barChartOptions} />
          ) : (
            <p className="text-gray-400">No machine popularity data available.</p>
          )}
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default AnalyticsDashboard;