/**
 * Centralized API Client
 * Handles all HTTP requests with consistent error handling and security
 */
import axios from 'axios';
import { notifyError, formatErrorMessage, getErrorType, ErrorType, ErrorSeverity } from './errorHandler';
import { API_URL as CONFIG_API_URL } from '../config/api';

// Use API URL from config with fallback for consistency across the application
const API_URL = CONFIG_API_URL;
console.log('API Client using URL:', API_URL);
const API_TIMEOUT = 30000; // 30 seconds timeout

// Track if token refresh is in progress to prevent multiple simultaneous refreshes
let isRefreshingToken = false;
let refreshPromise = null;
let refreshSubscribers = [];

// Notify subscribers (pending requests) that token has been refreshed
const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
};

// Add a callback to be invoked once token is refreshed
const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

// Decode JWT token
const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Check if token is expired or about to expire
const isTokenExpiredOrClose = (token, bufferTime = 5 * 60 * 1000) => {
  if (!token) return true;
  
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    // Check if token is expired or will expire within buffer time
    const expirationTime = decoded.exp * 1000;
    return Date.now() + bufferTime > expirationTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

// Try to refresh token asynchronously
const refreshAuthToken = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token available for refresh');
  }
  
  isRefreshingToken = true;
  try {
    const response = await axios.post(`${API_URL}/auth/refresh-token`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const { token: newToken } = response.data;
    if (newToken) {
      localStorage.setItem('token', newToken);
      onTokenRefreshed(newToken);
      return newToken;
    } else {
      throw new Error('No token in refresh response');
    }
  } catch (error) {
    // Clear auth data on refresh failure
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Dispatch authentication expired event
    const authEvent = new CustomEvent('auth:expired', {
      detail: { message: 'Your session has expired. Please log in again.' }
    });
    window.dispatchEvent(authEvent);
    
    throw error;
  } finally {
    isRefreshingToken = false;
    refreshPromise = null;
  }
};

// When sending requests, check for token in localStorage first
const addAuthHeaders = (config) => {
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  // Add Authorization header if token exists
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`
    };
    
    // Debug in non-production
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Adding auth token to request: ${config.url}`);
    }
  }
  
  return config;
};

/**
 * Create an axios instance with default configuration
 */
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  withCredentials: false, // Set to false for cross-origin requests to Vercel
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

/**
 * Handle request configuration
 * @param {Object} config - Request configuration
 * @returns {Object} Modified configuration
 */
