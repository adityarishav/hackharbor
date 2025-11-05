import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const tokenFromStorage = localStorage.getItem('access_token');

    if (tokenFromStorage) {
      try {
        const decodedUser = jwtDecode(tokenFromStorage);
        setUser({ 
          username: decodedUser.sub,
          role: decodedUser.role,
          id: decodedUser.id
        });
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('access_token');
        setUser(null);
        setIsAuthenticated(false);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken) => {
    localStorage.setItem('access_token', newToken);
    setToken(newToken);
    const decodedUser = jwtDecode(newToken);
    setUser({ 
      username: decodedUser.sub,
      role: decodedUser.role,
      id: decodedUser.id
    });
    setIsAuthenticated(true);
    navigate('/post-login');
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  const authContextValue = {
    token,
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};