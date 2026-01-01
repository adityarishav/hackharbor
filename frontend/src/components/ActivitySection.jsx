import React, { useState, useEffect, useContext } from 'react';
import MachineCard from './MachineCard';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const ActivitySection = () => {
  const [machines, setMachines] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await api.get('/machines/', {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 4 }
        });
        setMachines(response.data);
      } catch (error) {
        console.error('Error fetching machines:', error);
      }
    };

    const fetchData = async () => {
      try {
        const [annRes, eventRes] = await Promise.all([
          api.get('/announcements/', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/events/', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setAnnouncements(annRes.data);
        setEvents(eventRes.data);
      } catch (error) {
        console.error('Error fetching activity data:', error);
      }
    };

    fetchMachines();
    fetchData();
  }, [token]);

  return (
    <div className="py-8">
      <h2 className="text-3xl font-bold text-white mb-8 neon-text">What's New</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-xl font-semibold text-purple-300 mb-6 border-b border-white/10 pb-4">Recently Added Machines</h3>
          <div className="grid gap-4">
            {machines.map((machine) => (
              <MachineCard key={machine.id} machine={machine} />
            ))}
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl space-y-8">
          {/* Announcements */}
          <div>
            <h3 className="text-xl font-semibold text-purple-300 mb-6 border-b border-white/10 pb-4">Announcements</h3>
            <div className="flex flex-col gap-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
              {announcements.length > 0 ? announcements.map((announcement) => (
                <div key={announcement.id} className="glass-card p-4 rounded-xl shrink-0">
                  <div className="flex justify-between items-baseline mb-2">
                    <h4 className="text-lg font-semibold text-white">{announcement.title}</h4>
                    <p className="text-xs text-gray-400">{new Date(announcement.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm text-gray-300">{announcement.description}</p>
                </div>
              )) : <p className="text-gray-500">No announcements yet.</p>}
            </div>
          </div>

          {/* Upcoming Events */}
          <div>
            <h3 className="text-xl font-semibold text-blue-300 mb-6 border-b border-white/10 pb-4">Upcoming Events</h3>
            <div className="flex flex-col gap-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
              {events.length > 0 ? events.map((event) => (
                <div key={event.id} className="glass-card p-4 rounded-xl border-l-4 border-blue-500 shrink-0">
                  <div className="flex justify-between items-baseline mb-2">
                    <h4 className="text-lg font-semibold text-white">{event.title}</h4>
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">{event.location}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-300">{event.description}</p>
                </div>
              )) : <p className="text-gray-500">No upcoming events.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivitySection;
