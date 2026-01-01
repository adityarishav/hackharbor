import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNotification } from '../components/Notification';
import { FaBullhorn, FaCalendarAlt, FaTrash, FaPlus } from 'react-icons/fa';
import AdminPageLayout from '../layouts/AdminPageLayout';

const AdminAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [events, setEvents] = useState([]);
    const [activeTab, setActiveTab] = useState('announcements');
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', description: '' });
    const [newEvent, setNewEvent] = useState({ title: '', description: '', start_date: '', end_date: '', location: '' });
    const addNotification = useNotification();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const headers = { Authorization: `Bearer ${token}` };
            const [annRes, eventRes] = await Promise.all([
                api.get('/announcements/', { headers }),
                api.get('/events/', { headers })
            ]);
            setAnnouncements(annRes.data);
            setEvents(eventRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            addNotification('Failed to load data.', 'error');
        }
    };

    const handleCreateAnnouncement = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('access_token');
            await api.post('/admin/announcements/', newAnnouncement, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addNotification('Announcement created successfully!', 'success');
            setNewAnnouncement({ title: '', description: '' });
            fetchData();
        } catch (error) {
            console.error('Failed to create announcement:', error);
            addNotification('Failed to create announcement.', 'error');
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return;
        try {
            const token = localStorage.getItem('access_token');
            await api.delete(`/admin/announcements/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addNotification('Announcement deleted successfully!', 'success');
            fetchData();
        } catch (error) {
            console.error('Failed to delete announcement:', error);
            addNotification('Failed to delete announcement.', 'error');
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('access_token');
            // Ensure dates are in ISO format
            const eventData = {
                ...newEvent,
                start_date: new Date(newEvent.start_date).toISOString(),
                end_date: new Date(newEvent.end_date).toISOString()
            };
            await api.post('/admin/events/', eventData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addNotification('Event created successfully!', 'success');
            setNewEvent({ title: '', description: '', start_date: '', end_date: '', location: '' });
            fetchData();
        } catch (error) {
            console.error('Failed to create event:', error);
            addNotification('Failed to create event.', 'error');
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;
        try {
            const token = localStorage.getItem('access_token');
            await api.delete(`/admin/events/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addNotification('Event deleted successfully!', 'success');
            fetchData();
        } catch (error) {
            console.error('Failed to delete event:', error);
            addNotification('Failed to delete event.', 'error');
        }
    };

    return (
        <AdminPageLayout title="Manage Announcements & Events">
            {/* Tabs */}
            <div className="flex space-x-4 mb-8 border-b border-gray-700">
                <button
                    onClick={() => setActiveTab('announcements')}
                    className={`pb-2 px-4 font-medium transition-colors relative ${activeTab === 'announcements' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
                >
                    <div className="flex items-center gap-2">
                        <FaBullhorn /> Announcements
                    </div>
                    {activeTab === 'announcements' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />}
                </button>
                <button
                    onClick={() => setActiveTab('events')}
                    className={`pb-2 px-4 font-medium transition-colors relative ${activeTab === 'events' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
                >
                    <div className="flex items-center gap-2">
                        <FaCalendarAlt /> Events
                    </div>
                    {activeTab === 'events' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />}
                </button>
            </div>

            {activeTab === 'announcements' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Create Form */}
                    <div className="glass-panel p-6 rounded-xl h-fit">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <FaPlus className="text-purple-400" /> New Announcement
                        </h3>
                        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newAnnouncement.title}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                    className="glass-input w-full rounded-lg px-4 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Description</label>
                                <textarea
                                    value={newAnnouncement.description}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, description: e.target.value })}
                                    className="glass-input w-full rounded-lg px-4 py-2 h-32"
                                    required
                                />
                            </div>
                            <button type="submit" className="glass-button w-full py-2 rounded-lg text-white font-bold hover:bg-purple-600/20 transition-colors">
                                Publish Announcement
                            </button>
                        </form>
                    </div>

                    {/* List */}
                    <div className="lg:col-span-2 space-y-4">
                        {announcements.map((ann) => (
                            <div key={ann.id} className="glass-panel p-6 rounded-xl flex justify-between items-start group">
                                <div>
                                    <h4 className="text-lg font-bold text-white mb-1">{ann.title}</h4>
                                    <p className="text-sm text-gray-400 mb-2">{new Date(ann.created_at).toLocaleDateString()}</p>
                                    <p className="text-gray-300">{ann.description}</p>
                                </div>
                                <button
                                    onClick={() => handleDeleteAnnouncement(ann.id)}
                                    className="text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        ))}
                        {announcements.length === 0 && (
                            <p className="text-gray-500 text-center py-8">No announcements found.</p>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'events' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Create Form */}
                    <div className="glass-panel p-6 rounded-xl h-fit">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <FaPlus className="text-purple-400" /> New Event
                        </h3>
                        <form onSubmit={handleCreateEvent} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    className="glass-input w-full rounded-lg px-4 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Location</label>
                                <input
                                    type="text"
                                    value={newEvent.location}
                                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                    className="glass-input w-full rounded-lg px-4 py-2"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Start Date</label>
                                    <input
                                        type="datetime-local"
                                        value={newEvent.start_date}
                                        onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                                        className="glass-input w-full rounded-lg px-4 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">End Date</label>
                                    <input
                                        type="datetime-local"
                                        value={newEvent.end_date}
                                        onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                                        className="glass-input w-full rounded-lg px-4 py-2"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Description</label>
                                <textarea
                                    value={newEvent.description}
                                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                    className="glass-input w-full rounded-lg px-4 py-2 h-32"
                                    required
                                />
                            </div>
                            <button type="submit" className="glass-button w-full py-2 rounded-lg text-white font-bold hover:bg-purple-600/20 transition-colors">
                                Create Event
                            </button>
                        </form>
                    </div>

                    {/* List */}
                    <div className="lg:col-span-2 space-y-4">
                        {events.map((event) => (
                            <div key={event.id} className="glass-panel p-6 rounded-xl flex justify-between items-start group">
                                <div>
                                    <h4 className="text-lg font-bold text-white mb-1">{event.title}</h4>
                                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                                        <span>{new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{event.location}</span>
                                    </div>
                                    <p className="text-gray-300">{event.description}</p>
                                </div>
                                <button
                                    onClick={() => handleDeleteEvent(event.id)}
                                    className="text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        ))}
                        {events.length === 0 && (
                            <p className="text-gray-500 text-center py-8">No events found.</p>
                        )}
                    </div>
                </div>
            )}
        </AdminPageLayout>
    );
};

export default AdminAnnouncements;
