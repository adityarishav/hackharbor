import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from './Notification';
import { jwtDecode } from 'jwt-decode';
import { FaPlay, FaStop, FaRedo, FaFlag, FaInfoCircle, FaHistory, FaPlus, FaLinux, FaWindows, FaArrowLeft } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [flagInputs, setFlagInputs] = useState({});
  const [activeTab, setActiveTab] = useState('info');
  const [changelogEntries, setChangelogEntries] = useState([]);
  const [newChangelogEntry, setNewChangelogEntry] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [hasClickedStart, setHasClickedStart] = useState(false);

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

    const token = localStorage.getItem('access_token');
    let userId = null;
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        userId = decodedToken.id;
        if (decodedToken.role === 'admin') {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
    setCurrentUserId(userId);
  }, [machineId, navigate]);

  useEffect(() => {
    if (machine && currentUserId && machine.ip_address && machine.active_users && machine.active_users.some(user => user.id === currentUserId)) {
      setHasClickedStart(true);
    } else {
      setHasClickedStart(false);
    }
  }, [machine, currentUserId]);

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
      fetchMachineDetails();
      setHasClickedStart(true);
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
      showNotification('Machine stopped!', 'success');
      fetchMachineDetails();
      setHasClickedStart(false);
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
      fetchMachineDetails();
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
      fetchFlagsStatus();
      setFlagInputs({ ...flagInputs, [flagId]: '' });
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
      fetchChangelogEntries();
    } catch (err) {
      console.error('Failed to add changelog entry:', err);
      showNotification(err.response?.data?.detail || 'Failed to add changelog entry!', 'error');
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Loading machine details...</div>;
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-500">Error: {error}</div>;
  }

  if (!machine) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-gray-400">Machine not found.</div>;
  }

  const difficultyColors = {
    Easy: 'bg-green-500',
    Medium: 'bg-yellow-500',
    Hard: 'bg-red-500',
    Insane: 'bg-purple-500',
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <button
        onClick={() => navigate('/machines')}
        className="mb-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition-colors flex items-center"
      >
        <FaArrowLeft className="mr-2" /> Back to Machines
      </button>

      <div className="bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
        <h2 className="text-4xl font-bold mb-4 text-purple-400">{machine.name}</h2>
        <div className="flex items-center space-x-4 mb-6">
          <span
            className={`px-4 py-1 rounded-full text-sm font-semibold ${
              difficultyColors[machine.difficulty] || 'bg-gray-600'
            }`}
          >
            {machine.difficulty}
          </span>
          <span className="text-gray-400 text-sm flex items-center">
            {machine.operating_system === 'Linux' && <FaLinux className="mr-2" />}
            {machine.operating_system === 'Windows' && <FaWindows className="mr-2" />}
            {machine.operating_system || 'N/A'}
          </span>
          {machine.ip_address && hasClickedStart ? (
            <span className="text-green-500 font-semibold flex items-center">
              <FaPlay className="mr-2" /> Running (IP: {machine.ip_address})
            </span>
          ) : (
            <span className="text-red-500 font-semibold flex items-center">
              <FaStop className="mr-2" /> Stopped
            </span>
          )}
        </div>
        <p className="text-gray-300 mb-6 leading-relaxed">{machine.description}</p>

        <div className="flex space-x-4 mb-8">
          <button
            onClick={handleStartMachine}
            disabled={isStarting || isStopping || isRestarting || hasClickedStart}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-md text-white font-semibold transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? 'Starting...' : <><FaPlay className="mr-2" /> Start {machine.provider === 'docker' ? 'Container' : 'VM'}</>}
          </button>
          <button
            onClick={handleStopMachine}
            disabled={isStarting || isStopping || isRestarting || !hasClickedStart}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-md text-white font-semibold transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStopping ? 'Stopping...' : <><FaStop className="mr-2" /> Stop Machine</>}
          </button>
          <button
            onClick={handleRestartMachine}
            disabled={isStarting || isStopping || isRestarting}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-md text-white font-semibold transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRestarting ? 'Restarting...' : <><FaRedo className="mr-2" /> Restart Machine</>}
          </button>
        </div>

        <div className="flex border-b border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-6 text-lg font-semibold focus:outline-none ${
              activeTab === 'info' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaInfoCircle className="inline-block mr-2" /> Machine Info
          </button>
          <button
            onClick={() => setActiveTab('changelog')}
            className={`py-3 px-6 text-lg font-semibold focus:outline-none ${
              activeTab === 'changelog' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaHistory className="inline-block mr-2" /> Changelog
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'info' && (
            <motion.div
              key="infoTab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div>
                <h3 className="text-2xl font-bold mb-4 text-white">Details</h3>
                <p className="text-gray-300 mb-2"><strong className="text-purple-300">Provider:</strong> {machine.provider}</p>
                <p className="text-gray-300 mb-2"><strong className="text-purple-300">Source Identifier:</strong> {machine.source_identifier}</p>
                {machine.category && <p className="text-gray-300 mb-2"><strong className="text-purple-300">Category:</strong> {machine.category}</p>}
                {machine.solves !== undefined && <p className="text-gray-300 mb-2"><strong className="text-purple-300">Solves:</strong> {machine.solves}</p>}
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-4 text-white">Flags</h3>
                <div className="flex flex-col gap-4">
                  {flagsStatus.length === 0 ? (
                    <p className="text-gray-400">No flags defined for this machine.</p>
                  ) : (
                    flagsStatus.map((flag) => (
                      <div key={flag.id} className="bg-gray-700 p-4 rounded-md flex items-center justify-between">
                        <p className="text-gray-300 font-medium">Flag:</p>
                        {flag.is_submitted ? (
                          <span className="text-green-400 font-bold flex items-center"><FaFlag className="mr-2" /> Submitted!</span>
                        ) : (
                          <div className="flex items-center gap-2 w-full ml-4">
                            <input
                              type="text"
                              placeholder="Enter flag"
                              value={flagInputs[flag.id] || ''}
                              onChange={(e) => handleFlagInputChange(flag.id, e)}
                              className="flex-grow p-2 rounded-md bg-gray-800 border border-gray-600 text-white focus:ring-purple-500 focus:border-purple-500"
                            />
                            <button
                              onClick={() => handleSubmitFlag(flag.id)}
                              disabled={!flagInputs[flag.id] || isStarting || isStopping || isRestarting}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Submit
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'changelog' && (
            <motion.div
              key="changelogTab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-2xl font-bold mb-4 text-white">Changelog Entries</h3>
              {isAdmin && (
                <div className="bg-gray-700 p-6 rounded-lg mb-6">
                  <h4 className="text-xl font-bold mb-3 text-white">Add New Changelog Entry</h4>
                  <textarea
                    value={newChangelogEntry}
                    onChange={(e) => setNewChangelogEntry(e.target.value)}
                    placeholder="Enter changelog description"
                    rows="4"
                    className="w-full p-3 rounded-md bg-gray-800 border border-gray-600 text-white focus:ring-purple-500 focus:border-purple-500 mb-4 resize-y"
                  ></textarea>
                  <button
                    onClick={handleAddChangelogEntry}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white font-semibold transition-colors flex items-center"
                  >
                    <FaPlus className="mr-2" /> Add Entry
                  </button>
                </div>
              )}
              {changelogEntries.length === 0 ? (
                <p className="text-gray-400">No changelog entries for this machine.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {changelogEntries.map((entry) => (
                    <div key={entry.id} className="bg-gray-700 p-4 rounded-md shadow-sm">
                      <p className="text-gray-200 font-semibold mb-1">{new Date(entry.timestamp).toLocaleString()}</p>
                      <p className="text-gray-300">{entry.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default MachineDetail;