import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from './Notification';
import AdminPageLayout from './AdminPageLayout';

const AddChallengePage = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Web');
    const [difficulty, setDifficulty] = useState('Easy');
    const [points, setPoints] = useState(100);
    const [flags, setFlags] = useState([{ id: 1, value: '' }]); // Initialize with one empty flag
    const [file, setFile] = useState(null);
    const [dockerImage, setDockerImage] = useState(''); // New state for docker image
    const navigate = useNavigate();
    const addNotification = useNotification();

    const handleAddFlag = () => {
        const currentFlags = Array.isArray(flags) ? flags : [];
        setFlags([...currentFlags, { id: currentFlags.length > 0 ? Math.max(...currentFlags.map(f => f.id)) + 1 : 1, value: '' }]);
    };

    const handleFlagChange = (id, newValue) => {
        setFlags(flags.map(f => f.id === id ? { ...f, value: newValue } : f));
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
        formData.append('flags', flags.map(f => f.value).join(','));
        if (file) {
            formData.append('file', file);
        }
        if (dockerImage) {
            formData.append('docker_image', dockerImage);
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
            addNotification('Challenge added successfully!', 'success');
            navigate('/challenges');
        } catch (error) {
            console.error('Error adding challenge:', error);
            const errorDetail = error.response?.data?.detail;
            const errorMessage = Array.isArray(errorDetail)
                ? errorDetail.map(e => e.msg).join(', ')
                : errorDetail || 'Error adding challenge';
            addNotification(errorMessage, 'error');
        }
    };

    return (
        <AdminPageLayout title="Add New Challenge">
            <div className="max-w-4xl mx-auto">
                <div className="bg-gray-800 rounded-lg shadow-md p-8">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-300">Title</label>
                            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" required />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-300">Description</label>
                            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="4" className="bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" required />
                        </div>
                        <div>
                            <label htmlFor="category" className="block mb-2 text-sm font-medium text-gray-300">Category</label>
                            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5">
                                <option>Web</option>
                                <option>Forensics</option>
                                <option>Crypto</option>
                                <option>Misc</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-300">Difficulty</label>
                            <div className="flex space-x-4 mt-1">
                                {['Easy', 'Medium', 'Hard'].map(d => (
                                    <button type="button" key={d} onClick={() => setDifficulty(d)} className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${difficulty === d ? 'bg-purple-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'}`}>{d}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="points" className="block mb-2 text-sm font-medium text-gray-300">Points</label>
                            <input type="number" id="points" value={points} onChange={(e) => setPoints(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" required />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block mb-2 text-sm font-medium text-gray-300">Flags</label>
                            {flags.map((f, index) => (
                                <div key={f.id} className="flex items-center space-x-2 mb-2">
                                    <input
                                        type="text"
                                        value={f.value}
                                        onChange={(e) => handleFlagChange(f.id, e.target.value)}
                                        className="bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
                                        placeholder={`Flag ${index + 1}`}
                                        required
                                    />
                                    {flags.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFlag(f.id)}
                                            className="p-2 text-red-400 hover:text-red-600"
                                        >
                                            &times;
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddFlag}
                                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                            >
                                Add Another Flag
                            </button>
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="file" className="block mb-2 text-sm font-medium text-gray-300">File (Optional)</label>
                            <input type="file" id="file" onChange={(e) => setFile(e.target.files[0])} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="dockerImage" className="block mb-2 text-sm font-medium text-gray-300">Docker Image (Optional)</label>
                            <input type="text" id="dockerImage" value={dockerImage} onChange={(e) => setDockerImage(e.target.value)} className="bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="e.g., my-vulnerable-app:latest" />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">Add Challenge</button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminPageLayout>
    );
};

export default AddChallengePage;