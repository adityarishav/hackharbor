import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from './Notification';

function EditMachine() {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const addNotification = useNotification();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceIdentifier, setSourceIdentifier] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [flags, setFlags] = useState([{ flag: '' }]);

  useEffect(() => {
    const fetchMachineDetails = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await api.get(`/machines/${machineId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const machine = response.data;
        setName(machine.name);
        setDescription(machine.description || '');
        setSourceIdentifier(machine.source_identifier || '');
        setCategory(machine.category || '');
        setDifficulty(machine.difficulty || '');
        if (machine.flags && machine.flags.length > 0) {
          setFlags(machine.flags.map(f => ({ flag: f.flag })));
        } else {
          setFlags([{ flag: '' }]);
        }
      } catch (error) {
        console.error('Failed to fetch machine details:', error);
        addNotification('Failed to load machine details.', 'error');
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          navigate('/login');
        }
      }
    };
    fetchMachineDetails();
  }, [machineId, navigate, addNotification]);

  const handleFlagChange = (index, value) => {
    const newFlags = [...flags];
    newFlags[index].flag = value;
    setFlags(newFlags);
  };

  const handleAddFlag = () => {
    setFlags([...flags, { flag: '' }]);
  };

  const handleRemoveFlag = (index) => {
    const newFlags = flags.filter((_, i) => i !== index);
    setFlags(newFlags.length > 0 ? newFlags : [{ flag: '' }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const machineData = {
        name,
        description,
        source_identifier: sourceIdentifier,
        category,
        difficulty,
        flags: flags.filter(f => f.flag.trim() !== ''),
      };
      await api.put(`/admin/machines/${machineId}`, machineData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      addNotification('Machine updated successfully!', 'success');
      navigate('/admin');
    } catch (error) {
      console.error('Failed to update machine:', error);
      let errorMessage = 'Failed to update machine!';
      if (error.response && error.response.data && error.response.data.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map(err => `${err.loc.join('.')} - ${err.msg}`).join('; ');
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        }
      }
      addNotification(errorMessage, 'error');
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        navigate('/login');
      }
    }
  };

  return (
    <div className="admin-container">
      <h1>Edit Machine</h1>
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-group">
          <label>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
        </div>

        <div className="form-group">
          <label>Docker Image</label>
          <input type="text" value={sourceIdentifier} onChange={(e) => setSourceIdentifier(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Category</label>
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Difficulty</label>
          <input type="text" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} />
        </div>

        <h2>Flags</h2>
        {flags.map((flag, index) => (
          <div key={index} className="form-group flag-input-group">
            <input
              type="text"
              placeholder={`Flag ${index + 1}`}
              value={flag.flag}
              onChange={(e) => handleFlagChange(index, e.target.value)}
            />
            {flags.length > 1 && (
              <button type="button" onClick={() => handleRemoveFlag(index)} className="btn btn-danger btn-sm">
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={handleAddFlag} className="btn btn-secondary">
          Add Flag
        </button>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">Update Machine</button>
          <button type="button" onClick={() => navigate('/admin')} className="btn btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default EditMachine;
