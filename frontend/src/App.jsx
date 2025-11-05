import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import DashboardPage from './components/DashboardPage';
import MachineDetail from './components/MachineDetail';
import AdminDashboard from './components/AdminDashboard';
import AddMachine from './components/AddMachine';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import EditMachine from './components/EditMachine';
import EditChallenge from './components/EditChallenge'; // Import EditChallenge
import AdminChallenges from './components/AdminChallenges'; // Import AdminChallenges
import { NotificationProvider } from './components/Notification';
import MainLayout from './components/MainLayout';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import PostLoginRedirect from './components/PostLoginRedirect';

import UserManagementPage from './components/UserManagementPage.jsx';
import ChallengesPage from './components/ChallengesPage';
import ChallengeDetail from './components/ChallengeDetail';
import AddChallengePage from './components/AddChallengePage';

import MachinesPage from './components/MachinesPage';

function App() {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/post-login" element={<PostLoginRedirect />} />
            <Route element={<MainLayout />}>
              <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/machines" element={<MachinesPage />} />
                <Route path="/machines/:machineId" element={<MachineDetail />} />
                <Route path="/challenges" element={<ChallengesPage />} />
                <Route path="/challenges/:challengeId" element={<ChallengeDetail />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/add-machine" element={<AddMachine />} />
                <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
                <Route path="/admin/edit-machine/:machineId" element={<EditMachine />} />
                <Route path="/admin/users" element={<UserManagementPage />} />
                <Route path="/admin/challenges" element={<AdminChallenges />} /> {/* New Admin Challenges Route */}
                <Route path="/admin/challenges/new" element={<AddChallengePage />} />
                <Route path="/admin/edit-challenge/:challengeId" element={<EditChallenge />} />
                <Route path="/admin/edit-challenge/:challengeId" element={<EditChallenge />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;