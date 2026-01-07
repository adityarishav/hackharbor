import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from '../components/Notification';
import AdminPageLayout from '../layouts/AdminPageLayout';
import { FaTrash } from 'react-icons/fa';

const AddChallengePage = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Web');
    const [difficulty, setDifficulty] = useState('Easy');
    const [points, setPoints] = useState(0); 
    const [flags, setFlags] = useState([{ id: 1, value: '', points: 0 }]); 
    const [file, setFile] = useState(null);
    const [dockerImage, setDockerImage] = useState(''); 
    const [releaseDate, setReleaseDate] = useState(''); 
    const navigate = useNavigate();
    const addNotification = useNotification();

    const handleAddFlag = () => {
        const currentFlags = Array.isArray(flags) ? flags : [];
        setFlags([...currentFlags, { id: currentFlags.length > 0 ? Math.max(...currentFlags.map(f => f.id)) + 1 : 1, value: '', points: 0 }]);
    };

    const handleFlagChange = (id, newValue) => {
        setFlags(flags.map(f => f.id === id ? { ...f, value: newValue } : f));
    };

    const handleFlagPointsChange = (id, newPoints) => {
        setFlags(flags.map(f => f.id === id ? { ...f, points: newPoints } : f));
    };

    const handleRemoveFlag = (id) => {
        setFlags(flags.filter(f => f.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('difficulty', difficulty);
        formData.append('points', points); 
        
        formData.append('flags', flags.map(f => `${f.value}:${f.points || 0}`).join(','));
        if (file) {
            formData.append('file', file);
        }
        if (dockerImage) {
            formData.append('docker_image', dockerImage);
        }
        if (releaseDate) {
            formData.append('release_date', new Date(releaseDate).toISOString());
        }
        formData.append('status', 'upcoming'); // Default status for new challenges

        try {
            const token = localStorage.getItem('access_token'); // Get the token
            if (!token) {
                addNotification('You must be logged in to add a challenge.', 'error');
                navigate('/login');
                return;
            }

            await api.post('/admin/challenges', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`, // Add Authorization header
                },
            });
            addNotification('Challenge added successfully', 'success');
            navigate('/admin/challenges');
        } catch (error) {
            console.error('Error adding challenge:', error);
            const errorDetail = error.response?.data?.detail;
            const errorMessage = Array.isArray(errorDetail)
                ? errorDetail.map(e => e.msg).join(', ')
                : errorDetail || 'Failed to add challenge';
            addNotification(errorMessage, 'error');
        }
    };

    const difficultyColors = {
        Easy: 'bg-green-600',
        Medium: 'bg-yellow-600',
        Hard: 'bg-red-600',
        Insane: 'bg-purple-600',
    };

    return (
        <AdminPageLayout title="Add New Challenge">
            <div className="mx-auto max-w-4xl">
                <form onSubmit={handleSubmit} className="rounded-lg bg-gray-800/50 p-8 shadow-lg">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        {/* Left Column */}
                        <div className="flex flex-col gap-6">
                            <div>
                                <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-300">Challenge Title</label>
                                <input
                                    type="text"
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-300">Description</label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows="4"
                                    className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                                    required
                                ></textarea>
                            </div>

                            <div>
                                <label htmlFor="dockerImage" className="mb-2 block text-sm font-medium text-gray-300">Docker Image (Optional)</label>
                                <input
                                    type="text"
                                    id="dockerImage"
                                    value={dockerImage}
                                    onChange={(e) => setDockerImage(e.target.value)}
                                    className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                                    placeholder="e.g., my-vulnerable-app:latest"
                                />
                            </div>

                            <div>
                                <label htmlFor="file" className="mb-2 block text-sm font-medium text-gray-300">Challenge File (Optional)</label>
                                <input
                                    type="file"
                                    id="file"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
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
                                <label htmlFor="category" className="mb-2 block text-sm font-medium text-gray-300">Category</label>
                                <select
                                    id="category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                                >
                                    <option>Web</option>
                                    <option>Forensics</option>
                                    <option>Crypto</option>
                                    <option>Misc</option>
                                    <option>Pwn</option>
                                    <option>Reversing</option>
	    			                <option>Networking</option>
                                    <option>BlockChsin</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="points" className="mb-2 block text-sm font-medium text-gray-300">Total Points</label>
                                <input
                                    type="number"
                                    id="points"
                                    value={points}
                                    onChange={(e) => setPoints(e.target.value)}
                                    className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="releaseDate" className="mb-2 block text-sm font-medium text-gray-300">Release Date (Optional - UTC)</label>
                                <input
                                    type="datetime-local"
                                    id="releaseDate"
                                    value={releaseDate}
                                    onChange={(e) => setReleaseDate(e.target.value)}
                                    className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                                />
                                <p className="text-xs text-gray-400 mt-1">Leave blank to release immediately.</p>
                            </div>

                            <div>
                                <label className="mb-4 block text-sm font-medium text-gray-300">Flags</label>
                                <div className="flex flex-col gap-4">
                                    {flags.map((flag, index) => (
                                        <div key={flag.id} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={flag.value}
                                                onChange={(e) => handleFlagChange(flag.id, e.target.value)}
                                                className="w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                                                placeholder={`Flag ${index + 1}`}
                                                required
                                            />
                                            <input
                                                type="number"
                                                value={flag.points}
                                                onChange={(e) => handleFlagPointsChange(flag.id, e.target.value)}
                                                className="w-24 rounded-md border-gray-600 bg-gray-700 p-2.5 text-white focus:ring-2 focus:ring-purple-500"
                                                placeholder="Pts"
                                                min="0"
                                            />
                                            {flags.length > 1 && (
                                                <button type="button" onClick={() => handleRemoveFlag(flag.id)} className="text-red-500 hover:text-red-400">
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                    ))}
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
                            Add Challenge
                        </button>
                    </div>
                </form>
            </div>
        </AdminPageLayout>
    );
};

export default AddChallengePage;
