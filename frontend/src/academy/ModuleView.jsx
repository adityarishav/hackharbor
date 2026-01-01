import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaArrowLeft, FaPlay, FaCheckCircle, FaLock } from 'react-icons/fa';
import { motion } from 'framer-motion';

const ModuleView = () => {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const [module, setModule] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchModule();
    }, [moduleId]);

    const fetchModule = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await api.get(`/academy/modules/${moduleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setModule(response.data);
        } catch (error) {
            console.error('Failed to fetch module:', error);
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

    if (!module) return <div className="text-white">Module not found</div>;

    return (
        <div className="max-w-5xl mx-auto">
            <button
                onClick={() => navigate('/academy')}
                className="mb-8 flex items-center text-gray-400 hover:text-cyan-400 transition-colors"
            >
                <FaArrowLeft className="mr-2" /> Back to Modules
            </button>

            <div className="bg-gray-900/80 border border-cyan-500/30 rounded-2xl p-8 mb-8 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <h1 className="text-9xl font-bold text-cyan-500">{module.order + 1}</h1>
                </div>

                <h1 className="text-4xl font-bold text-white mb-4 relative z-10">{module.title}</h1>
                <p className="text-xl text-gray-300 relative z-10 max-w-3xl">{module.description}</p>
            </div>

            <h2 className="text-2xl font-bold text-cyan-400 mb-6 border-b border-cyan-500/30 pb-2 inline-block">
                Course Curriculum
            </h2>

            <div className="space-y-4">
                {module.lessons && module.lessons.sort((a, b) => a.order - b.order).map((lesson, index) => (
                    <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Link
                            to={`/academy/lesson/${lesson.id}`}
                            className="block bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-cyan-500/50 rounded-xl p-6 transition-all duration-300 group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-gray-900 border border-cyan-500/30 flex items-center justify-center mr-4 group-hover:bg-cyan-900/30 group-hover:border-cyan-500 transition-colors">
                                        <span className="text-cyan-500 font-mono font-bold">{index + 1}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
                                            {lesson.title}
                                        </h3>
                                        <p className="text-sm text-gray-500">Lesson {index + 1}</p>
                                    </div>
                                </div>

                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center group-hover:bg-cyan-600 transition-colors">
                                    <FaPlay className="text-white text-xs ml-1" />
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}

                {(!module.lessons || module.lessons.length === 0) && (
                    <div className="text-gray-500 italic p-4 text-center border border-dashed border-gray-700 rounded-xl">
                        No lessons available yet. Check back soon.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModuleView;
