import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from './Notification';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrash, FaLinux, FaWindows } from 'react-icons/fa';
import AdminPageLayout from './AdminPageLayout';

const AddMachine = () => {
  const navigate = useNavigate();
  const showNotification = useNotification();
  const [provider, setProvider] = useState('docker');
  const [difficulty, setDifficulty] = useState('');
  const [operatingSystem, setOperatingSystem] = useState('');
  const [flags, setFlags] = useState([{ flag: '' }]);
  const [machineDetails, setMachineDetails] = useState({
    name: '',
    description: '',
    docker_image: '',
    vm_name: '',
    snapshot_name: '',
    category: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMachineDetails({ ...machineDetails, [name]: value });
  };

  const handleFlagChange = (index, e) => {
    const newFlags = [...flags];
    newFlags[index].flag = e.target.value;
    setFlags(newFlags);
  };

  const handleAddFlag = () => {
    setFlags([...flags, { flag: '' }]);
  };

  const handleRemoveFlag = (index) => {
    const newFlags = flags.filter((_, i) => i !== index);
    setFlags(newFlags);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    const payload = {
      name: machineDetails.name,
      description: machineDetails.description,
      provider,
      operating_system: operatingSystem,
      category: machineDetails.category,
      difficulty,
      flags: flags.map(f => ({ flag: f.flag })),
      source_identifier: provider === 'docker' ? machineDetails.docker_image : machineDetails.vm_name,
      config_json: provider === 'virtualbox' ? JSON.stringify({ snapshot_name: machineDetails.snapshot_name }) : null,
    };

    try {
      await api.post('/admin/machines/', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotification('Machine added successfully!', 'success');
      navigate('/admin');
    } catch (error) {
      console.error('Failed to add machine:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to add machine';
      showNotification(Array.isArray(errorMsg) ? errorMsg.map(e => e.msg).join(', ') : errorMsg, 'error');
    }
  };

  const difficultyColors = {
    Easy: 'bg-green-600',
    Medium: 'bg-yellow-600',
    Hard: 'bg-red-600',
    Insane: 'bg-purple-600',
  };

  return (
    <AdminPageLayout title="Add New Machine">
      <div className="mx-auto max-w-4xl">
        <form onSubmit={handleSubmit} className="rounded-lg bg-gray-800/50 p-8 shadow-lg">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="docker">Docker</option>
                  <option value="virtualbox">VirtualBox</option>
                </select>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={provider}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {provider === 'docker' ? (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">Docker Image</label>
                      <input
                        type="text"
                        name="docker_image"
                        value={machineDetails.docker_image}
                        onChange={handleInputChange}
                        className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., vuln-app:latest"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">VM Name</label>
                        <input
                          type="text"
                          name="vm_name"
                          value={machineDetails.vm_name}
                          onChange={handleInputChange}
                          className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                          placeholder="e.g., Ubuntu-Vuln-1"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">Snapshot Name</label>
                        <input
                          type="text"
                          name="snapshot_name"
                          value={machineDetails.snapshot_name}
                          onChange={handleInputChange}
                          className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                          placeholder="e.g., clean_snapshot"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Machine Name</label>
                <input
                  type="text"
                  name="name"
                  value={machineDetails.name}
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
                  value={machineDetails.description}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                ></textarea>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Operating System</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOperatingSystem('Linux')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition-all ${operatingSystem === 'Linux' ? 'border-purple-500 bg-purple-500/20' : 'border-gray-600 bg-gray-700 hover:bg-gray-600'}`}
                  >
                    <FaLinux />
                    Linux
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperatingSystem('Windows')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition-all ${operatingSystem === 'Windows' ? 'border-blue-500 bg-blue-500/20' : 'border-gray-600 bg-gray-700 hover:bg-gray-600'}`}
                  >
                    <FaWindows />
                    Windows
                  </button>
                </div>
              </div>

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
                  value={machineDetails.category}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Category</option>
                  <option value="Web">Web</option>
                  <option value="Pwn">Pwn</option>
                  <option value="Forensics">Forensics</option>
                  <option value="Crypto">Crypto</option>
                  <option value="Reversing">Reversing</option>
                </select>
              </div>

              <div>
                <label className="mb-4 block text-sm font-medium text-gray-300">Flags</label>
                <div className="flex flex-col gap-4">
                  <AnimatePresence>
                    {flags.map((flag, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={flag.flag}
                          onChange={(e) => handleFlagChange(index, e)}
                          className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                          placeholder={`Flag ${index + 1}`}
                          required
                        />
                        {flags.length > 1 && (
                          <button type="button" onClick={() => handleRemoveFlag(index)} className="text-red-500 hover:text-red-400">
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
              onClick={() => navigate('/admin')}
              className="rounded-md border border-gray-600 bg-transparent px-6 py-2 font-semibold text-white transition-colors hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-purple-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-purple-700"
            >
              Add Machine
            </button>
          </div>
        </form>
      </div>
    </AdminPageLayout>
  );
};

export default AddMachine;