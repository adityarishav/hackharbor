import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBoxOpen, FaUserShield, FaSignOutAlt } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';

const Sidebar = ({ handleLogout }) => {
    const location = useLocation();
    const token = localStorage.getItem('access_token');
    let user = null;
    if (token) {
        try {
            user = jwtDecode(token);

        } catch (e) {
            console.error("Sidebar: Invalid token", e);
        }
    }


    return (
        <div className="h-full glass-panel border-r border-white/10 flex flex-col w-64">
            <div className="flex items-center justify-center h-20 border-b border-white/10">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xl">H</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">HackHarbor</h3>
                </Link>
            </div>
            <ul className="flex-grow p-4 space-y-2">
                <li>
                    <Link
                        to="/dashboard"
                        className={`flex items-center p-3 rounded-xl transition-all duration-300 ${location.pathname.startsWith('/dashboard')
                                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <FaBoxOpen className="mr-3" />
                        <span>Dashboard</span>
                    </Link>
                </li>
                {user && user.role === 'admin' && (
                    <li>
                        <Link
                            to="/admin"
                            className={`flex items-center p-3 rounded-xl transition-all duration-300 ${location.pathname.startsWith('/admin')
                                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <FaUserShield className="mr-3" />
                            <span>Admin</span>
                        </Link>
                    </li>
                )}
            </ul>
            <div className="p-4 border-t border-white/10">
                <div className="text-center mb-4">
                    <span className="text-gray-400 text-sm">Welcome, </span>
                    <span className="text-purple-400 font-semibold">{user ? user.sub : 'Guest'}</span>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl transition-all duration-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                    <FaSignOutAlt className="mr-2" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
