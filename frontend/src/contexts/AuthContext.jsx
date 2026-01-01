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

  const fetchUserProfile = async (tokenToUse) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me/`, {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      
    }
  };

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
        fetchUserProfile(tokenFromStorage);
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
    fetchUserProfile(newToken);
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
    refreshUser: () => fetchUserProfile(token),
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};