import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import MachineDetail from './components/MachineDetail';
import AdminDashboard from './components/AdminDashboard';
import AddMachine from './components/AddMachine';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import EditMachine from './components/EditMachine'; // Add this
import { NotificationProvider, useNotification } from './components/Notification';
import Sidebar from './components/Sidebar';
import './App.css';

import { jwtDecode } from 'jwt-decode'; // Add this import

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const addNotification = useNotification();
  const location = useLocation();

  
  const token = localStorage.getItem('access_token');
  
  let user = null;
  if (token) {
    try {
      user = jwtDecode(token);
      
    } catch (e) {
      console.error("Invalid token in MainLayout:", e);
      localStorage.removeItem('access_token');
      navigate('/login');
      return null;
    }
  }
  

  if (!token || !user) {
    
    if (location.pathname !== '/login') {
      navigate('/login');
    }
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    addNotification('You have been logged out.', 'info');
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <Sidebar handleLogout={handleLogout} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <NotificationProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard"
            element={<MainLayout><Dashboard /></MainLayout>}
          />
          <Route 
            path="/machines/:machineId"
            element={<MainLayout><MachineDetail /></MainLayout>}
          />
          <Route 
            path="/admin"
            element={<MainLayout><AdminDashboard /></MainLayout>}
          />
          <Route 
            path="/admin/add-machine"
            element={<MainLayout><AddMachine /></MainLayout>}
          />
          <Route
            path="/admin/analytics"
            element={<MainLayout><AnalyticsDashboard /></MainLayout>}
          />
          <Route
            path="/admin/edit-machine/:machineId" // Add this route
            element={<MainLayout><EditMachine /></MainLayout>}
          />
          
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </NotificationProvider>
    </Router>
  );
}

export default App;
