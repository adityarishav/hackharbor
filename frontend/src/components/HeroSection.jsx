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
      className="glass-panel p-8 rounded-2xl mb-8"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-4xl font-bold mb-6">Welcome back, <span className="neon-text">{username}</span>!</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <motion.div className="glass-card p-6 rounded-xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <p className="text-lg text-gray-400 mb-2">Your Score</p>
          <p className="text-4xl font-bold text-purple-400">{score}</p>
        </motion.div>
        <motion.div className="glass-card p-6 rounded-xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <p className="text-lg text-gray-400 mb-2">Your Rank</p>
          <p className="text-4xl font-bold text-purple-400">{rank.name}</p>
        </motion.div>
        <motion.div className="glass-card p-6 rounded-xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <p className="text-lg text-gray-400 mb-2">Machines Owned</p>
          <p className="text-4xl font-bold text-purple-400">{completedMachines} / {totalMachines}</p>
        </motion.div>
      </div>
      <div className="mt-8">
        <div className="flex justify-between mb-2">
          <span className="text-base font-medium text-gray-300">Progress to next rank</span>
          <span className="text-sm font-medium text-purple-400">{rank.progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-900/50 rounded-full h-3 border border-white/5">
          <motion.div
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full shadow-[0_0_10px_rgba(147,51,234,0.5)]"
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