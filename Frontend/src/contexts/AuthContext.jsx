// Direct import React as fallback
import React from 'react';
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

// Ensure React is used properly with fallback
const ReactModule = window.React || React;

// Create auth context with safer pattern
const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  login: () => { },
  register: () => { },
  logout: () => { },
  updateProfile: () => { },
  checkAuthStatus: () => { },
  clearError: () => { }
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if the user is authenticated
  const isAuthenticated = !!token;

  // Clear any errors
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Log the user in
  const login = useCallback(async (email, password) => {
    setLoading(true);
    clearError();

    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });

      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        setUser(response.data.user);

        // Save user data to localStorage for persistence
        localStorage.setItem('user', JSON.stringify(response.data.user));

        console.log('Login successful', response.data.user);
        return { success: true };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to login. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Register a new user
  const register = useCallback(async (userData) => {
    setLoading(true);
    clearError();

    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);

      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        setUser(response.data.user);

        // Save user data to localStorage for persistence
        localStorage.setItem('user', JSON.stringify(response.data.user));

        console.log('Registration successful', response.data.user);
        return { success: true };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to register. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Log the user out
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    localStorage.removeItem('wishlist');
    setToken(null);
    setUser(null);
    console.log('User logged out');
  }, []);

  // Update the user's profile
  const updateProfile = useCallback(async (profileData) => {
    if (!token) {
      setError('You must be logged in to update your profile');
      return { success: false, error: 'Not authenticated' };
    }

    setLoading(true);
    clearError();

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const response = await axios.put(`${API_URL}/users/profile`, profileData, config);

      if (response.data && response.data.user) {
        setUser(response.data.user);

        // Update user data in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));

        console.log('Profile updated successfully');
        return { success: true };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update profile. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token, clearError]);

  // Check the user's authentication status
  const checkAuthStatus = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const response = await axios.get(`${API_URL}/auth/me`, config);

      if (response.data && response.data.user) {
        setUser(response.data.user);

        // Update user data in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));

        console.log('Auth status checked successfully');
      } else {
        // If the server doesn't recognize the token, log the user out
        logout();
      }
    } catch (err) {
      console.error('Auth status check error:', err);
      // If there's an error (e.g., token expired), log the user out
      logout();
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  // Check auth status on mount and when token changes
  useEffect(() => {
    console.log('AuthContext: Checking auth status on mount or token change');
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Try to load user data from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && !user) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user data:', err);
        localStorage.removeItem('user');
      }
    }
  }, [user]);

  // Set up axios interceptor to handle token
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      config => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    return () => {
      // Clean up interceptor on unmount
      axios.interceptors.request.eject(interceptor);
    };
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated,
        login,
        register,
        logout,
        updateProfile,
        checkAuthStatus,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 