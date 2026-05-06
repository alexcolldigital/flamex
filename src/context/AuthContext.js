import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import { authAPI } from '../api/client';

let SecureStore = null;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      let token = null;
      if (Platform.OS !== 'web') {
        token = await SecureStore.getItemAsync('authToken');
      }
      if (token) {
        const response = await authAPI.getMe();
        setUser(response.data);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    try {
      const response = await authAPI.register(data);
      const { token, user } = response.data;
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync('authToken', token);
      }
      setUser(user);
      setIsAuthenticated(true);
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync('authToken', token);
      }
      setUser(user);
      setIsAuthenticated(true);
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync('authToken');
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data);
    } catch (error) {
      console.log('Refresh user failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      register,
      login,
      logout,
      updateUser,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
