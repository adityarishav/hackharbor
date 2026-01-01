import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import ActivitySection from '../components/ActivitySection';
import ComingSoonSection from '../components/ComingSoonSection';

const DashboardPage = () => {
  const [user, setUser] = useState(null);
  const [score, setScore] = useState(0);
  const [totalMachines, setTotalMachines] = useState(0);
  const [completedMachines, setCompletedMachines] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();
  const searchRef = React.useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchQuery('');
        setDebouncedSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!debouncedSearchQuery) {
        setSearchResults([]);
        return;
      }
      try {
        const token = localStorage.getItem('access_token');
        const response = await api.get('/machines/', {
          headers: { Authorization: `Bearer ${token}` },
          params: { search: debouncedSearchQuery }
        });
        setSearchResults(response.data);
      } catch (error) {
        console.error("Error searching machines:", error);
      }
    };
    fetchSearchResults();
  }, [debouncedSearchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };

        const [userRes, scoreRes, machinesRes, submissionsRes] = await Promise.all([
          api.get('/users/me', { headers }),
          api.get('/users/me/score', { headers }),
          api.get('/machines/', { headers }),
          api.get('/users/me/submissions', { headers })
        ]);

        setUser(userRes.data);
        setScore(scoreRes.data.score);
        setTotalMachines(machinesRes.data.length);
        const completedMachineIds = new Set(submissionsRes.data.map(sub => sub.machine_id));
        setCompletedMachines(completedMachineIds.size);

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        if (error.response && error.response.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchData();
  }, [navigate]);

  const handleResultClick = (machineId) => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    navigate(`/machines/${machineId}`);
  };

  return (
    <div className="min-h-screen p-8 space-y-8">
      {user && (
        <HeroSection
          username={user.username}
          score={score}
          completedMachines={completedMachines}
          totalMachines={totalMachines}
        />
      )}
      <div className="glass-panel p-6 rounded-2xl relative z-50" ref={searchRef}>
        <input
          type="text"
          placeholder="Search machines..."
          className="w-full glass-input rounded-xl p-4 text-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {debouncedSearchQuery && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl max-h-96 overflow-y-auto z-50">
            <h3 className="text-lg font-semibold text-purple-300 mb-4">Search Results</h3>
            {searchResults.length > 0 ? (
              <div className="grid gap-4">
                {searchResults.map(machine => (
                  <div
                    key={machine.id}
                    className="glass-card p-4 rounded-xl cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleResultClick(machine.id)}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-white">{machine.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${machine.difficulty === 'Easy' ? 'bg-green-500/20 text-green-300' :
                        machine.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                        {machine.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{machine.operating_system}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center">No machines found.</p>
            )}
          </div>
        )}
      </div>
      <ActivitySection />
      <ComingSoonSection />
    </div>
  );
};

export default DashboardPage;