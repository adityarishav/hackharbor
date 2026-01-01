import React, { useContext } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { useNotification } from './Notification';
import UserProfileDropdown from './UserProfileDropdown';
import api from '../services/api';

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const addNotification = useNotification();
  const [vpnConnected, setVpnConnected] = React.useState(false);

  React.useEffect(() => {
    const checkVpnStatus = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem('access_token');
        const response = await api.get('/vpn/status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVpnConnected(response.data.connected);
      } catch (error) {
        console.error('Failed to check VPN status:', error);
      }
    };

    checkVpnStatus();
    const interval = setInterval(checkVpnStatus, 10000); 
    return () => clearInterval(interval);
  }, [user]);

  const getNavLinkClass = ({ isActive }) => {
    return `px-4 py-2 rounded-lg transition-all duration-300 ${isActive
      ? "bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
      : "text-gray-400 hover:text-white hover:bg-white/5"
      }`;
  };

  const handleDownloadVpnConfig = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.post('/vpn/generate-config', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob', 
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
    <header className="sticky top-0 z-50 px-6 py-4">
      <nav className="container mx-auto glass-panel rounded-2xl px-6 py-3 flex justify-between items-center">

        {/* Left Section: Logo */}
        <div className="flex items-center">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-purple-500/50 transition-all duration-300">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 group-hover:from-purple-300 group-hover:to-blue-300 transition-all duration-300">
              HackHarbor
            </h3>
          </Link>
        </div>

        {/* Middle Section: Navigation Links */}
        <div className="hidden md:flex items-center space-x-2">
          <NavLink to="/dashboard" className={getNavLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/machines" className={getNavLinkClass}>
            Machines
          </NavLink>
          <NavLink to="/challenges" className={getNavLinkClass}>
            Challenges
          </NavLink>
          



          <button
            onClick={handleDownloadVpnConfig}
            className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300 flex items-center gap-2"
          >
            <span>Download Vpn</span>
          </button>
          <NavLink to="/academy" className={getNavLinkClass}>
            Academy
          </NavLink>

          {user && user.role === 'admin' && (
            <NavLink to="/admin" className={getNavLinkClass}>
              Admin Panel
            </NavLink>
          )}
        </div>

        {/* Right Section: User Actions */}
        <div className="flex items-center">
          {/* Active Machine/Challenge Indicator */}
          {(user?.active_machines?.length > 0 || user?.active_challenges?.length > 0) && (
            <div className="hidden lg:flex items-center px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg mr-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></div>
              <span className="text-xs font-medium text-green-400">
                {user.active_machines.length > 0 ? user.active_machines[0].name : user.active_challenges[0].title}
              </span>
            </div>
          )}

          {/* VPN Status Indicator */}
          <div className="flex items-center px-3 py-1 bg-gray-800/50 border border-white/5 rounded-lg mr-2" title={vpnConnected ? "VPN Status: Connected" : "VPN Status: Disconnected"}>
            <div className={`w-2 h-2 rounded-full mr-2 ${vpnConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></div>
            <span className="text-xs font-medium text-gray-400">VPN</span>
          </div>

          <UserProfileDropdown />
        </div>

      </nav>
    </header>
  );
};

export default Navbar;