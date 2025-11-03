import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from './Notification';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode

function MachineDetail() {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const showNotification = useNotification();
  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [flagsStatus, setFlagsStatus] = useState([]);
  const [flagInputs, setFlagInputs] = useState({}); // To manage individual flag input states
  const [activeTab, setActiveTab] = useState('info'); // 'info' or 'changelog'
  const [changelogEntries, setChangelogEntries] = useState([]);
  const [newChangelogEntry, setNewChangelogEntry] = useState('');
  const [isAdmin, setIsAdmin] = useState(false); // State to hold admin status
  const [currentUserId, setCurrentUserId] = useState(null); // State to hold current user's ID
  const [hasClickedStart, setHasClickedStart] = useState(false); // New state for revealing status

  const fetchMachineDetails = async () => {
    try {
      setLoading(true);
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
      setMachine(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch machine details:', err);
      setError('Failed to load machine details. Please try again.');
      if (err.response && err.response.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFlagsStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await api.get(`/machines/${machineId}/flags_status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFlagsStatus(response.data);
      // Initialize flag inputs
      const initialFlagInputs = {};
      response.data.forEach(flag => {
        initialFlagInputs[flag.id] = '';
      });
      setFlagInputs(initialFlagInputs);
    } catch (err) {
      console.error('Failed to fetch flag status:', err);
      showNotification('Failed to fetch flag status.', 'error');
    }
  };

  const fetchChangelogEntries = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await api.get(`/machines/${machineId}/changelog`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setChangelogEntries(response.data);
    } catch (err) {
      console.error('Failed to fetch changelog entries:', err);
      showNotification('Failed to fetch changelog entries.', 'error');
    }
  };

  useEffect(() => {
    fetchMachineDetails();
    fetchFlagsStatus();
    fetchChangelogEntries();

    // Determine if user is admin
    const token = localStorage.getItem('access_token');
    let userId = null; // Declare userId here
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        userId = decodedToken.id; // Get user ID from token
        if (decodedToken.role === 'admin') {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
    setCurrentUserId(userId); // Set currentUserId state
  }, [machineId, navigate]);

  useEffect(() => {
    if (machine && currentUserId && machine.ip_address && machine.active_users && machine.active_users.some(user => user.id === currentUserId)) {
      setHasClickedStart(true);
    } else {
      setHasClickedStart(false);
    }
  }, [machine, currentUserId]); // Run when machine or currentUserId changes

  const handleStartMachine = async () => {
    setIsStarting(true);
    try {
      const token = localStorage.getItem('access_token');
      await api.post(`/machines/${machine.id}/start`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      showNotification('Machine started!', 'success');
      fetchMachineDetails(); // Re-fetch machine details to update IP address
      setHasClickedStart(true); // Set this to true after successful start
      setHasClickedStart(true); // Set this to true after successful start
    } catch (err) {
      console.error('Failed to start machine:', err);
      showNotification(err.response?.data?.detail || 'Failed to start machine!', 'error');
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopMachine = async () => {
    setIsStopping(true);
    try {
      const token = localStorage.getItem('access_token');
      await api.post(`/machines/${machine.id}/stop`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      showNotification('Machine stopped and removed!', 'success');
      fetchMachineDetails(); // Re-fetch machine details to clear IP address
      setHasClickedStart(false); // Hide the IP after stopping
    } catch (err) {
      console.error('Failed to stop machine:', err);
      showNotification(err.response?.data?.detail || 'Failed to stop machine!', 'error');
    } finally {
      setIsStopping(false);
    }
  };

  const handleRestartMachine = async () => {
    setIsRestarting(true);
    try {
      const token = localStorage.getItem('access_token');
      await api.post(`/machines/${machine.id}/restart`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      showNotification('Machine restarted!', 'success');
      fetchMachineDetails(); // Re-fetch machine details to update IP address
    } catch (err) {
      console.error('Failed to restart machine:', err);
      showNotification(err.response?.data?.detail || 'Failed to restart machine!', 'error');
    } finally {
      setIsRestarting(false);
    }
  };

  const handleFlagInputChange = (flagId, e) => {
    setFlagInputs({ ...flagInputs, [flagId]: e.target.value });
  };

  const handleSubmitFlag = async (flagId) => {
    const flagValue = flagInputs[flagId];
    if (!flagValue) {
      showNotification('Flag cannot be empty.', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      await api.post('/submissions/', { machine_id: machine.id, flag: flagValue }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      showNotification('Flag submitted successfully!', 'success');
      fetchFlagsStatus(); // Re-fetch flag status to update UI
      setFlagInputs({ ...flagInputs, [flagId]: '' }); // Clear input after submission
    } catch (err) {
      console.error('Flag submission failed:', err);
      showNotification(err.response?.data?.detail || 'Flag submission failed!', 'error');
    }
  };

  const handleAddChangelogEntry = async () => {
    if (!newChangelogEntry.trim()) {
      showNotification('Changelog entry cannot be empty.', 'error');
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      await api.post(`/admin/machines/${machineId}/changelog`, { description: newChangelogEntry }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      showNotification('Changelog entry added successfully!', 'success');
      setNewChangelogEntry('');
      fetchChangelogEntries(); // Re-fetch changelog entries to update the list
    } catch (err) {
      console.error('Failed to add changelog entry:', err);
      showNotification(err.response?.data?.detail || 'Failed to add changelog entry!', 'error');
    }
  };

  if (loading) {
    return <div>Loading machine details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!machine) {
    return <div>Machine not found.</div>;
  }

  const buttonStyle = {
    padding: '10px 20px',
    margin: '5px',
    borderRadius: '5px',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
  };

  const startButtonStyle = { ...buttonStyle, backgroundColor: '#4CAF50' }; // Green
  const stopButtonStyle = { ...buttonStyle, backgroundColor: '#F44336' };  // Red
  const restartButtonStyle = { ...buttonStyle, backgroundColor: '#FF9800' }; // Orange
  const submitFlagButtonStyle = { ...buttonStyle, backgroundColor: '#2196F3' }; // Blue

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px', padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        Back to Dashboard
      </button>
      <h2>{machine.name}</h2>

      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ccc' }}>
        <button
          onClick={() => setActiveTab('info')}
          style={{
            padding: '10px 15px',
            border: 'none',
            borderBottom: activeTab === 'info' ? '2px solid #007bff' : 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '16px',
            marginRight: '10px',
            color: activeTab === 'info' ? '#007bff' : '#333',
            fontWeight: activeTab === 'info' ? 'bold' : 'normal',
          }}
        >
          Machine Info
        </button>
        <button
          onClick={() => setActiveTab('changelog')}
          style={{
            padding: '10px 15px',
            border: 'none',
            borderBottom: activeTab === 'changelog' ? '2px solid #007bff' : 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '16px',
            color: activeTab === 'changelog' ? '#007bff' : '#333',
            fontWeight: activeTab === 'changelog' ? 'bold' : 'normal',
          }}
        >
          Changelog
        </button>
      </div>

      {activeTab === 'info' && (
        <div>
          <p><strong>Description:</strong> {machine.description}</p>
          <p><strong>Provider:</strong> {machine.provider}</p>
          <p><strong>Source Identifier:</strong> {machine.source_identifier}</p>
          {machine.category && <p><strong>Category:</strong> {machine.category}</p>}
          {machine.difficulty && <p><strong>Difficulty:</strong> {machine.difficulty}</p>}
          {machine.ip_address && hasClickedStart ? (
            <p style={{ color: 'green' }}><strong>Status:</strong> Running (IP: {machine.ip_address})</p>
          ) : (
            <p style={{ color: 'red' }}><strong>Status:</strong> Stopped</p>
          )}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={handleStartMachine}
              disabled={isStarting || isStopping || isRestarting || hasClickedStart}
              style={startButtonStyle}
            >
              {isStarting ? 'Starting...' : `Start ${machine.provider === 'docker' ? 'Docker Container' : 'VirtualBox VM'}`}
            </button>
            <button
              onClick={handleStopMachine}
              disabled={isStarting || isStopping || isRestarting || !hasClickedStart}
              style={stopButtonStyle}
            >
              {isStopping ? 'Stopping...' : 'Stop Machine'}
            </button>
            <button
              onClick={handleRestartMachine}
              disabled={isStarting || isStopping || isRestarting}
              style={restartButtonStyle}
            >
              {isRestarting ? 'Restarting...' : 'Restart Machine'}
            </button>
          </div>

          <h3>Flags:</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {flagsStatus.length === 0 ? (
              <p>No flags defined for this machine.</p>
            ) : (
              flagsStatus.map((flag) => (
                <div key={flag.id} style={{ border: '1px solid #eee', padding: '10px', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <p style={{ margin: '0' }}>Flag:</p>
                  {flag.is_submitted ? (
                    <span style={{ color: 'green', fontWeight: 'bold' }}>Submitted!</span>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Enter flag"
                        value={flagInputs[flag.id] || ''}
                        onChange={(e) => handleFlagInputChange(flag.id, e)}
                        style={{ flexGrow: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                      <button
                        onClick={() => handleSubmitFlag(flag.id)}
                        disabled={!flagInputs[flag.id] || isStarting || isStopping || isRestarting}
                        style={submitFlagButtonStyle}
                      >
                        Submit Flag
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'changelog' && (
        <div>
          <h3>Changelog Entries:</h3>
          {isAdmin && (
            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
              <h4>Add New Changelog Entry</h4>
              <textarea
                value={newChangelogEntry}
                onChange={(e) => setNewChangelogEntry(e.target.value)}
                placeholder="Enter changelog description"
                rows="4"
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '10px', resize: 'vertical' }}
              ></textarea>
              <button onClick={handleAddChangelogEntry} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Add Entry
              </button>
            </div>
          )}
          {changelogEntries.length === 0 ? (
            <p>No changelog entries for this machine.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {changelogEntries.map((entry) => (
                <div key={entry.id} style={{ padding: '10px', border: '1px solid #eee', borderRadius: '5px', backgroundColor: '#fff' }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{new Date(entry.timestamp).toLocaleString()}</p>
                  <p style={{ margin: '0' }}>{entry.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MachineDetail;
