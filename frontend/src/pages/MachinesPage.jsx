import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from '../components/Notification';
import MachineCard from '../components/MachineCard';
import { AuthContext } from '../contexts/AuthContext';

const MachinesPage = () => {
  const [machines, setMachines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const navigate = useNavigate();
  const addNotification = useNotification();
  const { user } = useContext(AuthContext);

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
        const allMachines = response.data;
        setMachines(allMachines);

        // Extract unique categories
        const uniqueCategories = ['All', ...new Set(allMachines.map(m => m.category || 'Uncategorized'))];
        setCategories(uniqueCategories);

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

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
  };

  const filteredMachines = selectedCategory === 'All'
    ? machines
    : machines.filter(m => (m.category || 'Uncategorized') === selectedCategory);

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 neon-text">Machines</h1>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-3 mb-8 glass-panel p-4 rounded-xl inline-flex">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => handleCategoryFilter(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${selectedCategory === category
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}>
            {category}
          </button>
        ))}
      </div>

      {filteredMachines.length === 0 ? (
        <div className="glass-panel p-8 rounded-xl text-center">
          <p className="text-gray-400 text-lg">No machines available in this category.</p>
        </div>
      ) : (
        <div className="machine-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMachines.map((machine) => (
            <MachineCard key={machine.id} machine={machine} isAdmin={user && user.role === 'admin'} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MachinesPage;
