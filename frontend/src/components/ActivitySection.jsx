import React, { useState, useEffect, useContext } from 'react';
import MachineCard from './MachineCard';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const ActivitySection = ({ searchQuery }) => {
  const [machines, setMachines] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await api.get('/machines/', {
          headers: { Authorization: `Bearer ${token}` },
          params: { search: searchQuery }
        });
        setMachines(response.data);
      } catch (error) {
        console.error('Error fetching machines:', error);
      }
    };

    const fetchAnnouncements = async () => {
        try {
            const response = await api.get('/announcements/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnnouncements(response.data);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        }
    };

    fetchMachines();
    fetchAnnouncements();
  }, [token, searchQuery]);

  return (
    <div className="py-16 px-8 bg-gray-800">
      <h2 className="text-4xl font-bold text-gray-200 text-center mb-12">What's New</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
        <div>
          <h3 className="text-2xl font-semibold text-gray-300 mb-6 border-b-2 border-gray-700 pb-2">Recently Added Machines</h3>
          <div className="grid gap-6">
            {machines.map((machine) => (
              <MachineCard key={machine.id} machine={machine} />
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-semibold text-gray-300 mb-6 border-b-2 border-gray-700 pb-2">Announcements</h3>
          <div className="flex flex-col gap-6">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="bg-gray-700 p-6 rounded-lg">
                <div className="flex justify-between items-baseline mb-2">
                  <h4 className="text-xl font-semibold text-gray-200">{announcement.title}</h4>
                  <p className="text-sm text-gray-400">{new Date(announcement.created_at).toLocaleDateString()}</p>
                </div>
                <p className="text-base text-gray-300">{announcement.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivitySection;
