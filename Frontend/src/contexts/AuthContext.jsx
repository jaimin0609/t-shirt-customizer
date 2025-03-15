// Direct import React as fallback
import React from 'react';
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

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

  // Log the user out - define this early as it's used by checkAuthStatus
  const logout = useCallback(() => {
    console.log('Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);

    // Remove auth header
    configureAxiosAuth(null);

    // Navigate to home page happens in the component
  }, []);

  // Check the user's authentication status
  const checkAuthStatus = useCallback(async (providedToken = null) => {
    const authToken = providedToken || token;
    if (!authToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    clearError();

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      };

      const response = await axios.get(`${API_URL}/auth/profile`, config);

      if (response.data && response.data.user) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        // If no user data, log out
        logout();
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
      // If error is 401 (unauthorized), log out
      if (err.response && err.response.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout, clearError]);

  // Log the user in
  const login = useCallback(async (email, password) => {
    setLoading(true);
    clearError();

    console.log('Attempting login with email:', email);
    console.log('Using API URL:', API_URL);

    try {
      // Create a specific instance for this request to avoid global interceptors
      const loginResponse = await axios.post(`${API_URL}/auth/login`, { email, password }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        withCredentials: true, // Important for CORS
        timeout: 10000, // 10 second timeout
        validateStatus: status => status < 500 // Don't reject on 4xx status codes
      });

      console.log('Login response status:', loginResponse.status);

      if (loginResponse.status >= 400) {
        throw new Error(loginResponse.data?.message || 'Login failed. Please check your credentials.');
      }

      if (loginResponse.data && loginResponse.data.token) {
        const authToken = loginResponse.data.token;

        // Save token to localStorage
        localStorage.setItem('token', authToken);
        setToken(authToken);

        // Configure axios for future requests
        configureAxiosAuth(authToken);

        // Save user data
        if (loginResponse.data.user) {
          setUser(loginResponse.data.user);
          localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
          console.log('Login successful', loginResponse.data.user);
        } else {
          // If no user data in response, make another request to get it
          await checkAuthStatus(authToken);
        }

        return { success: true };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Failed to login. Please try again.';

      if (err.response) {
        errorMessage = err.response.data?.message || `Error: ${err.response.status}`;
        console.error('Server error response:', err.response.data);
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
        console.error('No response received:', err.request);
      } else {
        console.error('Error setting up request:', err.message);
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [clearError, checkAuthStatus]);

  // Register a new user
  const register = useCallback(async (firstName, lastName, email, password) => {
    setLoading(true);
    clearError();

    console.log('Attempting registration with email:', email);

    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, {
        firstName,
        lastName,
        email,
        password
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000 // 15 second timeout
      });

      console.log('Registration response:', registerResponse.status);

      if (registerResponse.data && registerResponse.data.token) {
        const authToken = registerResponse.data.token;

        localStorage.setItem('token', authToken);
        setToken(authToken);

        // Configure axios for future requests
        configureAxiosAuth(authToken);

        if (registerResponse.data.user) {
          setUser(registerResponse.data.user);
          // Save user data to localStorage for persistence
          localStorage.setItem('user', JSON.stringify(registerResponse.data.user));
        } else {
          // If user data not included, fetch it
          await checkAuthStatus(authToken);
        }

        return { success: true };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Registration error:', err);
      let errorMessage = 'Failed to register. Please try again.';

      if (err.response) {
        errorMessage = err.response.data?.message || `Error: ${err.response.status}`;
        console.error('Server error response:', err.response.data);
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [clearError, checkAuthStatus]);

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
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.put(`${API_URL}/auth/profile`, profileData, config);

      if (response.data && response.data.user) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('Profile updated successfully', response.data.user);
        return { success: true };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      let errorMessage = 'Failed to update profile. Please try again.';

      if (err.response) {
        errorMessage = err.response.data?.message || `Error: ${err.response.status}`;
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [token, clearError]);

  // Check auth status on mount and when token changes
  useEffect(() => {
    console.log('AuthContext: Checking auth status on mount or token change');
    if (token) {
      configureAxiosAuth(token);
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, [token, checkAuthStatus]);

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

  // Value to be provided by the context
  const contextValue = {
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
  };

  return (
    <AuthContext.Provider value={contextValue}>
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