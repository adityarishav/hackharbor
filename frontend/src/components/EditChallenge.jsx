import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from './Notification';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrash, FaLinux, FaWindows } from 'react-icons/fa';
import AdminPageLayout from './AdminPageLayout';

const EditChallenge = () => {
  const navigate = useNavigate();
  const { challengeId } = useParams();
  const showNotification = useNotification();
  const [difficulty, setDifficulty] = useState('');
  const [flags, setFlags] = useState([]);
  const [challengeDetails, setChallengeDetails] = useState({
    title: '',
    description: '',
    docker_image: '',
    category: '',
    difficulty: '',
    points: 0,
    file_path: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallengeDetails = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await api.get(`/admin/challenges/${challengeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;

        setChallengeDetails({
          title: data.title,
          description: data.description,
          docker_image: data.docker_image,
          category: data.category,
          difficulty: data.difficulty,
          points: data.points,
          file_path: data.file_path,
        });
        setDifficulty(data.difficulty);
        setDifficulty(data.difficulty);
        setFlags((data.flags || []).map(f => ({ id: f.id, value: f.flag }))); // Adapt for challenge flags
      } catch (error) {
        console.error('Failed to fetch challenge details:', error);
        showNotification('Failed to load challenge details.', 'error');
        navigate('/admin/challenges');
      } finally {
        setLoading(false);
      }
    };

    fetchChallengeDetails();
  }, [challengeId, navigate, showNotification]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setChallengeDetails({ ...challengeDetails, [name]: value });
  };

  const handleFlagChange = (id, newValue) => {
    setFlags(flags.map(f => f.id === id ? { ...f, value: newValue } : f));
  };

  const handleAddFlag = () => {
    setFlags([...flags, { id: flags.length > 0 ? Math.max(...flags.map(f => f.id)) + 1 : 1, value: '' }]);
  };

  const handleRemoveFlag = (id) => {
    const newFlags = flags.filter(f => f.id !== id);
    setFlags(newFlags);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    const payload = {
      title: challengeDetails.title,
      description: challengeDetails.description,
      category: challengeDetails.category,
      difficulty: difficulty,
      points: challengeDetails.points,
      flags: flags.map(f => ({ flag: f.value })), // Send as a list of objects
      docker_image: challengeDetails.docker_image,
      file_path: challengeDetails.file_path, // Assuming file_path is handled separately if needed
    };

    try {
      await api.put(`/admin/challenges/${challengeId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotification('Challenge updated successfully!', 'success');
      navigate('/admin/challenges');
    } catch (error) {
      console.error('Failed to update challenge:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to update challenge';
      showNotification(Array.isArray(errorMsg) ? errorMsg.map(e => e.msg).join(', ') : errorMsg, 'error');
    }
  };

  const difficultyColors = {
    Easy: 'bg-green-600',
    Medium: 'bg-yellow-600',
    Hard: 'bg-red-600',
    Insane: 'bg-purple-600',
  };

  if (loading) {
    return <AdminPageLayout title="Edit Challenge"><div>Loading challenge details...</div></AdminPageLayout>;
  }

  return (
    <AdminPageLayout title="Edit Challenge">
      <div className="mx-auto max-w-4xl">
        <form onSubmit={handleSubmit} className="rounded-lg bg-gray-800/50 p-8 shadow-lg">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Challenge Title</label>
                <input
                  type="text"
                  name="title"
                  value={challengeDetails.title}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Description</label>
                <textarea
                  name="description"
                  rows="4"
                  value={challengeDetails.description}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                ></textarea>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Docker Image (Optional)</label>
                <input
                  type="text"
                  name="docker_image"
                  value={challengeDetails.docker_image}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., my-vulnerable-app:latest"
                />
              </div>

              <div>
                <label htmlFor="file" className="mb-2 block text-sm font-medium text-gray-300">File Path (Optional)</label>
                <input
                  type="text"
                  name="file_path"
                  value={challengeDetails.file_path}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., /uploads/challenge_file.zip"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Difficulty</label>
                <div className="flex gap-2">
                  {['Easy', 'Medium', 'Hard', 'Insane'].map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold text-white transition-all ${difficulty === d ? difficultyColors[d] : 'bg-gray-600 hover:bg-gray-500'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Category</label>
                <select
                  name="category"
                  value={challengeDetails.category}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Category</option>
                  <option value="Web">Web</option>
                  <option value="Pwn">Pwn</option>
                  <option value="Forensics">Forensics</option>
                  <option value="Crypto">Crypto</option>
                  <option value="Reversing">Reversing</option>
                  <option value="Misc">Misc</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Points</label>
                <input
                  type="number"
                  name="points"
                  value={challengeDetails.points}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="mb-4 block text-sm font-medium text-gray-300">Flags</label>
                <div className="flex flex-col gap-4">
                  <AnimatePresence>
                    {flags.map((f) => (
                      <motion.div
                        key={f.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={f.value}
                          onChange={(e) => handleFlagChange(f.id, e.target.value)}
                          className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                          placeholder={`Flag ${f.id}`}
                          required
                        />
                        {flags.length > 1 && (
                          <button type="button" onClick={() => handleRemoveFlag(f.id)} className="text-red-500 hover:text-red-400">
                            <FaTrash />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <button
                    type="button"
                    onClick={handleAddFlag}
                    className="mt-2 self-start rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-500"
                  >
                    Add Flag
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/challenges')}
              className="rounded-md border border-gray-600 bg-transparent px-6 py-2 font-semibold text-white transition-colors hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-purple-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-purple-700"
            >
              Update Challenge
            </button>
          </div>
        </form>
      </div>
    </AdminPageLayout>
  );
};

export default EditChallenge;