/**
 * Centralized API Client
 * Handles all HTTP requests with consistent error handling and security
 */
import axios from 'axios';
import { handleApiError } from './errorHandler';
import config from '../config/appConfig';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: config.API.TIMEOUT,
  withCredentials: true, // Include cookies in cross-origin requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Log requests in development
    if (config.IS_DEVELOPMENT) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      
      // Add performance marker to measure request duration
      config.metadata = { startTime: new Date() };
    }
    
    // Get token from storage for authenticated requests
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add security headers
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    
    // Add CSRF token if available
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    return config;
  },
  (error) => {
    if (config.IS_DEVELOPMENT) {
      console.error('API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Calculate request duration for performance monitoring
    if (config.IS_DEVELOPMENT && response.config.metadata) {
      const duration = new Date() - response.config.metadata.startTime;
      console.log(`API Response: ${response.status} ${response.config.url} (${duration}ms)`);
      
      // Log slow requests
      if (duration > 1000) {
        console.warn(`Slow API request: ${response.config.url} took ${duration}ms`);
      }
    }
    return response;
  },
  async (error) => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      
      // Handle authentication errors
      if (status === 401) {
        // Clear local auth data
        localStorage.removeItem('token');
        
        // Fire an auth error event that can be caught by the app
        window.dispatchEvent(new CustomEvent('auth:expired', {
          detail: { message: 'Your session has expired. Please log in again.' }
        }));
        
        // If not on login page, redirect to login
        if (window.location.pathname !== '/login') {
          // Use history to navigate instead of direct location change
          // to maintain a clean history stack
          window.dispatchEvent(new CustomEvent('auth:redirect', {
            detail: { returnUrl: window.location.pathname }
          }));
        }
      }
      
      // Handle CSRF token issues
      if (status === 403 && error.response.data?.message?.includes('CSRF')) {
        // Refresh the page to get a new CSRF token
        window.location.reload();
        return Promise.reject(error);
      }
    } else if (error.request) {
      // Request was made but no response received (network error)
      console.error('Network Error:', error.request);
      
      // Check if navigator is online
      if (!navigator.onLine) {
        // Fire a connection error event
        window.dispatchEvent(new CustomEvent('app:offline', {
          detail: { message: 'You appear to be offline. Please check your connection.' }
        }));
      } else {
        // Fire a network error event
        window.dispatchEvent(new CustomEvent('api:networkError', {
          detail: { message: 'Network error. Please check your connection.' }
        }));
      }
    }
    
    // Handle request retry for specific errors
    if (error.config && !error.config.__isRetryRequest) {
      // Only retry on network errors or 5xx server errors
      const shouldRetry = (
        !error.response || 
        (error.response.status >= 500 && error.response.status <= 599)
      );
      
      if (shouldRetry) {
        error.config.__isRetryRequest = true;
        error.config.__retryCount = error.config.__retryCount || 0;
        
        if (error.config.__retryCount < config.API.RETRY_COUNT) {
          error.config.__retryCount++;
          
          // Add exponential backoff
          const backoff = Math.pow(2, error.config.__retryCount) * 1000;
          
          if (config.IS_DEVELOPMENT) {
            console.log(`Retrying request (${error.config.__retryCount}/${config.API.RETRY_COUNT}) after ${backoff}ms`);
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, backoff));
          
          // Retry the request
          return api(error.config);
        }
      }
    }
    
    // Rethrow the error for the calling code to handle
    return Promise.reject(error);
  }
);

// Wrapper for common HTTP methods with consistent error handling
export const apiClient = {
  /**
   * Make a GET request
   * @param {string} url - The URL to request
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional axios options
   */
  async get(url, params = {}, options = {}) {
    try {
      const response = await api.get(url, { 
        params,
        ...options
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, `Failed to fetch data from ${url}`);
    }
  },
  
  /**
   * Make a POST request
   * @param {string} url - The URL to request
   * @param {Object} data - The request body
   * @param {Object} options - Additional axios options
   */
  async post(url, data = {}, options = {}) {
    try {
      const response = await api.post(url, data, options);
      return response.data;
    } catch (error) {
      throw handleApiError(error, `Failed to submit data to ${url}`);
    }
  },
  
  /**
   * Make a PUT request
   * @param {string} url - The URL to request
   * @param {Object} data - The request body
   * @param {Object} options - Additional axios options
   */
  async put(url, data = {}, options = {}) {
    try {
      const response = await api.put(url, data, options);
      return response.data;
    } catch (error) {
      throw handleApiError(error, `Failed to update data at ${url}`);
    }
  },
  
  /**
   * Make a PATCH request
   * @param {string} url - The URL to request
   * @param {Object} data - The request body
   * @param {Object} options - Additional axios options
   */
  async patch(url, data = {}, options = {}) {
    try {
      const response = await api.patch(url, data, options);
      return response.data;
    } catch (error) {
      throw handleApiError(error, `Failed to update data at ${url}`);
    }
  },
  
  /**
   * Make a DELETE request
   * @param {string} url - The URL to request
   * @param {Object} options - Additional axios options
   */
  async delete(url, options = {}) {
    try {
      const response = await api.delete(url, options);
      return response.data;
    } catch (error) {
      throw handleApiError(error, `Failed to delete resource at ${url}`);
    }
  },
  
  /**
   * Upload a file or multiple files with form data
   * @param {string} url - The URL to upload to
   * @param {FormData|Object} formData - FormData object or plain object to convert
   * @param {Object} options - Additional axios options
   */
  async upload(url, formData, options = {}) {
    // Convert plain object to FormData if needed
    const data = formData instanceof FormData 
      ? formData 
      : Object.entries(formData).reduce((fd, [key, value]) => {
          fd.append(key, value);
          return fd;
        }, new FormData());
    
    try {
      const response = await api.post(url, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        ...options
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, `Failed to upload file to ${url}`);
    }
  },
  
  /**
   * Check API health/connectivity
   * @returns {Promise<boolean>} True if API is available
   */
  async checkHealth() {
    try {
      await api.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
};

// Export the raw axios instance for advanced use cases
export default api; 