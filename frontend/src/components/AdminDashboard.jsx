import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from './Notification';

import './AdminDashboard.css';

function AdminDashboard() {
    const navigate = useNavigate();
    const { addNotification } = useNotification();

    
  const [machines, setMachines] = useState([]);

  const fetchMachines = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await api.get('/admin/machines/all', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMachines(response.data);
    } catch (error) {
      console.error('Failed to fetch machines:', error);
      addNotification('Failed to fetch machines.', 'error');
      if (error.response && error.response.status === 401 || error.response.status === 403) {
        navigate('/login'); // Redirect if not authorized
      }
    }
  };

  const handleDeleteMachine = async (machineId) => {
    if (window.confirm('Are you sure you want to delete this machine? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('access_token');
        await api.delete(`/admin/machines/${machineId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        addNotification('Machine deleted successfully!', 'success');
        fetchMachines(); // Refresh the list
      } catch (error) {
        console.error('Failed to delete machine:', error);
        addNotification('Failed to delete machine!', 'error');
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          navigate('/login');
        }
      }
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
    fetchMachines();
  }, [navigate]);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
      </div>

      <div className="admin-navigation">
        <button onClick={() => navigate('/admin/add-machine')} className="btn btn-primary">Add New Machine</button>
        <button onClick={() => navigate('/admin/analytics')} className="btn btn-primary">View Analytics</button>
      </div>

      <div className="admin-section">
        <h2>Existing Machines</h2>
        {machines.length === 0 ? (
          <p className="no-machines">No machines have been added yet.</p>
        ) : (
          <table className="machines-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Docker Image</th>
                <th>Category</th>
                <th>Difficulty</th>
                <th>Status</th> {/* New */}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((machine) => (
                <tr key={machine.id} className={machine.is_deleted ? 'deleted-machine' : ''}> {/* New class */}
                  <td>{machine.name}</td>
                  <td>{machine.docker_image}</td>
                  <td>{machine.category || 'N/A'}</td>
                  <td>{machine.difficulty || 'N/A'}</td>
                  <td>{machine.is_deleted ? 'Deleted' : 'Active'}</td> {/* New */}
                  <td> {/* New */}
                    <button
                      className="btn btn-sm btn-warning" // Assuming btn-warning for edit
                      onClick={() => navigate(`/admin/edit-machine/${machine.id}`)} // Placeholder for edit
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger" // Assuming btn-danger for delete
                      onClick={() => handleDeleteMachine(machine.id)} // Implement this function
                      style={{ marginLeft: '5px' }}
                    >
                      Delete
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
}

export default AdminDashboard;