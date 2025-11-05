import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { useNotification } from './Notification';
import { FaEdit, FaTrash } from 'react-icons/fa';

const MachineTable = () => {
  const navigate = useNavigate();
  const addNotification = useNotification();
  const [machines, setMachines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [osFilter, setOsFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  const fetchMachines = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await apiClient.get('/admin/machines/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMachines(response.data);
    } catch (error) {
      console.error('Failed to fetch machines:', error);
      addNotification('Failed to fetch machines.', 'error');
    }
  };

  const handleDeleteMachine = async (machineId) => {
    if (window.confirm('Are you sure you want to delete this machine? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('access_token');
        await apiClient.delete(`/admin/machines/${machineId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        addNotification('Machine deleted successfully!', 'success');
        fetchMachines();
      } catch (error) {
        console.error('Failed to delete machine:', error);
        addNotification('Failed to delete machine!', 'error');
      }
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const filteredMachines = machines
    .filter(machine => machine.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(machine => osFilter ? machine.operating_system === osFilter : true)
    .filter(machine => difficultyFilter ? machine.difficulty === difficultyFilter : true);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <input
          type="text"
          placeholder="Search by name..."
          className="rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-4">
          <select
            className="rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
            onChange={(e) => setOsFilter(e.target.value)}
          >
            <option value="">All OS</option>
            <option value="Linux">Linux</option>
            <option value="Windows">Windows</option>
          </select>
          <select
            className="rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Insane">Insane</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg bg-gray-800">
        {filteredMachines.length === 0 ? (
          <p className="p-6 text-center text-gray-400">No machines match your criteria.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">OS</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Difficulty</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Solves</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 bg-gray-900">
              {filteredMachines.map((machine) => (
                <tr key={machine.id} className={`${machine.is_deleted ? 'opacity-50' : ''}`}>
                  <td className="whitespace-nowrap px-6 py-4">{machine.name}</td>
                  <td className="whitespace-nowrap px-6 py-4">{machine.operating_system || 'N/A'}</td>
                  <td className="whitespace-nowrap px-6 py-4">{machine.difficulty || 'N/A'}</td>
                  <td className="whitespace-nowrap px-6 py-4">{machine.category || 'N/A'}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${machine.is_deleted ? 'bg-red-600/50 text-red-200' : 'bg-green-600/50 text-green-200'}`}>
                      {machine.is_deleted ? 'Deleted' : 'Active'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">{machine.solves || 0}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/admin/edit-machine/${machine.id}`)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteMachine(machine.id)}
                      className="ml-4 text-red-400 hover:text-red-300"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MachineTable;