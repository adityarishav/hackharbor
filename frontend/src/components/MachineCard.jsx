import React from 'react';
import { FaLinux, FaWindows, FaSkull, FaCheckCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const MachineCard = ({ machine, isAdmin = false }) => {
  const navigate = useNavigate();

  const difficultyColors = {
    Easy: 'bg-green-500',
    Medium: 'bg-yellow-500',
    Hard: 'bg-red-500',
    Insane: 'bg-purple-500',
  };

  const handleCardClick = () => {
    navigate(`/machines/${machine.id}`);
  };

  return (
    <div
      className={`relative rounded-lg bg-gray-800 shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 ${
        machine.is_deleted && isAdmin ? 'opacity-50 grayscale' : ''
      }`}
      onClick={handleCardClick}
    >
      {machine.is_deleted && isAdmin && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-10">
          <span className="text-red-400 text-xl font-bold">DELETED</span>
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">{machine.name}</h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              difficultyColors[machine.difficulty] || 'bg-gray-600'
            }`}
          >
            {machine.difficulty}
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{machine.description}</p>
        <div className="flex items-center justify-between text-gray-400 text-sm">
          <div className="flex items-center">
            {machine.operating_system === 'Linux' && <FaLinux className="mr-1" />}
            {machine.operating_system === 'Windows' && <FaWindows className="mr-1" />}
            <span>{machine.operating_system || 'N/A'}</span>
          </div>
          <div className="flex items-center">
            <FaSkull className="mr-1" />
            <span>{machine.solves || 0} Solves</span>
          </div>
        </div>
      </div>
      {isAdmin && (
        <div className="absolute top-2 right-2 flex space-x-2">
          {/* Admin actions can go here, e.g., edit/delete buttons */}
          {/* For now, just a placeholder or can be passed as props */}
        </div>
      )}
    </div>
  );
};

export default MachineCard;
