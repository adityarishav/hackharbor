import React, { useState, useEffect } from 'react';
import TeaserCard from './TeaserCard';
import { motion } from 'framer-motion';
import api from '../services/api';

const ComingSoonSection = () => {
  const [upcomingMachines, setUpcomingMachines] = useState([]);

  useEffect(() => {
    const fetchUpcomingMachines = async () => {
      try {
        const response = await api.get('/machines/upcoming');
        setUpcomingMachines(response.data);
      } catch (error) {
        console.error('Failed to fetch upcoming machines:', error);
      }
    };

    fetchUpcomingMachines();
  }, []);

  return (
    <motion.div
      className="bg-gray-900 py-16 px-8"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h2 className="mb-12 text-center text-4xl font-bold text-gray-200">On the Horizon</h2>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-2">
        <div>
          <h3 className="mb-6 border-b-2 border-gray-800 pb-2 text-2xl font-semibold text-gray-300">
            Upcoming Machines
          </h3>
          <div className="grid gap-6">
            {upcomingMachines.map((machine) => (
              <TeaserCard key={machine.id} machine={machine} />
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-6 border-b-2 border-gray-800 pb-2 text-2xl font-semibold text-gray-300">Events</h3>
          <div className="flex flex-col gap-6">
            <div className="rounded-lg bg-gray-800 p-6">
              <div className="mb-2 flex items-baseline justify-between">
                <h4 className="text-lg font-bold text-gray-200">No upcoming events</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ComingSoonSection;