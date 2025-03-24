// Direct import React as fallback
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { API_URL, getCorsHeaders, getWorkingApiUrl } from '../config/api';
import { useNavigate } from 'react-router-dom';
import {
  decodeToken,
  isTokenExpiring,
  getTokenExpiration,
  setAuthToken,
  clearAuthToken,
  updateLastActivity,
  getAuthHeaders
} from '../utils/tokenUtils';

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
  refreshToken: () => { },
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

// Default token refresh interval (15 minutes)
const TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000;

// Default session timeout (8 hours)
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000;

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
  const [tokenRefreshInterval, setTokenRefreshInterval] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const navigate = isServer ? null : useNavigate();

  // Reset activity timer on user interaction
  useEffect(() => {
    if (isServer || !isAuthenticated) return;

    // Update last activity on user interaction
    const updateActivity = () => {
      setLastActivity(Date.now());
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    // Listen for user activity events
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, [isAuthenticated]);

  // Check for inactivity timeout
  useEffect(() => {
    if (isServer || !isAuthenticated) return;

    const checkInactivity = () => {
      const storedActivity = localStorage.getItem('lastActivity');
      const lastActivityTime = storedActivity ? parseInt(storedActivity) : Date.now();
      const inactiveTime = Date.now() - lastActivityTime;

      // Log out if user has been inactive for too long
      if (inactiveTime > SESSION_TIMEOUT) {
        console.log('Session timed out due to inactivity');
        logout();
      }
    };

    // Check every minute
    const intervalId = setInterval(checkInactivity, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, lastActivity]);

  // Sync authentication state with localStorage
  useEffect(() => {
    if (isServer) return;

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      configureAxiosAuth(token);

      // Setup token refresh interval if authenticated
      if (isAuthenticated && !tokenRefreshInterval) {
        const intervalId = setInterval(() => {
          if (isTokenExpiring(token)) {
            refreshToken();
          }
        }, TOKEN_REFRESH_INTERVAL);

        setTokenRefreshInterval(intervalId);
      }
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      configureAxiosAuth(null);

      // Clear refresh interval if not authenticated
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
        setTokenRefreshInterval(null);
      }
    }

    return () => {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, [token, user, isAuthenticated]);

  // Initial token validation on mount
  useEffect(() => {
    if (isServer) return;

    const validateToken = async () => {
      if (token) {
        // Check if token is expired or close to expiration
        if (isTokenExpiring(token)) {
          try {
            await refreshToken();
          } catch (err) {
            // If token refresh fails, log out the user
            logout();
          }
        } else {
          // Ensure authentication state is correct
          setIsAuthenticated(true);
          configureAxiosAuth(token);
        }
      }
    };

    validateToken();
  }, []);

  // Token refresh handler
  const refreshToken = useCallback(async () => {
    if (isServer || !token) return false;

    try {
      setLoading(true);
      console.log('Refreshing auth token...');

      const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.token) {
        // Use the setAuthToken utility to update the token
        setAuthToken(response.data.token, user);

        // Update component state
        setToken(response.data.token);
        setIsAuthenticated(true);

        // Update axios auth header
        configureAxiosAuth(response.data.token);

        console.log('Token refreshed successfully');
        return true;
      }

      return false;
    } catch (err) {
      console.error('Failed to refresh token:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  // Login handler
  const login = async (email, password) => {
    if (isServer) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Logging in with API URL:', API_URL);
      const response = await axios.post(`${API_URL}/api/auth/login`,
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          withCredentials: true // Enable sending cookies for CORS
        }
      );

      if (response.status !== 200) {
        throw new Error(response?.data?.message || 'Login failed');
      }

      const data = response.data;

      // Store token and user data using our utility
      setAuthToken(data.token, data.user);

      // Update state
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);

      // Configure axios with new token
      configureAxiosAuth(data.token);

      // Set last activity time
      setLastActivity(Date.now());

      console.log('Login successful!');

      // Use navigate after a small delay to ensure state updates
      setTimeout(() => {
        navigate('/profile');
      }, 100);

      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Something went wrong';

      // Try to extract error message from response
      if (err.response && err.response.data) {
        errorMessage = err.response.data.message || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
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
      console.log('Signing up with API URL:', API_URL);
      // Use the full API URL instead of relative path
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Signup error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          throw new Error('Invalid server response');
        }
        throw new Error(errorData.message || 'Signup failed');
      }

      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);

      // Configure axios with new token
      configureAxiosAuth(data.token);

      // Set last activity time
      setLastActivity(Date.now());
      localStorage.setItem('lastActivity', Date.now().toString());

      return { success: true };
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = useCallback(() => {
    if (isServer) return;

    // Call logout endpoint to invalidate token on server
    if (token) {
      try {
        // Use fire-and-forget approach to avoid blocking logout on API errors
        fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }).catch(err => {
          console.warn('Error calling logout endpoint:', err);
        });
      } catch (err) {
        console.warn('Error during logout API call:', err);
      }
    }

    // Clear authentication state regardless of API call result
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);

    // Clear localStorage using our utility
    clearAuthToken();

    // Clear axios auth header
    configureAxiosAuth(null);

    // Clear token refresh interval
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
      setTokenRefreshInterval(null);
    }

    // Navigate to home page after a small delay to ensure state updates
    setTimeout(() => {
      navigate('/');
    }, 100);
  }, [token, tokenRefreshInterval, navigate]);

  // Update user profile
  const updateProfile = async (userData) => {
    if (isServer) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Updating profile with API URL:', API_URL);
      // Use the full API URL instead of relative path
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile update error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          throw new Error('Invalid server response');
        }
        throw new Error(errorData.message || 'Profile update failed');
      }

      const data = await response.json();
      setUser({ ...user, ...userData });
      return { success: true };
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Clear authentication error
  const clearError = () => {
    setError(null);
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
    refreshToken,
    clearError
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