import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FaBookOpen, FaCode, FaLock, FaCheckCircle, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';

const AcademyLanding = () => {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await api.get('/academy/modules', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setModules(response.data);
        } catch (error) {
            console.error('Failed to fetch modules:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    return (
        <div>
            <header className="mb-12 text-center">
                <h1 className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 neon-text">
                    SYSTEM CORE ACADEMY
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    Master the art of cybersecurity through interactive modules and hands-on labs.
                    Upgrade your neural link with advanced knowledge.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {modules.map((module, index) => (
                    <motion.div
                        key={module.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative bg-gray-900/50 border border-cyan-500/20 rounded-xl overflow-hidden hover:border-cyan-500/60 transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                    >
                        <div className="h-48 bg-gray-800 relative overflow-hidden">
                            {module.cover_image ? (
                                <img
                                    src={module.cover_image}
                                    alt={module.title}
                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                    <FaCode className="text-6xl text-gray-700 group-hover:text-cyan-500/50 transition-colors duration-300" />
                                </div>
                            )}
                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-cyan-500/30 text-xs font-mono text-cyan-400">
                                Module {index + 1}
                            </div>
                        </div>

                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                                {module.title}
                            </h3>
                            <p className="text-gray-400 mb-6 line-clamp-2">
                                {module.description}
                            </p>

                            <div className="flex items-center justify-between mt-auto">
                                <div className="flex items-center text-sm text-gray-500">
                                    <FaBookOpen className="mr-2" />
                                    <span>{module.lessons ? module.lessons.length : 0} Lessons</span>
                                </div>

                                <Link
                                    to={`/academy/module/${module.id}`}
                                    className="px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 rounded-lg border border-cyan-500/30 transition-all duration-300 flex items-center group-hover:translate-x-1"
                                >
                                    Start <FaArrowRight className="ml-2" />
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default AcademyLanding;
