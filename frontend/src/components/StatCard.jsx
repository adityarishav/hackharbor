import React from 'react';

const StatCard = ({ title, value, icon }) => {
  return (
    <div className="transform rounded-lg bg-gray-800 p-6 shadow-lg transition-transform hover:scale-105">
      <div className="flex items-center">
        <div className="mr-4 text-4xl text-purple-500">{icon}</div>
        <div>
          <p className="text-3xl font-bold text-white">{value}</p>
          <p className="text-sm text-gray-400">{title}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;