import React from 'react';
import { motion } from 'framer-motion';

const TeaserCard = ({ machine }) => {
  return (
    <motion.div
      className="relative overflow-hidden rounded-lg border border-gray-700 bg-gray-800 p-6 grayscale-[80%] opacity-70"
      whileHover={{ opacity: 1, scale: 1.05 }}
    >
      <div className="absolute top-2 right-[-30px] rotate-45 bg-purple-600 px-8 py-1 text-xs font-bold uppercase tracking-wider text-white">
        Coming Soon
      </div>
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-400">{machine.name}</h3>
      </div>
      <div>
        <p className="text-base text-gray-500">Releases: {machine.releaseDate}</p>
      </div>
    </motion.div>
  );
};

export default TeaserCard;