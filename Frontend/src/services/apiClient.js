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

/**
 * Create an axios instance with default configuration
 */
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  withCredentials: true, // Include cookies in cross-origin requests
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
  (config) => {
    // Add request start time for performance tracking
    config.metadata = { startTime: performance.now() };
    
    // Get authentication token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
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
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear authentication data
      localStorage.removeItem('token');
      
      // Dispatch authentication expired event
      const authEvent = new CustomEvent('auth:expired', {
        detail: { message: 'Your session has expired. Please log in again.' }
      });
      window.dispatchEvent(authEvent);
      
      // Redirect to login unless already on login page
      if (!window.location.pathname.includes('/login')) {
        const redirectEvent = new CustomEvent('auth:redirect', {
          detail: { returnUrl: window.location.pathname }
        });
        window.dispatchEvent(redirectEvent);
      }
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
const apiClient = {
  /**
   * GET request
   * @param {string} url - Endpoint URL
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise} - Response promise
   */
  async get(url, params = {}, options = {}) {
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
  async post(url, data = {}, options = {}) {
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
  async put(url, data = {}, options = {}) {
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
  async patch(url, data = {}, options = {}) {
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
  async delete(url, options = {}) {
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
  async upload(url, formData, options = {}) {
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
  async download(url, params = {}, options = {}) {
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
  async checkHealth() {
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
  }
};

export default apiClient; 