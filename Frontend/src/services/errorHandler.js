/**
 * Frontend Error Handler Utility
 * A centralized utility for handling different types of errors in the frontend application
 */
import config from '../config/appConfig';

// Error types for better categorization
export const ERROR_TYPES = {
  NETWORK: 'network',    // Network connectivity issues
  API: 'api',            // Server-side API errors
  AUTH: 'auth',          // Authentication/authorization errors
  VALIDATION: 'validation', // Form validation errors
  UI: 'ui',              // UI/rendering errors
  UNKNOWN: 'unknown'     // Uncategorized errors
};

/**
 * Determines the error type based on the error object
 * 
 * @param {Error} error - The error object
 * @returns {string} - The error type from ERROR_TYPES
 */
export const categorizeError = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN;
  
  // Network connectivity issues
  if (error.message === 'Network Error' || !navigator.onLine) {
    return ERROR_TYPES.NETWORK;
  }
  
  // Authentication errors
  if (error.response?.status === 401 || error.response?.status === 403) {
    return ERROR_TYPES.AUTH;
  }
  
  // Validation errors
  if (error.response?.status === 422 || 
      error.response?.data?.validation ||
      error.name === 'ValidationError') {
    return ERROR_TYPES.VALIDATION;
  }
  
  // API errors (has a response but not auth or validation)
  if (error.response) {
    return ERROR_TYPES.API;
  }
  
  // UI errors
  if (error.message?.includes('React') || 
      error.message?.includes('render') ||
      error.message?.includes('component') ||
      error.message?.includes('element')) {
    return ERROR_TYPES.UI;
  }
  
  return ERROR_TYPES.UNKNOWN;
};

/**
 * Handles API errors with consistent formatting and logging
 * 
 * @param {Error} error - The error object from API call
 * @param {string} fallbackMessage - Fallback message if error lacks details
 * @returns {Object} - Formatted error object with type and details
 * @throws {Error} - Rethrows the error with consistent formatting
 */
export const handleApiError = (error, fallbackMessage = 'An error occurred') => {
  // Log the full error details in development environment only
  if (config.IS_DEVELOPMENT) {
    console.error('API Error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
  
  // Track error for analytics if enabled
  if (config.FEATURES.ENABLE_ERROR_REPORTING) {
    reportError(error, 'API');
  }
  
  // Extract error message with multiple fallbacks
  const errorMessage = error.response?.data?.message || 
                     error.response?.statusText || 
                     error.message || 
                     fallbackMessage;
  
  // Categorize the error
  const errorType = categorizeError(error);
  
  // Check for connection issues
  if (errorType === ERROR_TYPES.NETWORK) {
    // Enhance error message for network issues
    const enhancedError = new Error(
      navigator.onLine 
        ? 'Unable to connect to the server. Please try again later.' 
        : 'You appear to be offline. Please check your connection.'
    );
    enhancedError.type = errorType;
    enhancedError.originalError = error;
    enhancedError.isOffline = !navigator.onLine;
    
    throw enhancedError;
  }
  
  // Create enhanced error object with more context
  const enhancedError = new Error(errorMessage);
  enhancedError.type = errorType;
  enhancedError.status = error.response?.status;
  enhancedError.originalError = error;
  enhancedError.data = error.response?.data;
  
  throw enhancedError;
};

/**
 * Handles validation errors from forms
 * 
 * @param {Object} errors - Validation errors object
 * @returns {Object} - Formatted validation errors
 */
export const handleValidationErrors = (errors) => {
  if (config.IS_DEVELOPMENT) {
    console.error('Validation errors:', errors);
  }
  
  // Format validation errors for display
  const formatted = Object.entries(errors).reduce((result, [field, message]) => {
    result[field] = Array.isArray(message) ? message[0] : message;
    return result;
  }, {});
  
  // Add error type for consistent handling
  formatted._type = ERROR_TYPES.VALIDATION;
  
  return formatted;
};

/**
 * Handles authentication errors consistently
 * 
 * @param {Error} error - Authentication error
 * @returns {Object} - Formatted auth error with redirect info
 */
export const handleAuthError = (error) => {
  // Log error in development
  if (config.IS_DEVELOPMENT) {
    console.error('Authentication error:', error);
  }
  
  const statusCode = error.response?.status;
  const errorType = ERROR_TYPES.AUTH;
  
  // Special handling for different auth error types
  if (statusCode === 401) {
    return {
      message: 'Your session has expired. Please login again.',
      action: 'redirect',
      path: '/login',
      type: errorType,
      requiresReauthentication: true
    };
  } else if (statusCode === 403) {
    return {
      message: 'You do not have permission to access this resource.',
      action: 'notify',
      type: errorType,
      isPermissionError: true
    };
  }
  
  // Default auth error
  return {
    message: error.response?.data?.message || error.message || 'Authentication failed',
    action: 'notify',
    type: errorType
  };
};

/**
 * Safely parses JSON without throwing exceptions
 * 
 * @param {string} jsonString - JSON string to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} - Parsed object or fallback
 */
export const safeJsonParse = (jsonString, fallback = {}) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    if (config.IS_DEVELOPMENT) {
      console.error('JSON Parse Error:', error);
    }
    return fallback;
  }
};

