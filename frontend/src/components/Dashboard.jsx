import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './Notification';
import { FaSearch } from 'react-icons/fa'; // Add this import
import MachineCard from './MachineCard'; // Import MachineCard

import './Dashboard.css';

function Dashboard() {
  const [machines, setMachines] = useState([]);
  const [userScore, setUserScore] = useState(0);
  const navigate = useNavigate();
  const addNotification = useNotification();

  const fetchMachines = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await api.get('/machines/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMachines(response.data);
    } catch (error) {
      console.error('Failed to fetch machines:', error);
      addNotification('Failed to fetch machines.', 'error');
      if (error.response && error.response.status === 401) {
        navigate('/login');
      }
    }
  };

  const fetchUserScore = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await api.get('/users/me/score', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUserScore(response.data.score);
    } catch (error) {
      console.error('Failed to fetch user score:', error);
      addNotification('Failed to fetch user score.', 'error');
    }
  };

  useEffect(() => {
    fetchMachines();
    fetchUserScore();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
    addNotification('Logged out successfully.', 'info');
  };

  const handleDownloadVpnConfig = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.post('/vpn/generate-config', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob', // Important for downloading files
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'client.ovpn');
      document.body.appendChild(link);
      link.click();
      link.remove();
      addNotification('VPN config downloaded!', 'success');
    } catch (error) {
      console.error('Failed to download VPN config:', error);
      addNotification('Failed to download VPN config!', 'error');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center' }}> {/* New flex container */}
          <h1 style={{marginRight: '10px'}}>Machines</h1>
          {/* Search Box */}
          <div className="search-box">
              <input type="text" placeholder="Search machines..." />
              <FaSearch className="search-icon" />
          </div>
        </div>
        <div className="dashboard-actions">
          <div className="user-score">Your Score: <span>{userScore}</span></div>
          <button onClick={handleDownloadVpnConfig} className="btn btn-primary">Download VPN</button>
        </div>
      </div>

      {machines.length === 0 ? (
        <p>No machines available at the moment. Check back later!</p>
      ) : (
        <div className="machine-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines.map((machine) => (
            <MachineCard key={machine.id} machine={machine} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;