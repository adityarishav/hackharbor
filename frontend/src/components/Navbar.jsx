import React, { useContext } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { useNotification } from './Notification';
import UserProfileDropdown from './UserProfileDropdown'; // Your dropdown component
import api from '../services/api.js';
import Logo from '../assets/react.svg';

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const addNotification = useNotification();


  const getNavLinkClass = ({ isActive }) => {
    return isActive ? "text-accent border-b-2 border-accent" : "";
  };

  const handleDownloadVpnConfig = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.post('/vpn/generate-config', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob', // Important for downloading files
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'client.ovpn');
      document.body.appendChild(link);
      link.click();
      link.remove();
      addNotification('VPN config downloaded!', 'success');
    } catch (error) {
      console.error('Failed to download VPN config:', error);
      addNotification('Failed to download VPN config!', 'error');
    }
  };

  return (
    <header className="bg-gray-800 text-white shadow-md">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        
        {/* Left Section: Logo */}
        <div className="flex items-center">
          <Link to="/dashboard">
            {/* <img src={Logo} alt="HackHarbor Logo" className="h-8 w-auto" /> */}
            <h3 className="text-4xl font-bold mb-4 text-purple-400">HackHarbor</h3>
          </Link>
        </div>

        {/* Middle Section: Navigation Links */}
        {/* TODO: Implement a hamburger menu for mobile devices */}
        <div className="hidden md:flex items-center space-x-8">
          <NavLink to="/dashboard" className={getNavLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/machines" className={getNavLinkClass}>
            Machines
          </NavLink>
          <NavLink to="/challenges" className={getNavLinkClass}>
            Challenges
          </NavLink>
          {/* <a 
            href={`${import.meta.env.VITE_API_BASE_URL}/api/vpn/generate-config`} 
            download="hackharbor.ovpn"
            className="hover:text-gray-300 transition-colors"
          >
            Download VPN
          </a> */}
          <button onClick={handleDownloadVpnConfig} className="hover:text-gray-300 transition-colors">Download VPN</button>

          {user && user.role === 'admin' && (
            <NavLink to="/admin" className={getNavLinkClass}>
              Admin Panel
            </NavLink>
          )}
        </div>

        {/* Right Section: User Actions */}
        <div className="flex items-center">
          <UserProfileDropdown />
        </div>

      </nav>
    </header>
  );
};

export default Navbar;