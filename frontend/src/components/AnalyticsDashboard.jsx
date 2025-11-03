import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from './Notification';
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
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

import './AnalyticsDashboard.css';

ChartJS.defaults.color = '#c5c6c7';
ChartJS.defaults.borderColor = '#2a2e33';

function AnalyticsDashboard() {
  const navigate = useNavigate();
  const addNotification = useNotification();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await api.get('/admin/analytics', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAnalyticsData(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
      if (err.response && err.response.status === 401 || err.response.status === 403) {
        addNotification('Access Denied: Not authorized for analytics.', 'error');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is admin on component mount
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await api.get('/users/me/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data.role !== 'admin') {
          addNotification('Access Denied: Not an administrator.', 'error');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Failed to verify admin status:', error);
        addNotification('Failed to verify admin status.', 'error');
        navigate('/login');
      }
    };
    checkAdmin();
    fetchAnalyticsData();
  }, [navigate]);

  if (loading) {
    return <div>Loading analytics data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!analyticsData) {
    return <div>No analytics data available.</div>;
  }

  // Define KPIs based on analyticsData
  const kpis = analyticsData ? [
    { title: 'Total Users', value: analyticsData.total_users || 0 },
    { title: 'Total Machines', value: analyticsData.total_machines || 0 },
    { title: 'Total Submissions', value: analyticsData.total_submissions || 0 },
  ] : [];

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#c5c6c7',
        },
      },
      title: {
        display: false,
        text: 'Chart Title',
        color: '#c5c6c7',
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#c5c6c7',
        },
        grid: {
          color: '#2a2e33',
        },
      },
      y: {
        ticks: {
          color: '#c5c6c7',
        },
        grid: {
          color: '#2a2e33',
        },
      },
    },
  };

  // Prepare data for charts
  const userRegistrationData = {
    labels: analyticsData.user_registration_trends.map(item => item.date),
    datasets: [
      {
        label: 'New Users',
        data: analyticsData.user_registration_trends.map(item => item.count),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const submissionTrendsData = {
    labels: analyticsData.submission_trends.map(item => item.date),
    datasets: [
      {
        label: 'Submissions',
        data: analyticsData.submission_trends.map(item => item.count),
        fill: false,
        borderColor: 'rgb(153, 102, 255)',
        tension: 0.1,
      },
    ],
  };

  const machinePopularityData = {
    labels: analyticsData.machine_popularity.map(item => item.name),
    datasets: [
      {
        label: 'Submissions',
        data: analyticsData.machine_popularity.map(item => item.submission_count),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const completionRatesData = {
    labels: analyticsData.machine_completion_rates.map(item => item.name),
    datasets: [
      {
        label: 'Completion Rate (%)',
        data: analyticsData.machine_completion_rates.map(item => item.completion_rate),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 159, 64, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
      </div>

      <div className="kpi-grid">
        {kpis.map(kpi => (
          <div key={kpi.title} className="kpi-card">
            <h3>{kpi.title}</h3>
            <p>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>User Registration Trends</h3>
          <Line options={chartOptions} data={{
            labels: analyticsData.user_registration_trends.map(item => item.date),
            datasets: [{
              label: 'New Users',
              data: analyticsData.user_registration_trends.map(item => item.count),
              borderColor: '#6a44ff',
              backgroundColor: 'rgba(106, 68, 255, 0.2)',
              fill: true,
            }]
          }} />
        </div>

        <div className="chart-container">
          <h3>Machine Popularity</h3>
          <Bar options={chartOptions} data={{
            labels: analyticsData.machine_popularity.map(item => item.name),
            datasets: [{
              label: 'Submissions',
              data: analyticsData.machine_popularity.map(item => item.submission_count),
              backgroundColor: '#ff6384',
            }]
          }} />
        </div>

        <div className="chart-container">
          <h3>Machine Completion Rates</h3>
          <Doughnut options={{ plugins: { legend: { position: 'right', labels: { color: '#c5c6c7' } } } }} data={{
            labels: analyticsData.machine_completion_rates.map(item => item.name),
            datasets: [{
              data: analyticsData.machine_completion_rates.map(item => item.completion_rate),
              backgroundColor: ['#36a2eb', '#ffcd56', '#4bc0c0', '#9966ff', '#ff9f40'],
            }]
          }} />
        </div>

        <div className="chart-container">
          <h3>Top Users by Submissions</h3>
          <ul>
            {analyticsData.top_users.map(user => (
              <li key={user.username}>{user.username}: <strong>{user.submission_count}</strong></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;