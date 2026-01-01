import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/Notification';
import { AuthContext } from '../contexts/AuthContext';
import StatCards from '../components/StatCards';
import MachineTable from '../components/MachineTable';
import DashboardCharts from '../components/DashboardCharts';
import ActivityFeed from '../components/ActivityFeed';
import AdminPageLayout from '../layouts/AdminPageLayout';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user } = useContext(AuthContext);

  return (
    <AdminPageLayout title="Admin Dashboard">
      <div className="mb-8 flex items-center justify-end">
        <div className="flex flex-wrap gap-4">
          <button onClick={() => navigate('/admin/add-machine')} className="glass-button px-4 py-2 rounded-lg text-white font-semibold">
            Add New Machine
          </button>
          <button onClick={() => navigate('/admin/challenges/new')} className="glass-button px-4 py-2 rounded-lg text-white font-semibold">
            Add New Challenge
          </button>
          <button onClick={() => navigate('/admin/analytics')} className="glass-button-secondary px-4 py-2 rounded-lg text-white font-semibold hover:bg-white/10">
            View Analytics
          </button>
          <button onClick={() => navigate('/admin/users')} className="glass-button-secondary px-4 py-2 rounded-lg text-white font-semibold hover:bg-white/10">
            Manage Users
          </button>
          <button onClick={() => navigate('/admin/challenges')} className="glass-button-secondary px-4 py-2 rounded-lg text-white font-semibold hover:bg-white/10">
            Manage Challenges
          </button>
          <button onClick={() => navigate('/admin/badges')} className="glass-button-secondary px-4 py-2 rounded-lg text-white font-semibold hover:bg-white/10">
            Manage Badges
          </button>
          <button onClick={() => navigate('/admin/announcements')} className="glass-button-secondary px-4 py-2 rounded-lg text-white font-semibold hover:bg-white/10">
            Manage Announcements
          </button>
        </div>
      </div>

      <StatCards />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardCharts />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>

      <div className="mt-8 glass-panel p-6 rounded-xl">
        <h2 className="mb-4 text-2xl font-bold neon-text">Existing Machines</h2>
        <MachineTable />
      </div>
    </AdminPageLayout>
  );
};

export default AdminDashboard;