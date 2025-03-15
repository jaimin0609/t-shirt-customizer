// Direct import React as fallback
import React from 'react';
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { API_URL, getCorsHeaders, getWorkingApiUrl } from '../config/api';

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
  const [user, setUser] = useState(() => {
    // Try to initialize from localStorage
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastCheckTime, setLastCheckTime] = useState(0);

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

  // Refresh user data from the server
  const refreshUser = useCallback(async () => {
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          ...getCorsHeaders()
        }
      };

      // Try to get a working API URL
      const baseUrl = await getWorkingApiUrl();
      const response = await axios.get(`${baseUrl}/auth/profile`, config);

      if (response.data && response.data.user) {
        // Update user state and localStorage
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data.user;
      } else {
        throw new Error('No user data returned');
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);

      // If token is invalid, log out
      if (err.response && err.response.status === 401) {
        logout();
      }

      throw err;
    }
  }, [token, logout]);

  // Check the user's authentication status
  const checkAuthStatus = useCallback(async (providedToken = null) => {
    const authToken = providedToken || token;
    if (!authToken) {
      setLoading(false);
      return;
    }

    // Prevent frequent checks (no more than once every 30 seconds)
    const now = Date.now();
    if (now - lastCheckTime < 30000 && user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    clearError();
    setLastCheckTime(now);

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${authToken}`,
          ...getCorsHeaders()
        }
      };

      // Try to get a working API URL
      const baseUrl = await getWorkingApiUrl();
      const response = await axios.get(`${baseUrl}/auth/profile`, config);

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
  }, [token, logout, clearError, lastCheckTime, user]);

  // Log the user in
  const login = useCallback(async (email, password) => {
    setLoading(true);
    clearError();

    console.log('Attempting login with email:', email);

    try {
      // Try to get a working API URL
      const baseUrl = await getWorkingApiUrl();
      console.log('Using API URL for login:', baseUrl);

      // Create a specific instance for this request to avoid global interceptors
      const loginResponse = await axios.post(`${baseUrl}/auth/login`, { email, password }, {
        headers: getCorsHeaders(),
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
      // Try to get a working API URL
      const baseUrl = await getWorkingApiUrl();
      console.log('Using API URL for registration:', baseUrl);

      // Create a properly formatted request matching backend expectations
      const name = `${firstName} ${lastName}`;
      const username = email.split('@')[0]; // Generate username from email as fallback

      console.log('Registration payload:', { username, name, email, password });

      const registerResponse = await axios.post(`${baseUrl}/auth/register`, {
        username, // Backend requires username
        name,     // Backend requires name (combined first and last name)
        email,
        password
      }, {
        headers: getCorsHeaders(),
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
      // Try to get a working API URL
      const baseUrl = await getWorkingApiUrl();
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          ...getCorsHeaders()
        }
      };

      const response = await axios.put(`${baseUrl}/auth/profile`, profileData, config);

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

  // Request a password reset
  const requestPasswordReset = useCallback(async (email) => {
    setLoading(true);
    clearError();

    try {
      // Try to get a working API URL
      const baseUrl = await getWorkingApiUrl();
      console.log('Using API URL for password reset request:', baseUrl);

      const response = await axios.post(`${baseUrl}/auth/forgot-password`, { email }, {
        headers: getCorsHeaders(),
        timeout: 10000 // 10 second timeout
      });

      console.log('Password reset request response:', response.status);
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error('Password reset request error:', err);
      let errorMessage = 'Failed to request password reset. Please try again.';

      if (err.response) {
        errorMessage = err.response.data?.message || `Error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Reset password with token
  const resetPassword = useCallback(async (token, newPassword) => {
    setLoading(true);
    clearError();

    try {
      // Try to get a working API URL
      const baseUrl = await getWorkingApiUrl();
      console.log('Using API URL for password reset:', baseUrl);

      const response = await axios.post(`${baseUrl}/auth/reset-password`, {
        token,
        password: newPassword
      }, {
        headers: getCorsHeaders(),
        timeout: 10000 // 10 second timeout
      });

      console.log('Password reset response:', response.status);
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error('Password reset error:', err);
      let errorMessage = 'Failed to reset password. Please try again.';

      if (err.response) {
        errorMessage = err.response.data?.message || `Error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // Effect to configure axios with the token
  useEffect(() => {
    configureAxiosAuth(token);
  }, [token]);

  // Effect to check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Create auth context value
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
    clearError,
    refreshUser,
    requestPasswordReset,
    resetPassword
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