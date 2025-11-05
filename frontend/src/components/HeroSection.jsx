import React from 'react';
import { motion } from 'framer-motion';

const HeroSection = ({ username, score, completedMachines, totalMachines }) => {

  const getRank = (score) => {
    if (score >= 1000) return { name: 'Elite Hacker', progress: 100 };
    if (score >= 500) return { name: 'Pro Hacker', progress: (score / 1000) * 100 };
    if (score >= 100) return { name: 'Hacker', progress: (score / 500) * 100 };
    return { name: 'Rookie', progress: (score / 100) * 100 };
  };

  const rank = getRank(score);
  const progress = (completedMachines / totalMachines) * 100;

  return (
    <motion.div 
      className="bg-gray-800 p-8 rounded-lg shadow-lg mb-8"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-4xl font-bold mb-4">Welcome , <span className="text-primary">{username}</span>!</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <motion.div className="bg-gray-700 p-4 rounded-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <p className="text-lg text-gray-400">Your Score</p>
          <p className="text-3xl font-bold text-primary">{score}</p>
        </motion.div>
        <motion.div className="bg-gray-700 p-4 rounded-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <p className="text-lg text-gray-400">Your Rank</p>
          <p className="text-3xl font-bold text-primary">{rank.name}</p>
        </motion.div>
        <motion.div className="bg-gray-700 p-4 rounded-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <p className="text-lg text-gray-400">Machines Owned</p>
          <p className="text-3xl font-bold text-primary">{completedMachines} / {totalMachines}</p>
        </motion.div>
      </div>
      <div className="mt-8">
        <div className="flex justify-between mb-1">
          <span className="text-base font-medium text-primary">Progress to next rank</span>
          <span className="text-sm font-medium text-primary">{rank.progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <motion.div 
            className="bg-primary h-2.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${rank.progress}%` }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default HeroSection;