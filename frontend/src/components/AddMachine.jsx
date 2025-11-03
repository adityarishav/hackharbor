import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from './Notification';

import './AddMachine.css';

function AddMachine() {
  const navigate = useNavigate();
  const showNotification = useNotification();
  const [newMachine, setNewMachine] = useState({
    name: '',
    description: '',
    source_identifier: '',
    category: '',
    difficulty: '',
    flags: [{ flag: '' }],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMachine({ ...newMachine, [name]: value });
  };

  const handleFlagChange = (index, e) => {
    const newFlags = [...newMachine.flags];
    newFlags[index].flag = e.target.value;
    setNewMachine({ ...newMachine, flags: newFlags });
  };

  const handleAddFlagField = () => {
    setNewMachine({ ...newMachine, flags: [...newMachine.flags, { flag: '' }] });
  };

  const handleRemoveFlagField = (index) => {
    const newFlags = [...newMachine.flags];
    newFlags.splice(index, 1);
    setNewMachine({ ...newMachine, flags: newFlags });
  };

  const handleAddMachine = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      
      const machineData = {
        ...newMachine,
        flags: newMachine.flags.filter(f => f.flag.trim() !== ''),
      };

      await api.post('/admin/machines/', machineData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      showNotification('Machine added successfully!', 'success');
      // Reset form
      setNewMachine({
        name: '',
        description: '',
        source_identifier: '',
        category: '',
        difficulty: '',
        flags: [{ flag: '' }],
      });
    } catch (error) {
      console.error('Failed to add machine:', error);
      let errorMessage = 'Failed to add machine!';
      if (error.response && error.response.data && error.response.data.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map(err => `${err.loc.join('.')} - ${err.msg}`).join('; ');
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        }
      }
      showNotification(errorMessage, 'error');
    }
  };

  return (
    <div className="add-machine-container">
      <div className="add-machine-header">
        <h1>Add New Machine</h1>
      </div>
      <form onSubmit={handleAddMachine} className="add-machine-form">
        <div className="form-group">
          <label>Machine Name</label>
          <input type="text" name="name" value={newMachine.name} onChange={handleInputChange} required />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea name="description" value={newMachine.description} onChange={handleInputChange}></textarea>
        </div>

        <div className="form-group">
          <label>Docker Image</label>
          <input type="text" name="source_identifier" placeholder="e.g., vuln-app:latest" value={newMachine.source_identifier} onChange={handleInputChange} required />
        </div>

        <div className="form-group">
          <label>Category</label>
          <input type="text" name="category" placeholder="e.g., Web, Pwn" value={newMachine.category} onChange={handleInputChange} />
        </div>
        <div className="form-group">
          <label>Difficulty</label>
          <input type="text" name="difficulty" placeholder="e.g., Easy, Medium" value={newMachine.difficulty} onChange={handleInputChange} />
        </div>

        <div className="flags-section">
          <h3>Flags</h3>
          {newMachine.flags.map((flag, index) => (
            <div key={index} className="flag-input-group">
              <input type="text" placeholder={`Flag ${index + 1}`} value={flag.flag} onChange={(e) => handleFlagChange(index, e)} required />
              {newMachine.flags.length > 1 && (
                <button type="button" onClick={() => handleRemoveFlagField(index)} className="btn btn-danger">Remove</button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddFlagField} className="btn">Add Flag Field</button>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/admin')} className="btn">Cancel</button>
          <button type="submit" className="btn btn-primary">Add Machine</button>
        </div>
      </form>
    </div>
  );
}

export default AddMachine;