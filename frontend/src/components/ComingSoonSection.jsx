import React from 'react';
import TeaserCard from './TeaserCard';
import { motion } from 'framer-motion';

const ComingSoonSection = () => {
  // Mock data for upcoming machines
  const upcomingMachines = [
    { id: 1, name: 'CrypTonic', releaseDate: 'Oct 15, 2025' },
    { id: 2, name: 'FireWall', releaseDate: 'Nov 1, 2025' },
  ];

  // Mock data for upcoming events
  const upcomingEvents = [
    {
      id: 1,
      name: 'Weekend CTF Challenge',
      date: 'Oct 25-26, 2025',
      description: 'A 48-hour capture-the-flag event with exclusive prizes.',
    },
    {
      id: 2,
      name: 'Workshop: Intro to Reverse Engineering',
      date: 'Nov 8, 2025',
      description: 'A live workshop covering the basics of reverse engineering.',
    },
  ];

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
            {upcomingEvents.map((event) => (
              <div key={event.id} className="rounded-lg bg-gray-800 p-6">
                <div className="mb-2 flex items-baseline justify-between">
                  <h4 className="text-lg font-bold text-gray-200">{event.name}</h4>
                  <p className="text-sm text-gray-400">{event.date}</p>
                </div>
                <p className="text-base text-gray-300">{event.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ComingSoonSection;