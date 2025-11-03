import React, { useState, useEffect, createContext, useContext } from 'react';
import ReactDOM from 'react-dom';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        hideNotification();
      }, 3000); // Hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <NotificationContext.Provider value={showNotification}>
      {children}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  return useContext(NotificationContext);
};

const Notification = ({ message, type, onClose }) => {
  const notificationStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '15px 20px',
    borderRadius: '8px',
    color: 'white',
    zIndex: 1000,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: '250px',
  };

  const typeStyles = {
    info: { backgroundColor: '#2196F3' },
    success: { backgroundColor: '#4CAF50' },
    error: { backgroundColor: '#F44336' },
  };

  const closeButtonStyle = {
    marginLeft: '15px',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '18px',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
  };

  return ReactDOM.createPortal(
    <div style={{ ...notificationStyle, ...typeStyles[type] }}>
      <span>{message}</span>
      <button onClick={onClose} style={closeButtonStyle}>
        &times;
      </button>
    </div>,
    document.body
  );
};
