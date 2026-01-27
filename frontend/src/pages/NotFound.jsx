import React from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle, FaHome } from 'react-icons/fa';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Glitch Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-2xl w-full text-center z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative inline-block"
        >
            {/* 404 Glitch Text */}
            <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-cyan-400 to-purple-500 mb-2 relative z-10 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              404
            </h1>
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center -translate-x-1 translate-y-1 opacity-50 mix-blend-screen animate-pulse text-9xl font-black text-red-500 z-0">
               404
            </div>
             <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center translate-x-1 -translate-y-1 opacity-50 mix-blend-screen animate-pulse text-blue-500 z-0">
               404
            </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2, duration: 0.5 }}
        >
            <div className="flex items-center justify-center gap-3 mb-6">
                <FaExclamationTriangle className="text-yellow-500 text-3xl animate-bounce" />
                <h2 className="text-3xl font-bold text-white">System Error: Route Not Found</h2>
            </div>
            
            <p className="text-gray-400 text-lg mb-10 max-w-lg mx-auto">
              The requested resource has been moved, deleted, or consumed by a black hole. 
              Checking your navigation coordinates is advised.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  to="/dashboard"
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/30 transform transition-all duration-200 hover:scale-105 flex items-center gap-2 group"
                >
                  <FaHome className="group-hover:animate-pulse"/> Return to Base
                </Link>
                <button 
                  onClick={() => window.history.back()}
                  className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold border border-white/10 transition-all duration-200 hover:text-white"
                >
                  Go Back
                </button>
            </div>
        </motion.div>
        
        {/* Terminal decorative element */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-12 mx-auto max-w-md bg-black/40 backdrop-blur-md rounded-lg p-4 font-mono text-left border border-white/5"
        >
            <div className="flex gap-1.5 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="text-gray-500 text-sm">
                <span className="text-green-400">user@hackharbor</span>:<span className="text-blue-400">~</span>$ ping target_host<br/>
                Request timed out.<br/>
                <span className="text-green-400">user@hackharbor</span>:<span className="text-blue-400">~</span>$ locate resource<br/>
                <span className="text-red-400">Error: HTTP 404 - Resource unlocated.</span><br/>
                <span className="text-green-400">user@hackharbor</span>:<span className="text-blue-400">~</span>$<span className="animate-pulse">_</span>
            </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
