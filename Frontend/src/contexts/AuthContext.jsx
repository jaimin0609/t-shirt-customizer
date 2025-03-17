// Direct import React as fallback
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { API_URL, getCorsHeaders, getWorkingApiUrl } from '../config/api';
import { useNavigate } from 'react-router-dom';

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
  clearError: () => { },
  refreshUser: () => { },
  requestPasswordReset: () => { },
  resetPassword: () => { }
});

// Export AuthContext for direct use if needed
export { AuthContext };

// Setup global axios configuration - moved to top to avoid initialization issues
// Add global axios configuration for CORS
axios.defaults.withCredentials = true; // Send cookies for cross-site requests

// Create axios config function outside of component to avoid initialization issues
const configureAxiosAuth = (authToken) => {
  if (authToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Global interceptors - defined outside component to avoid initialization issues
axios.interceptors.request.use(
  config => {
    // Add these headers to every request if not already present
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    // Add CORS headers if not already present
    config.headers['Accept'] = 'application/json';
    config.withCredentials = true;

    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  error => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error intercepted:', error.message);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// Check if we're running on the server
const isServer = typeof window === 'undefined' || process.env.IS_SSR === 'true';

// Provider component
export const AuthProvider = ({ children, initialState = null }) => {
  // Use initialState for SSR or load from localStorage on client
  const [user, setUser] = useState(() => {
    if (initialState) {
      return initialState.user || null;
    }

    if (!isServer) {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    }

    return null;
  });

  const [token, setToken] = useState(() => {
    if (initialState) {
      return initialState.token || null;
    }

    if (!isServer) {
      return localStorage.getItem('token') || null;
    }

    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (initialState) {
      return initialState.isAuthenticated || false;
    }

    if (!isServer) {
      return localStorage.getItem('token') ? true : false;
    }

    return false;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = isServer ? null : useNavigate();

  // Sync authentication state with localStorage
  useEffect(() => {
    if (isServer) return;

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [token, user]);

  // Login handler
  const login = async (email, password) => {
    if (isServer) return;

    setLoading(true);
    setError(null);

    try {
      // Example API call - replace with your actual API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);

      navigate('/profile');
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Signup handler
  const signup = async (userData) => {
    if (isServer) return;

    setLoading(true);
    setError(null);

    try {
      // Example API call - replace with your actual API call
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);

      navigate('/profile');
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    if (isServer) return;

    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    navigate('/');
  };

  // Update user profile
  const updateProfile = async (userData) => {
    if (isServer) return;

    setLoading(true);
    setError(null);

    try {
      // Example API call - replace with your actual API call
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed');
      }

      setUser({ ...user, ...userData });
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const contextValue = {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    signup,
    logout,
    updateProfile,
    setError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for consuming the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

// Export both as named export and default export to support different import patterns
export { AuthProvider };
export default AuthProvider; 