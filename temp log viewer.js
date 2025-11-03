import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotification } from './Notification';

function LogViewer() {
  const navigate = useNavigate();
  const showNotification = useNotification();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await api.get('/admin/logs', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLogs(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError('Failed to load logs. Please try again.');
      if (err.response && err.response.status === 401 || err.response.status === 403) {
        showNotification('Access Denied: Not authorized to view logs.', 'error');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is admin on component mount
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await api.get('/users/me/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data.role !== 'admin') {
          showNotification('Access Denied: Not an administrator.', 'error');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Failed to verify admin status:', error);
        showNotification('Failed to verify admin status.', 'error');
        navigate('/login');
      }
    };
    checkAdmin();
    fetchLogs();
  }, [navigate]);

  if (loading) {
    return <div>Loading logs...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  
  return (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: '100vh',
    backgroundColor: '#0d1117',
    padding: '40px'
  }}>
    <button
      onClick={() => navigate('/admin')}
      style={{
        marginBottom: '20px',
        backgroundColor: '#222',
        color: '#fff',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
      }}
    >
      Back to Admin Dashboard
    </button>

    <h2 style={{ color: '#fff', marginBottom: '20px' }}>System Logs</h2>

    <div style={{
      display: 'flex',
      justifyContent: 'center',
      width: '100%'
    }}>
      <div style={{
        fontFamily: 'monospace',
        backgroundColor: '#1e1e1e',
        color: '#f0f0f0',
        padding: '15px',
        borderRadius: '8px',
        height: '600px',
        overflowY: 'scroll',
        width: '100%',
        maxWidth: '1000px', // This centers it and keeps it readable
        boxShadow: '0 0 10px rgba(0,0,0,0.4)'
      }}>
        {logs.length === 0 ? (
          <p>No logs available.</p>
        ) : (
          logs.map((log) => {
            let logColor = '#f0f0f0';
            if (log.level === 'ERROR') logColor = '#ff6b6b';
            else if (log.level === 'WARNING') logColor = '#ffd166';
            else if (log.level === 'INFO') logColor = '#66bb6a';

            return (
              <div key={log.id} style={{
                marginBottom: '8px',
                borderBottom: '1px solid #333',
                paddingBottom: '5px',
                color: logColor
              }}>
                <p style={{ margin: '0' }}>[{new Date(log.timestamp).toLocaleString()}] <strong>{log.level}</strong>: {log.event_type}</p>
                <p style={{ margin: '0', marginLeft: '20px' }}>{log.message}</p>
                {log.user_id && <p style={{ margin: '0', marginLeft: '20px' }}>User ID: {log.user_id}</p>}
                {log.ip_address && <p style={{ margin: '0', marginLeft: '20px' }}>IP: {log.ip_address}</p>}
              </div>
            );
          })
        )}
      </div>
    </div>
  </div>
  );

}

export default LogViewer;
