import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCog, FaCreditCard, FaShieldAlt, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import { AuthContext } from '../contexts/AuthContext';

const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const dropdownRef = React.useRef(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase();
  };

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={toggleDropdown}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg border border-white/20"
        whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)' }}
        whileTap={{ scale: 0.95 }}
      >
        {/* User initials or avatar image */}
        <span className="font-bold">{getInitials(user?.username)}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-56 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden z-[100] shadow-2xl"
          >
            <div className="py-1">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm text-gray-400">Signed in as</p>
                <p className="text-sm font-bold text-white truncate">{user?.username}</p>
              </div>

              <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors" onClick={() => setIsOpen(false)}>
                <FaUserCircle className="mr-3 text-purple-400" />
                Profile
              </Link>
              <Link to="/settings" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors" onClick={() => setIsOpen(false)}>
                <FaCog className="mr-3 text-blue-400" />
                Settings
              </Link>
              <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors" onClick={() => setIsOpen(false)}>
                <FaCreditCard className="mr-3 text-green-400" />
                Billing
              </a>
              <Link to="/vpn" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors" onClick={() => setIsOpen(false)}>
                <FaShieldAlt className="mr-3 text-yellow-400" />
                VPN Settings
              </Link>
              <div className="my-1 border-t border-white/10"></div>
              <button onClick={() => { logout(); setIsOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
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