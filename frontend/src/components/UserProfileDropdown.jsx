import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCog, FaCreditCard, FaShieldAlt, FaSignOutAlt } from 'react-icons/fa';
import { AuthContext } from '../contexts/AuthContext';

const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="relative">
      <motion.button
        onClick={toggleDropdown}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 text-white"
        whileHover={{ boxShadow: '0 0 15px rgba(99, 102, 241, 0.6)' }}
      >
        {/* User initials or avatar image */}
        <span className="font-bold">{getInitials(user?.username)}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-48 rounded-md bg-gray-800 shadow-lg ring-1 ring-white ring-opacity-10"
          >
            <div className="py-1">
              <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                <FaCog className="mr-3" />
                Settings
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                <FaCreditCard className="mr-3" />
                Billing
              </a>
              <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                <FaShieldAlt className="mr-3" />
                VPN Settings
              </a>
              <div className="my-1 border-t border-gray-700"></div>
              <button onClick={logout} className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                <FaSignOutAlt className="mr-3" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfileDropdown;