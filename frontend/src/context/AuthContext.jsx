import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch (error) {
          console.error("Auth initialization failed:", error);
          authService.logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      await authService.login(email, password);
      const userData = await authService.getMe();
      setUser(userData);
      return userData;
    } catch (error) {
      authService.logout();
      setUser(null);
      throw error;
    }
  };

  const register = async (email, password, confirmPassword, fullName, role = 'USER') => {
    const userData = await authService.register(email, password, confirmPassword, fullName, role);
    return userData;
  };

  const googleLogin = async (credential) => {
    try {
      await authService.googleAuth(credential);
      const userData = await authService.getMe();
      setUser(userData);
      return userData;
    } catch (error) {
      authService.logout();
      setUser(null);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    googleLogin,
    logout,
    refreshUser: async () => {
      try {
        const userData = await authService.getMe();
        setUser(userData);
      } catch (error) {
        console.error("Failed to refresh user:", error);
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
