import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from '../components/Notification';
import { AuthContext } from '../contexts/AuthContext';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { FaUsers, FaServer, FaFlag, FaArrowUp, FaArrowDown, FaTrophy, FaSkull } from 'react-icons/fa';
import { motion } from 'framer-motion';
import AdminPageLayout from '../layouts/AdminPageLayout';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StatCard = ({ title, value, trend, icon, color = "purple" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="glass-card p-6 rounded-xl relative overflow-hidden group"
  >
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300`}>
      <div className={`text-6xl text-${color}-500`}>{icon}</div>
    </div>
    <div className="relative z-10">
      <div className="flex items-center mb-2">
        <div className={`p-3 rounded-lg bg-${color}-500/20 text-${color}-400 mr-4`}>
          {icon}
        </div>
        <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">{title}</p>
      </div>
      <div className="flex items-end">
        <p className="text-3xl font-bold text-white mr-2">{value !== undefined && value !== null ? value : 0}</p>
        {trend && (
          <div className={`flex items-center text-xs mb-1 ${trend.includes('+') ? 'text-green-400' : 'text-red-400'}`}>
            {trend.includes('+') ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
            {trend}
          </div>
        )}
      </div>
    </div>
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

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { ticks: { color: '#9CA3AF' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
      y: { ticks: { color: '#9CA3AF' }, grid: { color: 'rgba(255, 255, 255, 0.05)' }, beginAtZero: true },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'right', labels: { color: '#fff' } },
    },
    cutout: '70%',
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
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const machinePopularityData = {
    labels: analyticsData.machine_popularity.slice(0, 5).map(item => item.name),
    datasets: [
      {
        label: 'Solves',
        data: analyticsData.machine_popularity.slice(0, 5).map(item => item.submission_count),
        backgroundColor: '#3B82F6',
        borderRadius: 4,
      },
    ],
  };

  const challengePopularityData = {
    labels: analyticsData.challenge_popularity ? analyticsData.challenge_popularity.map(item => item.name) : [],
    datasets: [
      {
        label: 'Solves',
        data: analyticsData.challenge_popularity ? analyticsData.challenge_popularity.map(item => item.submission_count) : [],
        backgroundColor: '#EC4899',
        borderRadius: 4,
      },
    ],
  };

  const skillBreakdownData = {
    labels: analyticsData.skill_breakdown ? analyticsData.skill_breakdown.map(item => item.category) : [],
    datasets: [
      {
        data: analyticsData.skill_breakdown ? analyticsData.skill_breakdown.map(item => item.count) : [],
        backgroundColor: [
          '#8B5CF6', '#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#6366F1'
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <AdminPageLayout title="Analytics Dashboard">
      <div className="mb-8 flex items-center justify-end">
        <select
          onChange={(e) => setDateRange(e.target.value)}
          value={dateRange}
          className="glass-input rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <StatCard title="Total Users" value={analyticsData.total_users} trend={`+${analyticsData.new_users_trend || 0}`} icon={<FaUsers />} color="blue" />
        <StatCard title="Total Machines" value={analyticsData.total_machines} trend={`+${analyticsData.new_machines_trend || 0}`} icon={<FaServer />} color="purple" />
        <StatCard title="Total Challenges" value={analyticsData.total_challenges} icon={<FaTrophy />} color="pink" />
        <StatCard title="Machine Solves" value={analyticsData.total_submissions} trend={`+${analyticsData.new_submissions_trend || 0}`} icon={<FaFlag />} color="green" />
        <StatCard title="Challenge Solves" value={analyticsData.total_challenge_solves} icon={<FaFlag />} color="yellow" />
      </div>

      {/* Row 1: Trends & Distribution */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl">
          <h3 className="mb-6 text-xl font-bold text-white flex items-center">
            <FaUsers className="mr-2 text-purple-400" /> User Registration Trends
          </h3>
          <div className="h-64">
            <Line data={userRegistrationData} options={chartOptions} />
          </div>
        </div>
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="mb-6 text-xl font-bold text-white flex items-center">
            <FaTrophy className="mr-2 text-pink-400" /> Skill Breakdown
          </h3>
          <div className="h-64 flex items-center justify-center">
            {analyticsData.skill_breakdown && analyticsData.skill_breakdown.length > 0 ? (
              <Doughnut data={skillBreakdownData} options={doughnutOptions} />
            ) : (
              <p className="text-gray-400">No skill data available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Popularity Charts */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-8">
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="mb-6 text-xl font-bold text-white flex items-center">
            <FaServer className="mr-2 text-blue-400" /> Top Machines
          </h3>
          <div className="h-64">
            {analyticsData.machine_popularity && analyticsData.machine_popularity.length > 0 ? (
              <Bar data={machinePopularityData} options={{ ...chartOptions, indexAxis: 'y' }} />
            ) : (
              <p className="text-gray-400">No machine data available.</p>
            )}
          </div>
        </div>
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="mb-6 text-xl font-bold text-white flex items-center">
            <FaTrophy className="mr-2 text-pink-400" /> Top Challenges
          </h3>
          <div className="h-64">
            {analyticsData.challenge_popularity && analyticsData.challenge_popularity.length > 0 ? (
              <Bar data={challengePopularityData} options={{ ...chartOptions, indexAxis: 'y' }} />
            ) : (
              <p className="text-gray-400">No challenge data available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Lists */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Top Users */}
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="mb-4 text-xl font-bold text-white flex items-center">
            <FaUsers className="mr-2 text-yellow-400" /> Top Users
          </h3>
          <div className="overflow-y-auto max-h-80 pr-2 custom-scrollbar">
            {analyticsData.top_users && analyticsData.top_users.length > 0 ? (
              <ul className="space-y-3">
                {analyticsData.top_users.map((u, index) => (
                  <li key={u.username} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                        index === 1 ? 'bg-gray-400/20 text-gray-300' :
                          index === 2 ? 'bg-orange-500/20 text-orange-400' :
                            'bg-gray-700 text-gray-400'
                        }`}>
                        {index + 1}
                      </div>
                      <span className="text-white font-medium">{u.username}</span>
                    </div>
                    <span className="font-bold text-purple-400">{u.score} pts</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No top users data available.</p>
            )}
          </div>
        </div>

        {/* First Blood Feed */}
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="mb-4 text-xl font-bold text-white flex items-center">
            <FaSkull className="mr-2 text-red-500" /> Recent First Bloods
          </h3>
          <div className="overflow-y-auto max-h-80 pr-2 custom-scrollbar">
            {analyticsData.recent_first_bloods && analyticsData.recent_first_bloods.length > 0 ? (
              <ul className="space-y-3">
                {analyticsData.recent_first_bloods.map((fb, index) => (
                  <li key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border-l-2 border-red-500/50">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${fb.type === 'Machine' ? 'bg-blue-500/20 text-blue-300' : 'bg-pink-500/20 text-pink-300'}`}>
                          {fb.type}
                        </span>
                        <span className="text-white font-medium">{fb.name}</span>
                      </div>
                      <p className="text-sm text-gray-400">
                        Claimed by <span className="text-red-400 font-bold">{fb.username}</span>
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(fb.timestamp).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-center py-8">No first bloods recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default AnalyticsDashboard;