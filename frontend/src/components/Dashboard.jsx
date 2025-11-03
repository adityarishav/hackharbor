import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './Notification';
import { FaSearch } from 'react-icons/fa'; // Add this import

import './Dashboard.css';

function Dashboard() {
  const [machines, setMachines] = useState([]);
  const [userScore, setUserScore] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
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

  const fetchUserRole = async () => {
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
      if (response.data.role === 'admin') {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Failed to verify admin status:', error);
      addNotification('Failed to verify admin status.', 'error');
    }
  };

  useEffect(() => {
    fetchMachines();
    fetchUserScore();
    fetchUserRole();
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
        <div className="machine-grid">
          {machines.map((machine) => (
            <div
              key={machine.id}
              className="machine-card"
              onClick={() => navigate(`/machines/${machine.id}`)}
            >
              <div className="machine-card-header">
                <h3>{machine.name}</h3>
              </div>
              <div className="machine-card-body">
                <p><strong>Category:</strong> {machine.category || 'N/A'}</p>
                <p><strong>Difficulty:</strong> {machine.difficulty || 'N/A'}</p>
                <p><strong>Status: </strong>
                  {machine.ip_address ? (
                    <span className="status-running">Running</span>
                  ) : (
                    <span className="status-stopped">Stopped</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;