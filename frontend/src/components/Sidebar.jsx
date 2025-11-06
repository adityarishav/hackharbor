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
        <div className="h-full bg-gray-800 text-white flex flex-col w-64">
            <div className="flex items-center justify-center h-20 border-b border-gray-700">
                <Link to="/">
                    <h3>HackHarbor</h3>
                </Link>
            </div>
            <ul className="flex-grow p-4">
                <li className={`mb-2 ${location.pathname.startsWith('/dashboard') ? 'bg-gray-700 rounded' : ''}`}>
                    <Link to="/dashboard" className="flex items-center p-3 rounded hover:bg-gray-700">
                        <FaBoxOpen className="mr-3" />
                        <span>Dashboard</span>
                    </Link>
                </li>
                {user && user.role === 'admin' && (
                    <li className={`mb-2 ${location.pathname.startsWith('/admin') ? 'bg-gray-700 rounded' : ''}`}>
                        <Link to="/admin" className="flex items-center p-3 rounded hover:bg-gray-700">
                            <FaUserShield className="mr-3" />
                            <span>Admin</span>
                        </Link>
                    </li>
                )}
            </ul>
            <div className="p-4 border-t border-gray-700">
                 <div className="text-center mb-4">
                    <span>Welcome, {user ? user.sub : 'Guest'}</span>
                </div>
                <button onClick={handleLogout} className="w-full flex items-center justify-center p-3 bg-red-600 rounded hover:bg-red-700">
                    <FaSignOutAlt className="mr-2" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
