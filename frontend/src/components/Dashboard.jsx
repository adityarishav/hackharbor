import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './Notification';
import { FaSearch } from 'react-icons/fa'; // Add this import
import MachineCard from './MachineCard'; // Import MachineCard

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
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold mr-4">Machines</h1>
          <div className="flex items-center bg-gray-700 rounded-md px-3">
            <input type="text" placeholder="Search machines..." className="bg-transparent text-white outline-none flex-grow p-2" />
            <FaSearch className="text-gray-400 ml-2" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold text-white">Your Score: <span className="text-purple-400">{userScore}</span></div>
          <button onClick={handleDownloadVpnConfig} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">Download VPN</button>
        </div>
      </div>

      {machines.length === 0 ? (
        <p>No machines available at the moment. Check back later!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines.map((machine) => (
            <MachineCard key={machine.id} machine={machine} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
