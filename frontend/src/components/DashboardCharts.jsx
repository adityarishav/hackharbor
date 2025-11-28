import React, { useState, useEffect } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const DashboardCharts = () => {
  const [userRegistrationData, setUserRegistrationData] = useState({ labels: [], datasets: [] });
  const [machineDistributionData, setMachineDistributionData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await api.get('/admin/analytics', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const analyticsData = response.data;

        // User Registration Data
        if (analyticsData.user_registration_trends && analyticsData.user_registration_trends.length > 0) {
          setUserRegistrationData({
            labels: analyticsData.user_registration_trends.map(item => new Date(item.date).toLocaleDateString()),
            datasets: [
              {
                label: 'New Users',
                data: analyticsData.user_registration_trends.map(item => item.count),
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                tension: 0.4,
              },
            ],
          });
        } else {
          setUserRegistrationData({ labels: [], datasets: [] });
        }

        // Machine Distribution Data
        try {
          const token = localStorage.getItem('access_token');
          const difficultyResponse = await api.get('/admin/machines/difficulty_distribution', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const difficultyData = difficultyResponse.data;

          // if (difficultyData && difficultyData.length > 0) {
          //   setMachineDistributionData({
          //     labels: difficultyData.map(item => item.difficulty),
          //     datasets: [
          //       {
          //         label: 'Machine Distribution',
          //         data: difficultyData.map(item => item.count),
          //         backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'], 
          //         borderColor: ['#059669', '#D97706', '#DC2626', '#7C3AED'],
          //         borderWidth: 1,
          //       },
          //     ],
          //   });
          const difficultyColors = {
            Easy:   { bg: '#10B981', border: '#059669' }, 
            Medium: { bg: '#F59E0B', border: '#D97706' }, 
            Hard:   { bg: '#5134e2ff', border: '#5134e2ff' }, 
            Insane: { bg: '#e60808ff', border: '#e60808ff' } 
          };

          if (difficultyData && difficultyData.length > 0) {
            setMachineDistributionData({
              labels: difficultyData.map(item => item.difficulty),
              datasets: [
                {
                  label: 'Machine Distribution',
                  data: difficultyData.map(item => item.count),
                  
                  // 2. Map through the data and lookup the color by difficulty name
                  backgroundColor: difficultyData.map(item => 
                    difficultyColors[item.difficulty]?.bg || '#CCCCCC' // Fallback color
                  ),
                  borderColor: difficultyData.map(item => 
                    difficultyColors[item.difficulty]?.border || '#999999' // Fallback border
                  ),
                  
                  borderWidth: 1,
                },
              ],
            });
          } else {
            setMachineDistributionData({ labels: [], datasets: [] });
          }
        } catch (error) {
          console.error('Failed to fetch machine difficulty distribution:', error);
        }

      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      }
    };

    fetchChartData();
  }, []);

  const chartOptions = {
    plugins: {
      legend: {
        labels: {
          color: '#D1D5DB', // Light gray for legend text
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#9CA3AF', // Medium gray for x-axis labels
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)', // Subtle grid lines
        },
      },
      y: {
        ticks: {
          color: '#9CA3AF', // Medium gray for y-axis labels
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)', // Subtle grid lines
        },
      },
    },
  };

  return (
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="rounded-lg bg-gray-800 p-6">
        <h3 className="mb-4 text-xl font-bold text-white">User Registrations (Last 30 Days)</h3>
        <Line data={userRegistrationData} options={chartOptions} />
      </div>
      <div className="rounded-lg bg-gray-800 p-6">
        <h3 className="mb-4 text-xl font-bold text-white">Machine Distribution</h3>
        <Doughnut data={machineDistributionData} options={{ plugins: { legend: { labels: { color: '#D1D5DB' } } } }} />
      </div>
    </div>
  );
};

export default DashboardCharts;