import React, { useContext } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { FaGraduationCap, FaBook, FaCode, FaHome, FaArrowLeft } from 'react-icons/fa';
import { AuthContext } from '../contexts/AuthContext';

const AcademyLayout = () => {
    const location = useLocation();
    const { user } = useContext(AuthContext);

    return (
        <div className="min-h-screen bg-gray-900 text-cyan-400 font-mono flex">
            {/* Academy Sidebar */}
            <aside className="w-64 bg-black/80 border-r border-cyan-500/30 flex flex-col fixed h-full z-20 backdrop-blur-md">
                <div className="p-6 border-b border-cyan-500/30 flex items-center justify-center">
                    <FaGraduationCap className="text-4xl text-cyan-400 animate-pulse" />
                    <h1 className="ml-3 text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                        ACADEMY
                    </h1>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                    <Link
                        to="/academy"
                        className={`flex items-center px-4 py-3 rounded-lg transition-all duration-300 ${location.pathname === '/academy'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                            : 'text-gray-500 hover:text-cyan-400 hover:bg-cyan-900/20'
                            }`}
                    >
                        <FaHome className="mr-3" /> Dashboard
                    </Link>

                    <div className="pt-4 pb-2">
                        <p className="px-4 text-xs font-bold text-gray-600 uppercase tracking-widest">Modules</p>
                    </div>
                    {/* We can map modules here later, for now static link to modules list */}
                    <Link
                        to="/academy"
                        className="flex items-center px-4 py-3 rounded-lg text-gray-500 hover:text-cyan-400 hover:bg-cyan-900/20 transition-all duration-300"
                    >
                        <FaBook className="mr-3" /> All Modules
                    </Link>

                    {user && user.role === 'admin' && (
                        <>
                            <div className="pt-4 pb-2">
                                <p className="px-4 text-xs font-bold text-gray-600 uppercase tracking-widest">Instructor</p>
                            </div>
                            <Link
                                to="/academy/instructor"
                                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-300 ${location.pathname === '/academy/instructor'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                                    : 'text-gray-500 hover:text-purple-400 hover:bg-purple-900/20'
                                    }`}
                            >
                                <FaCode className="mr-3" /> Instructor Panel
                            </Link>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-cyan-500/30">
                    <Link
                        to="/dashboard"
                        className="flex items-center justify-center w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all duration-300 border border-gray-700 hover:border-gray-500"
                    >
                        <FaArrowLeft className="mr-2" /> Exit Academy
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-64 p-8 relative overflow-hidden">
                {/* Background Grid Effect */}
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AcademyLayout;