/**
 * Report an error to monitoring service if enabled
 * 
 * @param {Error} error - The error to report
 * @param {string} source - Source of the error (e.g., 'API', 'UI')
 */
export const reportError = (error, source = 'unknown') => {
  // Only report errors if error reporting is enabled
  if (!config.FEATURES.ENABLE_ERROR_REPORTING) return;
  
  // Don't report errors in development unless explicitly configured
  if (config.IS_DEVELOPMENT && !import.meta.env.VITE_REPORT_DEV_ERRORS) return;
  
  // Don't report validation errors or 404s
  if (error.type === ERROR_TYPES.VALIDATION) return;
  if (error.response?.status === 404) return;
  
  // Add metadata to error
  const errorData = {
    message: error.message,
    type: error.type || categorizeError(error),
    status: error.response?.status,
    source,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  };
  
  // Implement your error reporting service integration
  // For example, using a fictional "errorMonitor" service:
  if (window.errorMonitor) {
    window.errorMonitor.captureError(error, errorData);
  } else {
    console.warn('Error reporting enabled but no monitoring service configured');
  }
  
  // Log to console in development for debugging
  if (config.IS_DEVELOPMENT) {
    console.group('Error Report');
    console.error('Error:', error);
    console.info('Error Metadata:', errorData);
    console.groupEnd();
  }
};

/**
 * Display user-friendly notification for an error
 * 
 * @param {string} message - Error message to display
 * @param {string} type - Type of notification (error, warning, info)
 */
export const notifyError = (message, type = 'error') => {
  try {
    // Import dynamically to avoid circular dependencies
    const { useNotification } = require('../contexts/NotificationContext');
    
    // If we're in a component context with hooks available
    if (typeof useNotification === 'function') {
      try {
        const notification = useNotification();
        
        switch (type) {
          case 'warning':
            notification.showWarning(message);
            break;
          case 'info':
            notification.showInfo(message);
            break;
          case 'error':
          default:
            notification.showError(message);
            break;
        }
        return;
      } catch (hookErr) {
        // Hook not available in this context, fall back to next method
        console.log('Could not use notification hook:', hookErr);
      }
    }
    
    // Fallback to global notification if available
    if (window.notificationSystem && typeof window.notificationSystem.notify === 'function') {
      window.notificationSystem.notify({
        message,
        type: type || 'error',
        duration: 5000
      });
      return;
    }
    
    // Last resort - console
    console.error(`[${type.toUpperCase()}]`, message);
  } catch (err) {
    // Final fallback
    console.error('Error showing notification:', err);
    console.error(message);
  }
};

/**
 * Error boundary fallback component data
 * For use with React Error Boundaries
 * 
 * @param {Error} error - The caught error
 * @returns {Object} - Data for error boundary fallback UI
 */
export const getErrorBoundaryProps = (error) => {
  if (config.IS_DEVELOPMENT) {
    console.error('Error Boundary caught error:', error);
  }
  
  // Report error to monitoring service
  reportError(error, 'boundary');
  
  return {
    title: 'Something went wrong',
    message: config.IS_DEVELOPMENT ? error.message : 'An unexpected error occurred',
    stack: config.IS_DEVELOPMENT ? error.stack : null,
    type: categorizeError(error)
  };
};

export default {
  handleApiError,
  handleValidationErrors,
  handleAuthError,
  safeJsonParse,
  notifyError,
  getErrorBoundaryProps,
  categorizeError,
  reportError,
  ERROR_TYPES
}; 