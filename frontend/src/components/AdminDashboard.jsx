import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './Notification';
import { AuthContext } from '../contexts/AuthContext';
import StatCards from './StatCards';
import MachineTable from './MachineTable';
import DashboardCharts from './DashboardCharts';
import ActivityFeed from './ActivityFeed';
import AdminPageLayout from './AdminPageLayout';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user } = useContext(AuthContext);

  return (
    <AdminPageLayout title="Admin Dashboard">
      <div className="mb-8 flex items-center justify-end">
        <div className="flex gap-4">
          <button onClick={() => navigate('/admin/add-machine')} className="rounded-md bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700">
            Add New Machine
          </button>
          <button onClick={() => navigate('/admin/challenges/new')} className="rounded-md bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700">
            Add New Challenge
          </button>
          <button onClick={() => navigate('/admin/analytics')} className="rounded-md bg-gray-700 px-4 py-2 font-semibold text-white hover:bg-gray-600">
            View Analytics
          </button>
          <button onClick={() => navigate('/admin/users')} className="rounded-md bg-gray-700 px-4 py-2 font-semibold text-white hover:bg-gray-600">
            Manage Users
          </button>
          <button onClick={() => navigate('/admin/challenges')} className="rounded-md bg-gray-700 px-4 py-2 font-semibold text-white hover:bg-gray-600">
            Manage Challenges
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

      <div className="mt-8">
        <h2 className="mb-4 text-2xl font-bold">Existing Machines</h2>
        <MachineTable />
      </div>
    </AdminPageLayout>
  );
};

export default AdminDashboard;