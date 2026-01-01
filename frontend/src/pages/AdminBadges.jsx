import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNotification } from '../components/Notification';
import { FaTrash, FaEdit, FaPlus, FaTrophy, FaMedal, FaBaby, FaUserSecret, FaSkull, FaGlobe, FaBomb, FaBug, FaCode, FaLock } from 'react-icons/fa';

const AdminBadges = () => {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentBadge, setCurrentBadge] = useState({
        name: '',
        description: '',
        icon: 'FaMedal',
        condition_type: 'total_solves',
        condition_value: 0
    });
    const addNotification = useNotification();

    const iconOptions = [
        { name: 'FaMedal', icon: <FaMedal /> },
        { name: 'FaTrophy', icon: <FaTrophy /> },
        { name: 'FaBaby', icon: <FaBaby /> },
        { name: 'FaUserSecret', icon: <FaUserSecret /> },
        { name: 'FaSkull', icon: <FaSkull /> },
        { name: 'FaGlobe', icon: <FaGlobe /> },
        { name: 'FaBomb', icon: <FaBomb /> },
        { name: 'FaBug', icon: <FaBug /> },
        { name: 'FaCode', icon: <FaCode /> },
        { name: 'FaLock', icon: <FaLock /> },
    ];

    useEffect(() => {
        fetchBadges();
    }, []);

    const fetchBadges = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await api.get('/admin/badges', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setBadges(response.data);
        } catch (error) {
            console.error('Failed to fetch badges:', error);
            addNotification('Failed to fetch badges', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentBadge({ ...currentBadge, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('access_token');
            if (isEditing) {
                await api.put(`/admin/badges/${currentBadge.id}`, currentBadge, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                addNotification('Badge updated successfully', 'success');
            } else {
                await api.post('/admin/badges', currentBadge, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                addNotification('Badge created successfully', 'success');
            }
            fetchBadges();
            resetForm();
        } catch (error) {
            console.error('Failed to save badge:', error);
            addNotification('Failed to save badge', 'error');
        }
    };

    const handleEdit = (badge) => {
        setCurrentBadge(badge);
        setIsEditing(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this badge?')) return;
        try {
            const token = localStorage.getItem('access_token');
            await api.delete(`/admin/badges/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            addNotification('Badge deleted successfully', 'success');
            fetchBadges();
        } catch (error) {
            console.error('Failed to delete badge:', error);
            addNotification('Failed to delete badge', 'error');
        }
    };

    const resetForm = () => {
        setCurrentBadge({
            name: '',
            description: '',
            icon: 'FaMedal',
            condition_type: 'total_solves',
            condition_value: 0
        });
        setIsEditing(false);
    };

    const getIconComponent = (iconName) => {
        const option = iconOptions.find(opt => opt.name === iconName);
        return option ? option.icon : <FaMedal />;
    };

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen">
            <h1 className="text-3xl font-bold mb-8 neon-text">Manage Badges</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="glass-panel p-6 rounded-xl h-fit">
                    <h2 className="text-xl font-semibold mb-4 text-white">{isEditing ? 'Edit Badge' : 'Create New Badge'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={currentBadge.name}
                                onChange={handleInputChange}
                                required
                                className="w-full glass-input rounded-lg px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                            <textarea
                                name="description"
                                value={currentBadge.description}
                                onChange={handleInputChange}
                                required
                                className="w-full glass-input rounded-lg px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Icon</label>
                            <div className="grid grid-cols-5 gap-2 mb-2">
                                {iconOptions.map((opt) => (
                                    <button
                                        key={opt.name}
                                        type="button"
                                        onClick={() => setCurrentBadge({ ...currentBadge, icon: opt.name })}
                                        className={`p-2 rounded-lg flex items-center justify-center text-xl transition-all duration-200 ${currentBadge.icon === opt.name ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                                        title={opt.name}
                                    >
                                        {opt.icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Condition Type</label>
                                <select
                                    name="condition_type"
                                    value={currentBadge.condition_type}
                                    onChange={handleInputChange}
                                    className="w-full glass-input rounded-lg px-3 py-2"
                                >
                                    <option value="total_solves" className="bg-gray-800">Total Solves</option>
                                    <option value="total_challenges_solved" className="bg-gray-800">Total Challenges Solved</option>
                                    <option value="total_machines_solved" className="bg-gray-800">Total Machines Solved</option>
                                    <option value="first_blood_count" className="bg-gray-800">First Blood Count</option>
                                    <option value="specific_machine_id" className="bg-gray-800">Specific Machine ID</option>
                                    <option value="specific_challenge_id" className="bg-gray-800">Specific Challenge ID</option>
                                    <option value="category_score:Web" className="bg-gray-800">Web Score</option>
                                    <option value="category_score:Pwn" className="bg-gray-800">Pwn Score</option>
                                    <option value="category_score:Crypto" className="bg-gray-800">Crypto Score</option>
                                    <option value="category_score:Forensics" className="bg-gray-800">Forensics Score</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Threshold Value</label>
                                <input
                                    type="number"
                                    name="condition_value"
                                    value={currentBadge.condition_value}
                                    onChange={handleInputChange}
                                    className="w-full glass-input rounded-lg px-3 py-2"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <button
                                type="submit"
                                className="flex-1 glass-button py-2 px-4 rounded-lg font-bold flex items-center justify-center gap-2"
                            >
                                {isEditing ? <FaEdit /> : <FaPlus />}
                                {isEditing ? 'Update' : 'Create'}
                            </button>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="glass-button-secondary py-2 px-4 rounded-lg font-bold hover:bg-white/10"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-semibold mb-4 text-white">Existing Badges</h2>
                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Loading...</div>
                    ) : badges.length === 0 ? (
                        <div className="glass-panel p-8 text-center text-gray-400 rounded-xl">No badges found. Create one!</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {badges.map((badge) => (
                                <div key={badge.id} className="glass-card p-4 rounded-xl flex items-start gap-4 group">
                                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl text-yellow-400 flex-shrink-0 shadow-lg group-hover:shadow-yellow-500/20 transition-all duration-300">
                                        {getIconComponent(badge.icon)}
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-lg text-white group-hover:text-purple-300 transition-colors">{badge.name}</h3>
                                        <p className="text-gray-400 text-sm mb-2 line-clamp-2">{badge.description}</p>
                                        <div className="text-xs text-purple-300 bg-purple-900/20 border border-purple-500/30 px-2 py-1 rounded inline-block">
                                            Condition: {badge.condition_type} &ge; {badge.condition_value}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <button
                                            onClick={() => handleEdit(badge)}
                                            className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-500/10 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(badge.id)}
                                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminBadges;
