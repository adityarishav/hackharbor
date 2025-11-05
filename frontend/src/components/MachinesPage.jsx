import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from './Notification';
import MachineCard from './MachineCard';
import { AuthContext } from '../contexts/AuthContext';

const MachinesPage = () => {
  const [machines, setMachines] = useState([]);
  const navigate = useNavigate();
  const addNotification = useNotification();
  const { user } = useContext(AuthContext); // Get user from AuthContext

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }

        let apiUrl = '/machines/';
        const params = {};

        if (user && user.role === 'admin') {
          // Admins can see all machines, including deleted ones
          params.show_deleted = true;
        }
        // For normal users, the backend will default to showing only active machines

        const response = await api.get(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: params,
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

    if (user) { // Only fetch if user context is available
      fetchMachines();
    }
  }, [navigate, addNotification, user]); // Depend on user to re-fetch when role is known

  return (
    <div className="machines-page-container p-6">
      <h1 className="text-4xl font-bold mb-6 text-purple-400">Machines</h1>
      {machines.length === 0 ? (
        <p className="text-gray-400">No machines available at the moment.</p>
      ) : (
        <div className="machine-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines.map((machine) => (
            <MachineCard key={machine.id} machine={machine} isAdmin={user && user.role === 'admin'} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MachinesPage;
