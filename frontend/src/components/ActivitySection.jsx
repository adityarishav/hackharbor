import React, { useState, useEffect, useContext } from 'react';
import MachineCard from './MachineCard';
import './ActivitySection.css';
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
    <div className="activity-section">
      <h2 className="section-title">What's New</h2>
      <div className="columns">
        <div className="column">
          <h3 className="column-title">Recently Added Machines</h3>
          <div className="machine-cards-container">
            {machines.map((machine) => (
              <MachineCard key={machine.id} machine={machine} />
            ))}
          </div>
        </div>
        <div className="column">
          <h3 className="column-title">Announcements</h3>
          <div className="announcements-container">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="announcement-item">
                <div className="announcement-header">
                  <h4 className="announcement-title">{announcement.title}</h4>
                  <p className="announcement-date">{new Date(announcement.created_at).toLocaleDateString()}</p>
                </div>
                <p className="announcement-description">{announcement.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivitySection;