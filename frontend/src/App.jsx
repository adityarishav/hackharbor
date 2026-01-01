import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import DashboardPage from './pages/DashboardPage';
import MachineDetail from './pages/MachineDetail';
import AdminDashboard from './pages/AdminDashboard';
import AddMachine from './pages/AddMachine';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import EditMachine from './pages/EditMachine';
import EditChallenge from './pages/EditChallenge'; // Import EditChallenge
import AdminChallenges from './pages/AdminChallenges'; // Import AdminChallenges
import { NotificationProvider } from './components/Notification';
import MainLayout from './layouts/MainLayout';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import PostLoginRedirect from './pages/PostLoginRedirect';

import UserManagementPage from './pages/UserManagementPage';
import ChallengesPage from './pages/ChallengesPage';
import ChallengeDetail from './pages/ChallengeDetail';
import AddChallengePage from './pages/AddChallengePage';
import ProfilePage from './pages/ProfilePage'; // Import ProfilePage

import MachinesPage from './pages/MachinesPage';

import AdminBadges from './pages/AdminBadges'; // Import AdminBadges
import AdminAnnouncements from './pages/AdminAnnouncements'; // Import AdminAnnouncements
import SettingsPage from './pages/SettingsPage';
import VPNSettingsPage from './pages/VPNSettingsPage';

import AcademyLayout from './academy/AcademyLayout';
import AcademyLanding from './academy/AcademyLanding';
import ModuleView from './academy/ModuleView';
import LessonView from './academy/LessonView';
import InstructorDashboard from './academy/InstructorDashboard';

function App() {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/post-login" element={<PostLoginRedirect />} />
            <Route element={<MainLayout />}>
              <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/machines" element={<MachinesPage />} />
                <Route path="/machines/:machineId" element={<MachineDetail />} />
                <Route path="/challenges" element={<ChallengesPage />} />
                <Route path="/challenges/:challengeId" element={<ChallengeDetail />} />
                <Route path="/profile" element={<ProfilePage />} /> {/* Add Profile Route */}
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
                <Route path="/admin/badges" element={<AdminBadges />} /> {/* Add Admin Badges Route */}
                <Route path="/admin/badges" element={<AdminBadges />} /> {/* Add Admin Badges Route */}
                <Route path="/admin/announcements" element={<AdminAnnouncements />} /> {/* Add Admin Announcements Route */}
              </Route>
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/vpn" element={<VPNSettingsPage />} />
              <Route path="/vpn" element={<VPNSettingsPage />} />
            </Route>

            {/* Academy Routes */}
            <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
              <Route element={<AcademyLayout />}>
                <Route path="/academy" element={<AcademyLanding />} />
                <Route path="/academy/instructor" element={<InstructorDashboard />} />
                <Route path="/academy/module/:moduleId" element={<ModuleView />} />
                <Route path="/academy/lesson/:lessonId" element={<LessonView />} />
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