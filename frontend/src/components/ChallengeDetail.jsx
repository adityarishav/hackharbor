import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from './Notification';
import { jwtDecode } from 'jwt-decode';
import { FaPlay, FaStop, FaFlag, FaInfoCircle, FaRedo, FaArrowLeft } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

function ChallengeDetail() {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const showNotification = useNotification();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [flagInputs, setFlagInputs] = useState({}); // To manage multiple flag inputs
  const [flagsStatus, setFlagsStatus] = useState([]); // To store submission status of flags
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isChallengeActiveForUser, setIsChallengeActiveForUser] = useState(false); // New state

  const fetchFlagsStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await api.get(`/challenges/${challengeId}/flags_status`, {
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

  const fetchChallengeDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await api.get(`/challenges/${challengeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setChallenge(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch challenge details:', err);
      setError('Failed to load challenge details. Please try again.');
      if (err.response && err.response.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallengeDetails();
    fetchFlagsStatus(); // Call fetchFlagsStatus here

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
  }, [challengeId, navigate]);

  // Check if the current user is active on this challenge
  useEffect(() => {
    if (challenge && currentUserId && challenge.active_users) {
      setIsChallengeActiveForUser(challenge.active_users.some(user => user.id === currentUserId));
    } else {
      setIsChallengeActiveForUser(false);
    }
  }, [challenge, currentUserId]);


  const handleStartChallenge = async () => {
    setIsStarting(true);
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = isAdmin ? `/admin/challenges/${challenge.id}/start` : `/challenges/${challenge.id}/start`;
      const response = await api.post(endpoint, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      showNotification('Challenge started!', 'success');
      setChallenge(response.data); // Update challenge state with new IP
      setIsChallengeActiveForUser(true);
    } catch (err) {
      console.error('Failed to start challenge:', err);
      showNotification(err.response?.data?.detail || 'Failed to start challenge!', 'error');
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopChallenge = async () => {
    setIsStopping(true);
    try {
      const token = localStorage.getItem('access_access');
      const endpoint = isAdmin ? `/admin/challenges/${challenge.id}/stop` : `/challenges/${challenge.id}/stop`;
      const response = await api.post(endpoint, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      showNotification('Challenge stopped!', 'success');
      setChallenge(response.data); // Update challenge state with null IP
      setIsChallengeActiveForUser(false);
    } catch (err) {
      console.error('Failed to stop challenge:', err);
      showNotification(err.response?.data?.detail || 'Failed to stop challenge!', 'error');
    } finally {
      setIsStopping(false);
    }
  };

  const handleRestartChallenge = async () => {
    setIsStarting(true); // Use isStarting for restart as well
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = isAdmin ? `/admin/challenges/${challenge.id}/restart` : `/challenges/${challenge.id}/restart`;
      const response = await api.post(endpoint, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      showNotification('Challenge restarted!', 'success');
      setChallenge(response.data); // Update challenge state with new IP
      setIsChallengeActiveForUser(true); // User is active after restart
    } catch (err) {
      console.error('Failed to restart challenge:', err);
      showNotification(err.response?.data?.detail || 'Failed to restart challenge!', 'error');
    } finally {
      setIsStarting(false);
    }
  };

  const handleFlagSubmit = async (challengeFlagId) => {
    const flagValue = flagInputs[challengeFlagId];
    if (!flagValue) {
      showNotification('Please enter a flag', 'warning');
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      await api.post(`/challenges/${challenge.id}/submit`, { flag: flagValue }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotification('Flag submitted successfully!', 'success');
      setFlagInputs({ ...flagInputs, [challengeFlagId]: '' }); // Clear input for this flag
      fetchFlagsStatus(); // Re-fetch flag status to update UI
    } catch (err) {
      console.error('Error submitting flag:', err);
      showNotification(err.response?.data?.detail || 'Incorrect flag', 'error');
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Loading challenge details...</div>;
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-500">Error: {error}</div>;
  }

  if (!challenge) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-gray-400">Challenge not found.</div>;
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
        onClick={() => navigate('/challenges')}
        className="mb-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition-colors flex items-center"
      >
        <FaArrowLeft className="mr-2" /> Back to Challenges
      </button>

      <div className="bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
        <h2 className="text-4xl font-bold mb-4 text-purple-400">{challenge.title}</h2>
        <div className="flex items-center space-x-4 mb-6">
          <span
            className={`px-4 py-1 rounded-full text-sm font-semibold ${
              difficultyColors[challenge.difficulty] || 'bg-gray-600'
            }`}
          >
            {challenge.difficulty}
          </span>
          <span className="text-gray-400 text-sm flex items-center">
            {challenge.ip_address && isChallengeActiveForUser ? ( // Check isChallengeActiveForUser
              <span className="text-green-500 font-semibold flex items-center">
                <FaPlay className="mr-2" /> Running (IP: {challenge.ip_address})
              </span>
            ) : (
              <span className="text-red-500 font-semibold flex items-center">
                <FaStop className="mr-2" /> Stopped
              </span>
            )}
          </span>
        </div>
        <p className="text-gray-300 mb-6 leading-relaxed">{challenge.description}</p>

        <div className="flex space-x-4 mb-8">
          {challenge.docker_image && !isChallengeActiveForUser && ( // Check isChallengeActiveForUser
            <button
              onClick={handleStartChallenge}
              disabled={isStarting || isStopping}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-md text-white font-semibold transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting ? 'Starting...' : <><FaPlay className="mr-2" /> Start Challenge</>}
            </button>
          )}
          {challenge.docker_image && isChallengeActiveForUser && ( // Check isChallengeActiveForUser
            <button
              onClick={handleStopChallenge}
              disabled={isStarting || isStopping}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-md text-white font-semibold transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStopping ? 'Stopping...' : <><FaStop className="mr-2" /> Stop Challenge</>}
            </button>
          )}
          {challenge.docker_image && ( // Reset is available if docker_image exists
            <button
              onClick={handleRestartChallenge}
              disabled={isStarting || isStopping}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-md text-white font-semibold transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting ? 'Restarting...' : <><FaRedo className="mr-2" /> Reset Challenge</>}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4 text-white">Details</h3>
            {challenge.category && <p className="text-gray-300 mb-2"><strong className="text-purple-300">Category:</strong> {challenge.category}</p>}
            {challenge.points !== undefined && <p className="text-gray-300 mb-2"><strong className="text-purple-300">Points:</strong> {challenge.points}</p>}
            {challenge.docker_image && <p className="text-gray-300 mb-2"><strong className="text-purple-300">Docker Image:</strong> {challenge.docker_image}</p>}
            {challenge.ip_address && <p className="text-gray-300 mb-2"><strong className="text-purple-300">IP Address:</strong> {challenge.ip_address}</p>}
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-4 text-white">Flags</h3>
            {challenge.file_path && (
              <a href={`${import.meta.env.VITE_API_BASE_URL}${challenge.file_path}`} download className="text-blue-400 hover:underline mb-4 block font-medium">
                Download File
              </a>
            )}
            <div className="flex flex-col gap-4">
              {flagsStatus.length === 0 ? (
                <p className="text-gray-400">No flags defined for this challenge.</p>
              ) : (
                flagsStatus.map((f) => (
                  <div key={f.id} className="bg-gray-700 p-4 rounded-md flex items-center justify-between">
                    <p className="text-gray-300 font-medium">Flag:</p>
                    {f.is_submitted ? (
                      <span className="text-green-400 font-bold flex items-center"><FaFlag className="mr-2" /> Submitted!</span>
                    ) : (
                      <div className="flex items-center gap-2 w-full ml-4">
                        <input
                          type="text"
                          placeholder="Enter flag"
                          value={flagInputs[f.id] || ''}
                          onChange={(e) => setFlagInputs({ ...flagInputs, [f.id]: e.target.value })}
                          className="flex-grow p-2 rounded-md bg-gray-800 border border-gray-600 text-white focus:ring-purple-500 focus:border-purple-500"
                        />
                        <button
                          onClick={() => handleFlagSubmit(f.id)}
                          disabled={!flagInputs[f.id]}
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
        </div>
      </div>
    </div>
  );
}

export default ChallengeDetail;