axiosInstance.interceptors.request.use(
  async (config) => {
    // Add request start time for performance tracking
    config.metadata = { startTime: performance.now() };
    
    // Add authentication headers
    config = addAuthHeaders(config);
    
    // Add security headers for protection against CSRF
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    
    // Add CSRF token if available from meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    // Log requests in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, { 
        params: config.params,
        data: config.data
      });
    }
    
    return config;
  },
  (error) => {
    // Log request errors
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Handle response processing
 */
axiosInstance.interceptors.response.use(
  (response) => {
    // Track request duration for performance monitoring
    if (response.config.metadata) {
      const duration = performance.now() - response.config.metadata.startTime;
      
      // Log response details in development
      if (process.env.NODE_ENV !== 'production') {
        console.log(`API Response (${Math.round(duration)}ms): ${response.status} ${response.config.url}`);
        
        // Log slow requests as warnings
        if (duration > 1000) {
          console.warn(`Slow API request: ${response.config.url} took ${Math.round(duration)}ms`);
        }
      }
    }
    
    return response;
  },
  async (error) => {
    // Handle different error scenarios
    const originalRequest = error.config;
    
    // Track request duration for performance monitoring
    if (originalRequest?.metadata) {
      const duration = performance.now() - originalRequest.metadata.startTime;
      if (process.env.NODE_ENV !== 'production') {
        console.error(`API Error (${Math.round(duration)}ms): ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`, error);
      }
    }
    
    // Skip handling for URLs that should not trigger token refresh
    const skipAuthHandling = originalRequest.url === '/auth/refresh-token' || 
                            originalRequest.url === '/auth/login' ||
                            originalRequest.skipAuthRefresh === true;
    
    // Handle authentication errors (token expired)
    if (error.response?.status === 401 && !skipAuthHandling && !originalRequest._retry) {
      // If a refresh is not already in progress, start one
      if (!isRefreshingToken) {
        refreshPromise = refreshAuthToken();
      }
      
      // Mark this request as a retry
      originalRequest._retry = true;
      
      try {
        // Wait for token refresh to complete
        const newToken = await refreshPromise;
        
        // Update request with new token
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        
        // Retry original request with new token
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Token refresh failed, dispatch authentication expired event
        const authEvent = new CustomEvent('auth:expired', {
          detail: { message: 'Your session has expired. Please log in again.' }
        });
        window.dispatchEvent(authEvent);
        
        // Redirect to login unless already on login page
        if (!window.location.pathname.includes('/login')) {
          const returnUrl = window.location.pathname;
          window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // Handle authentication failure other than token expiration
    if (error.response?.status === 401 && skipAuthHandling) {
      // Clear authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Dispatch authentication failed event
      const authEvent = new CustomEvent('auth:failed', {
        detail: { message: error.response?.data?.message || 'Authentication failed' }
      });
      window.dispatchEvent(authEvent);
    }
    
    // Handle CSRF token errors
    if (error.response?.status === 403 && 
        (error.response.data?.message?.includes('CSRF') || 
         error.response.data?.error?.includes('CSRF'))) {
      console.warn('CSRF token validation failed. Refreshing page to get a new token.');
      window.location.reload();
      return Promise.reject(error);
    }
    
    // Handle network errors with clear user-friendly message
    if (!error.response) {
      notifyError('Network error. Please check your internet connection and try again.', {
        severity: ErrorSeverity.ERROR
      });
    }
    
    // Return rejected promise with the error
    return Promise.reject(error);
  }
);

/**
 * Unified API request method with error handling
 * @param {Object} options - Request options
 * @returns {Promise} - Response promise
 */
const apiRequest = async (options) => {
  try {
    const response = await axiosInstance(options);
    return response.data;
  } catch (error) {
    // Get error type for handling
    const errorType = getErrorType(error);
    const errorMessage = formatErrorMessage(error, { 
      fallback: 'An error occurred while processing your request.'
    });
    
    // Log specific error details
    if (process.env.NODE_ENV !== 'production') {
      console.error(`API Error (${errorType}):`, {
        url: options.url,
        method: options.method,
        status: error.response?.status,
        message: errorMessage,
        error
      });
    }
    
    // Don't auto-notify for certain error types that are handled elsewhere
    const skipNotify = 
      errorType === ErrorType.AUTH || // Auth errors handled by interceptor
      (options.skipErrorNotification === true);
    
    if (!skipNotify) {
      notifyError(errorMessage, {
        severity: errorType === ErrorType.NETWORK ? ErrorSeverity.WARNING : ErrorSeverity.ERROR
      });
    }
    
    throw error;
  }
};

/**
 * API client with methods for different HTTP verbs
 */
const api = {
  /**
   * GET request
   * @param {string} url - Endpoint URL
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise} - Response promise
   */
  get: async (url, params = {}, options = {}) => {
    return apiRequest({
      method: 'get',
      url,
      params,
      ...options
    });
  },
  
  /**
   * POST request
   * @param {string} url - Endpoint URL
   * @param {Object} data - Request payload
   * @param {Object} options - Additional options
   * @returns {Promise} - Response promise
   */
  post: async (url, data = {}, options = {}) => {
    return apiRequest({
      method: 'post',
      url,
      data,
      ...options
    });
  },
  
  /**
   * PUT request
   * @param {string} url - Endpoint URL
   * @param {Object} data - Request payload
   * @param {Object} options - Additional options
   * @returns {Promise} - Response promise
   */
  put: async (url, data = {}, options = {}) => {
    return apiRequest({
      method: 'put',
      url,
      data,
      ...options
    });
  },
  
  /**
   * PATCH request
   * @param {string} url - Endpoint URL
   * @param {Object} data - Request payload
   * @param {Object} options - Additional options
   * @returns {Promise} - Response promise
   */
  patch: async (url, data = {}, options = {}) => {
    return apiRequest({
      method: 'patch',
      url,
      data,
      ...options
    });
  },
  
  /**
   * DELETE request
   * @param {string} url - Endpoint URL
   * @param {Object} options - Additional options
   * @returns {Promise} - Response promise
   */
  delete: async (url, options = {}) => {
    return apiRequest({
      method: 'delete',
      url,
      ...options
    });
  },
  
  /**
   * Upload file(s) with FormData
   * @param {string} url - Endpoint URL
   * @param {FormData} formData - Form data with files
   * @param {Object} options - Additional options
   * @returns {Promise} - Response promise
   */
  upload: async (url, formData, options = {}) => {
    return apiRequest({
      method: 'post',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      ...options
    });
  },
  
  /**
   * Download a file
   * @param {string} url - Endpoint URL 
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise} - Response promise with blob data
   */
  download: async (url, params = {}, options = {}) => {
    return apiRequest({
      method: 'get',
      url,
      params,
      responseType: 'blob',
      ...options
    });
  },
  
  /**
   * Check API health/connection
   * @returns {Promise<boolean>} - True if API is healthy
   */
  checkHealth: async () => {
    try {
      const response = await apiRequest({
        method: 'get',
        url: '/health',
        timeout: 5000,
        skipErrorNotification: true
      });
      return response.status === 'ok';
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  },
  
  /**
   * Manually refresh auth token
   * @returns {Promise<string>} - New token
   */
  refreshAuthToken: async () => {
    try {
      return await refreshAuthToken();
    } catch (error) {
      console.error('Manual token refresh failed:', error);
      throw error;
    }
  },
  
  /**
   * Check if user is authenticated with a valid token
   * @returns {Promise<boolean>} - True if authenticated
   */
  checkAuthentication: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      if (isTokenExpiredOrClose(token)) {
        await refreshAuthToken();
      }
      
      return true;
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }
};

export { api as default, axiosInstance, API_URL }; 