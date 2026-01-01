import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from '../components/Notification';
import { jwtDecode } from 'jwt-decode';
import { FaPlay, FaStop, FaRedo, FaFlag, FaInfoCircle, FaHistory, FaPlus, FaLinux, FaWindows, FaArrowLeft, FaSkull } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

import { AuthContext } from '../contexts/AuthContext';

function MachineDetail() {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const showNotification = useNotification();
  const { refreshUser } = React.useContext(AuthContext); // Get refreshUser from context
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



  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictMachine, setConflictMachine] = useState(null);

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
      if (refreshUser) refreshUser(); // Refresh user context to update navbar
    } catch (err) {
      console.error('Failed to start machine:', err);
      if (err.response && err.response.status === 409) {
        // Conflict!
        const activeMachineId = err.response.headers['x-active-machine-id'];
        const activeMachineName = err.response.headers['x-active-machine-name'];
        setConflictMachine({ id: activeMachineId, name: activeMachineName });
        setShowConflictModal(true);
      } else {
        showNotification(err.response?.data?.detail || 'Failed to start machine!', 'error');
      }
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopActiveMachine = async () => {
    if (!conflictMachine) return;
    try {
      const token = localStorage.getItem('access_token');
      await api.post(`/machines/${conflictMachine.id}/stop`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification(`Stopped ${conflictMachine.name}`, 'success');
      setShowConflictModal(false);
      setConflictMachine(null);
      if (refreshUser) refreshUser();
      // Automatically try to start the current machine again
      handleStartMachine();
    } catch (err) {
      console.error('Failed to stop active machine:', err);
      showNotification('Failed to stop active machine.', 'error');
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
      if (refreshUser) refreshUser(); // Refresh user context to update navbar
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
    <div className="min-h-screen p-6">
      {/* Conflict Modal */}
      <AnimatePresence>
        {showConflictModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-red-500/30 p-8 rounded-2xl shadow-2xl max-w-md w-full"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                  <FaStop className="text-3xl text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Machine Limit Reached</h3>
                <p className="text-gray-300 mb-6">
                  You can only have one machine active at a time. <br />
                  <span className="font-semibold text-purple-400">{conflictMachine?.name}</span> is currently running.
                </p>
                <div className="flex gap-4 w-full">
                  <button
                    onClick={() => setShowConflictModal(false)}
                    className="flex-1 px-4 py-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStopActiveMachine}
                    className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20"
                  >
                    Stop & Start New
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => navigate('/machines')}
        className="mb-6 px-4 py-2 glass-button-secondary rounded-xl text-white font-semibold flex items-center hover:bg-white/10"
      >
        <FaArrowLeft className="mr-2" /> Back to Machines
      </button>

      <div className="glass-panel p-8 mb-8 rounded-2xl">
        <h2 className="text-4xl font-bold mb-4 neon-text">{machine.name}</h2>
        <div className="flex items-center space-x-4 mb-6">
          <span
            className={`px-4 py-1 rounded-full text-sm font-semibold shadow-lg ${difficultyColors[machine.difficulty] || 'bg-gray-600'
              }`}
          >
            {machine.difficulty}
          </span>
          <span className="text-gray-400 text-sm flex items-center">
            {machine.operating_system === 'Linux' && <FaLinux className="mr-2 text-lg" />}
            {machine.operating_system === 'Windows' && <FaWindows className="mr-2 text-lg" />}
            {machine.operating_system || 'N/A'}
          </span>
          {machine.ip_address && hasClickedStart ? (
            <span className="text-green-400 font-semibold flex items-center drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
              <FaPlay className="mr-2" /> Running (IP: {machine.ip_address})
            </span>
          ) : (
            <span className="text-red-400 font-semibold flex items-center drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]">
              <FaStop className="mr-2" /> Stopped
            </span>
          )}
        </div>
        <p className="text-gray-300 mb-6 leading-relaxed">{machine.description}</p>

        <div className="flex space-x-4 mb-8">
          <button
            onClick={handleStartMachine}
            disabled={isStarting || isStopping || isRestarting || hasClickedStart}
            className="px-6 py-3 bg-green-600/80 hover:bg-green-600 backdrop-blur-sm rounded-xl text-white font-semibold transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20 border border-white/10"
          >
            {isStarting ? 'Starting...' : <><FaPlay className="mr-2" /> Start {machine.provider === 'docker' ? 'Container' : 'VM'}</>}
          </button>
          <button
            onClick={handleStopMachine}
            disabled={isStarting || isStopping || isRestarting || !hasClickedStart}
            className="px-6 py-3 bg-red-600/80 hover:bg-red-600 backdrop-blur-sm rounded-xl text-white font-semibold transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20 border border-white/10"
          >
            {isStopping ? 'Stopping...' : <><FaStop className="mr-2" /> Stop Machine</>}
          </button>
          <button
            onClick={handleRestartMachine}
            disabled={isStarting || isStopping || isRestarting}
            className="px-6 py-3 bg-yellow-600/80 hover:bg-yellow-600 backdrop-blur-sm rounded-xl text-white font-semibold transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-900/20 border border-white/10"
          >
            {isRestarting ? 'Restarting...' : <><FaRedo className="mr-2" /> Restart Machine</>}
          </button>
        </div>

        <div className="flex border-b border-white/10 mb-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-6 text-lg font-semibold focus:outline-none transition-colors ${activeTab === 'info' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-white'
              }`}
          >
            <FaInfoCircle className="inline-block mr-2" /> Machine Info
          </button>
          <button
            onClick={() => setActiveTab('changelog')}
            className={`py-3 px-6 text-lg font-semibold focus:outline-none transition-colors ${activeTab === 'changelog' ? 'border-b-2 border-purple-500 text-purple-400' : 'text-gray-400 hover:text-white'
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
              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-2xl font-bold mb-4 text-white border-b border-white/10 pb-2">Details</h3>
                <div className="space-y-3">
                  <p className="text-gray-300"><strong className="text-purple-300">Provider:</strong> {machine.provider}</p>
                  <p className="text-gray-300"><strong className="text-purple-300">Source Identifier:</strong> {machine.source_identifier}</p>
                  {machine.category && <p className="text-gray-300"><strong className="text-purple-300">Category:</strong> {machine.category}</p>}
                  {machine.solves !== undefined && <p className="text-gray-300"><strong className="text-purple-300">Solves:</strong> {machine.solves}</p>}
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-2xl font-bold mb-4 text-white border-b border-white/10 pb-2">Flags</h3>
                <div className="flex flex-col gap-4">
                  {flagsStatus.length === 0 ? (
                    <p className="text-gray-400">No flags defined for this machine.</p>
                  ) : (
                    flagsStatus.map((flag) => (
                      <div key={flag.id} className="bg-black/20 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                        <p className="text-gray-300 font-medium">Flag:</p>
                        {flag.is_submitted ? (
                          <div className="flex flex-col items-end">
                            <span className="text-green-400 font-bold flex items-center drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]"><FaFlag className="mr-2" /> Submitted!</span>
                            {flag.first_blood_user && (
                              <span className="text-xs text-red-400 font-mono mt-1 flex items-center gap-1">
                                <FaSkull className="text-[10px]" /> First Blood: {flag.first_blood_user}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col w-full ml-4">
                            <div className="flex items-center gap-2 w-full">
                              <input
                                type="text"
                                placeholder="Enter flag"
                                value={flagInputs[flag.id] || ''}
                                onChange={(e) => handleFlagInputChange(flag.id, e)}
                                className="flex-grow glass-input rounded-lg p-2"
                              />
                              <button
                                onClick={() => handleSubmitFlag(flag.id)}
                                disabled={!flagInputs[flag.id] || isStarting || isStopping || isRestarting}
                                className="px-4 py-2 glass-button rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Submit
                              </button>
                            </div>
                            {flag.first_blood_user && (
                              <span className="text-xs text-red-400 font-mono mt-1 flex items-center gap-1 self-end">
                                <FaSkull className="text-[10px]" /> First Blood: {flag.first_blood_user}
                              </span>
                            )}
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
                <div className="glass-card p-6 rounded-xl mb-6">
                  <h4 className="text-xl font-bold mb-3 text-white">Add New Changelog Entry</h4>
                  <textarea
                    value={newChangelogEntry}
                    onChange={(e) => setNewChangelogEntry(e.target.value)}
                    placeholder="Enter changelog description"
                    rows="4"
                    className="w-full glass-input rounded-xl p-3 mb-4 resize-y"
                  ></textarea>
                  <button
                    onClick={handleAddChangelogEntry}
                    className="px-5 py-2 glass-button rounded-lg text-white font-semibold flex items-center"
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
                    <div key={entry.id} className="glass-card p-4 rounded-xl">
                      <p className="text-purple-300 font-semibold mb-1 text-sm">{new Date(entry.timestamp).toLocaleString()}</p>
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