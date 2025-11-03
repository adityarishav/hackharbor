import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBoxOpen, FaUserShield } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';
import './Sidebar.css';

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
        <div className="sidebar">
            <div className="sidebar-header">
                <Link to="/">
                    <h3>VulnVerse</h3>
                </Link>
            </div>
            <ul className="sidebar-menu">
                <li className={location.pathname.startsWith('/dashboard') ? 'active' : ''}>
                    <Link to="/dashboard">
                        <FaBoxOpen />
                        <span>Dashboard</span>
                    </Link>
                </li>
                {user && user.role === 'admin' && (
                    <li className={location.pathname.startsWith('/admin') ? 'active' : ''}>
                        <Link to="/admin">
                            <FaUserShield />
                            <span>Admin</span>
                        </Link>
                    </li>
                )}
            </ul>
            <div className="sidebar-footer">
                 <div className="user-info">
                    <span>Welcome, {user ? user.sub : 'Guest'}</span>
                </div>
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
