import React, { useState, useEffect } from 'react';
import TeaserCard from './TeaserCard';
import { motion } from 'framer-motion';
import api from '../services/api';

const ComingSoonSection = () => {
  const [upcomingMachines, setUpcomingMachines] = useState([]);
  const [upcomingChallenges, setUpcomingChallenges] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        console.log(headers)
        const [machinesRes, challengesRes] = await Promise.all([
          api.get('/machines/upcoming'),
          api.get('/ch/upcoming')
        ]);


        setUpcomingMachines(machinesRes.data);

        // Filter out duplicates by title
        const uniqueChallenges = challengesRes.data.filter((challenge, index, self) =>
          index === self.findIndex((t) => t.title === challenge.title)
        );
        setUpcomingChallenges(uniqueChallenges);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <motion.div
      className="glass-panel py-16 px-8 rounded-2xl"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h2 className="mb-12 text-center text-4xl font-bold neon-text">On the Horizon</h2>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-2">
        <div>
          <h3 className="mb-6 border-b border-white/10 pb-2 text-2xl font-semibold text-purple-300">
            Upcoming Machines
          </h3>
          <div className="grid gap-6">
            {upcomingMachines.length > 0 ? upcomingMachines.map((machine) => (
              <TeaserCard key={machine.id} machine={machine} />
            )) : <p className="text-gray-400">No upcoming machines.</p>}
          </div>
        </div>
        <div>
          <h3 className="mb-6 border-b border-white/10 pb-2 text-2xl font-semibold text-blue-300">Upcoming Challenges</h3>
          <div className="grid gap-6">
            {upcomingChallenges.length > 0 ? upcomingChallenges.map((challenge) => (
              <div key={challenge.id} className="glass-card p-6 rounded-xl border-l-4 border-blue-500">
                <div className="mb-2 flex items-baseline justify-between">
                  <h4 className="text-lg font-bold text-white">{challenge.title}</h4>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">{challenge.category}</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  Difficulty: {challenge.difficulty} | Points: {challenge.points}
                </p>
              </div>
            )) : (
              <div className="glass-card p-6 rounded-xl">
                <div className="mb-2 flex items-baseline justify-between">
                  <h4 className="text-lg font-bold text-gray-400">No upcoming challenges</h4>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ComingSoonSection;
