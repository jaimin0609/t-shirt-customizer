/**
 * Frontend Error Handler Utility
 * A centralized utility for handling different types of errors in the frontend application
 */
import config from '../config/appConfig';
import { toast } from 'react-hot-toast';

// Error types for better categorization
export const ERROR_TYPES = {
  NETWORK: 'network',    // Network connectivity issues
  API: 'api',            // Server-side API errors
  AUTH: 'auth',          // Authentication/authorization errors
  VALIDATION: 'validation', // Form validation errors
  UI: 'ui',              // UI/rendering errors
  UNKNOWN: 'unknown'     // Uncategorized errors
};

// Error severity levels
export const ErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

// Common error types for categorization
export const ErrorType = {
  NETWORK: 'network',
  AUTH: 'authentication',
  VALIDATION: 'validation',
  SERVER: 'server',
  CLIENT: 'client',
  UNKNOWN: 'unknown'
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
  
  // API errors
  if (error.response?.status) {
    return ERROR_TYPES.API;
  }
  
  // Validation errors
  if (error.isValidationError || (error.data && Array.isArray(error.data.errors))) {
    return ERROR_TYPES.VALIDATION;
  }
  
  // UI/rendering errors (typically from React components)
  if (error.isUIError || error.componentStack) {
    return ERROR_TYPES.UI;
  }
  
  // Default to unknown
  return ERROR_TYPES.UNKNOWN;
};

/**
 * Handle API errors gracefully
 * 
 * @param {Error} error - The API error object
 * @param {string} fallbackMessage - Message to show if no better message is available
 * @returns {Object} - Processed error object with useful properties
 */
export const handleApiError = (error, fallbackMessage = 'An error occurred') => {
  // Prepare result object
  const result = {
    message: fallbackMessage,
    statusCode: null,
    data: null,
    originalError: error
  };
  
  if (!error) {
    return result;
  }
  
  // Handle standard API error responses
  if (error.response) {
    result.statusCode = error.response.status;
    
    // Try to extract the error message
    const { data } = error.response;
    
    if (data) {
      // Case 1: { message: "Error message" }
      if (data.message) {
        result.message = data.message;
        result.data = data;
      }
      // Case 2: { error: "Error message" }
      else if (data.error) {
        result.message = data.error;
        result.data = data;
      }
      // Case 3: { errors: [{ msg: "Error 1" }, { msg: "Error 2" }] }
      else if (data.errors && Array.isArray(data.errors)) {
        result.message = data.errors.map(e => e.msg || e.message).join(', ');
        result.data = data.errors;
      }
    }
  }
  // Network errors
  else if (error.message === 'Network Error' || !navigator.onLine) {
    result.message = 'Network error. Please check your internet connection.';
  }
  // Other errors
  else if (error.message) {
    result.message = error.message;
  }
  
  return result;
};

/**
 * Process validation errors from API or forms
 * 
 * @param {Array|Object} errors - Validation errors array or object
 * @returns {Object} - Mapped errors by field
 */
export const handleValidationErrors = (errors) => {
  const mappedErrors = {};
  
  if (!errors) return mappedErrors;
  
  // Handle array of errors (common API format)
  if (Array.isArray(errors)) {
    errors.forEach(err => {
      if (err.param) {
        mappedErrors[err.param] = err.msg || 'Invalid value';
      }
    });
  }
  // Handle object of errors (common form library format)
  else if (typeof errors === 'object') {
    Object.keys(errors).forEach(key => {
      mappedErrors[key] = errors[key].message || errors[key];
    });
  }
  
  return mappedErrors;
};

/**
 * Handle authentication errors and trigger appropriate actions
 * 
 * @param {Error} error - Authentication error
 * @returns {Object} - Processed auth error with actions taken
 */
export const handleAuthError = (error) => {
  const result = {
    message: 'Authentication error',
    requiresLogin: false,
    tokenExpired: false,
    permissionDenied: false,
    action: null
  };
  
  if (!error || !error.response) {
    return result;
  }
  
  const { status, data } = error.response;
  
  // Track if auth events have been fired to prevent duplicates
  let authEventFired = false;
  
  // Token expired or invalid
  if (status === 401) {
    result.message = data?.message || 'Your session has expired. Please log in again.';
    result.tokenExpired = true;
    result.requiresLogin = true;
    result.action = 'logout';
    
    // Prevent multiple auth error event dispatches
    if (!window.authErrorHandling) {
      window.authErrorHandling = true;
      
      // Dispatch auth expired event
      const authEvent = new CustomEvent('auth:expired', {
        detail: { message: result.message }
      });
      window.dispatchEvent(authEvent);
      authEventFired = true;
      
      // Clear auth error flag after a delay
      setTimeout(() => {
        window.authErrorHandling = false;
      }, 2000);
      
      // Attempt to logout and redirect if auth context is available
      try {
        const { useAuth } = require('../contexts/AuthContext');
        const auth = useAuth();
        if (auth && typeof auth.logout === 'function') {
          auth.logout();
          result.action = 'logged_out';
        }
      } catch (err) {
        // Auth context not available, redirect through event
        if (!authEventFired) {
          const redirectEvent = new CustomEvent('auth:redirect', {
            detail: { returnUrl: window.location.pathname }
          });
          window.dispatchEvent(redirectEvent);
        }
      }
    }
  }
  // Permission denied
  else if (status === 403) {
    result.message = data?.message || 'You do not have permission to perform this action.';
    result.permissionDenied = true;
    
    // Dispatch permission denied event if configured to do so
    if (data?.reason === 'token_invalid' && !window.authErrorHandling) {
      window.authErrorHandling = true;
      
      const authEvent = new CustomEvent('auth:permission_denied', {
        detail: { message: result.message }
      });
      window.dispatchEvent(authEvent);
      
      // Clear auth error flag after a delay
      setTimeout(() => {
        window.authErrorHandling = false;
      }, 2000);
    }
  }
  
  return result;
};

/**
 * Safely parse JSON without throwing exceptions
 * 
 * @param {string} jsonString - JSON string to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} - Parsed object or fallback
 */
export const safeJsonParse = (jsonString, fallback = {}) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return fallback;
  }
};

/**
 * Report error to external error monitoring service
 * 
 * @param {Error} error - Error to report
 * @param {string} source - Where the error originated
 */
export const reportError = (error, source = 'unknown') => {
  if (!error) return;
  
  const errorData = {
    message: error.message || 'Unknown error',
    stack: error.stack,
    source,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    type: categorizeError(error)
  };
  
  // Only report to monitoring service in production
  if (config.IS_PRODUCTION && config.ERROR_REPORTING_ENABLED) {
    // Error reporting logic would go here
    // (e.g., Sentry, LogRocket, etc.)
    
    // Log warning if reporting is enabled but no service is configured
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
 * Format an error message for display to users
 * @param {Error|string} error - The error object or message 
 * @param {Object} options - Additional options
 * @param {string} options.fallback - Fallback message if error is empty
 * @param {boolean} options.includeDetails - Whether to include technical details
 * @returns {string} Formatted error message
 */
export const formatErrorMessage = (error, options = {}) => {
  const { fallback = 'An unexpected error occurred', includeDetails = false } = options;
  
  if (!error) return fallback;
  
  // Handle string errors
  if (typeof error === 'string') return error;
  
  // Handle Error objects
  if (error instanceof Error) {
    // If it's an Axios error with a response
    if (error.response && error.response.data) {
      const { data } = error.response;
      
      // Handle structured API errors
      if (data.message) return data.message;
      if (data.error) return data.error;
      
      // Handle validation errors
      if (data.errors && Array.isArray(data.errors)) {
        return data.errors.map(err => err.msg || err.message).join(', ');
      }
    }
    
    // Use error message or fallback to a generic message
    return error.message || fallback;
  }
  
  // Handle unknown error types
  return fallback;
};

/**
 * Determine the error type for categorization
 * @param {Error} error - The error object
 * @returns {string} Error type from ErrorType enum
 */
export const getErrorType = (error) => {
  if (!error) return ErrorType.UNKNOWN;
  
  // Network errors
  if (!navigator.onLine || 
      (error.message && (
        error.message.includes('network') || 
        error.message.includes('Network Error') ||
        error.message.includes('Failed to fetch')
      ))
    ) {
    return ErrorType.NETWORK;
  }
  
  // Authentication errors
  if (error.response && (error.response.status === 401 || error.response.status === 403)) {
    return ErrorType.AUTH;
  }
  
  // Validation errors
  if (error.response && error.response.status === 400) {
    return ErrorType.VALIDATION;
  }
  
  // Server errors
  if (error.response && error.response.status >= 500) {
    return ErrorType.SERVER;
  }
  
  // Client errors
  if (error.response && error.response.status >= 400 && error.response.status < 500) {
    return ErrorType.CLIENT;
  }
  
  return ErrorType.UNKNOWN;
};

/**
 * Display an error notification to the user
 * @param {Error|string} error - The error to display
 * @param {Object|string} options - Notification options or error type for backward compatibility
 * @param {string} options.title - Optional title for the notification
 * @param {string} options.severity - Error severity from ErrorSeverity enum
 * @param {boolean} options.persist - Whether notification should persist
 */
export const notifyError = (error, options = {}) => {
  // Handle backward compatibility with previous function signature
  if (typeof options === 'string') {
    options = { severity: options };
  }
  
  const { 
    title = 'Error', 
    severity = ErrorSeverity.ERROR,
    persist = false
  } = options;
  
  const message = formatErrorMessage(error);
  const errorType = error instanceof Error ? getErrorType(error) : ErrorType.UNKNOWN;
  
  // Log error to console for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${errorType}] ${message}`, error);
  }
  
  // Attempt to use notification context if available for components
  try {
    const { useNotification } = require('../contexts/NotificationContext');
    
    if (typeof useNotification === 'function') {
      try {
        const notification = useNotification();
        
        // Use the notification context if available
        switch (severity) {
          case ErrorSeverity.WARNING:
          case 'warning':
            notification.showWarning(message);
            break;
          case ErrorSeverity.INFO:
          case 'info':
            notification.showInfo(message);
            break;
          case ErrorSeverity.ERROR:
          case ErrorSeverity.CRITICAL:
          case 'error':
          default:
            notification.showError(message);
            break;
        }
        return { message, errorType };
      } catch (hookErr) {
        // Hook not available in this context, continue to toast
      }
    }
  } catch (err) {
    // Context not available, continue to toast
  }
  
  // Display toast notification based on severity
  switch (severity) {
    case ErrorSeverity.INFO:
    case 'info':
      toast(message, { duration: persist ? Infinity : 3000 });
      break;
    case ErrorSeverity.WARNING:
    case 'warning':
      toast.error(message, { 
        icon: '⚠️',
        duration: persist ? Infinity : 4000 
      });
      break;
    case ErrorSeverity.CRITICAL:
      toast.error(message, { 
        duration: persist ? Infinity : 5000,
        style: {
          border: '1px solid #ef4444',
          padding: '16px',
        }
      });
      break;
    case ErrorSeverity.ERROR:
    case 'error':
    default:
      toast.error(message, { 
        duration: persist ? Infinity : 4000
      });
      break;
  }
  
  return { message, errorType };
};

/**
 * Handle form validation errors
 * @param {Object} errors - Form validation errors object
 * @returns {Object} Mapped error messages by field
 */
export const handleFormErrors = (errors) => {
  const formattedErrors = {};
  
  if (!errors) return formattedErrors;
  
  // For react-hook-form errors
  if (errors.type === 'ReactHookFormError') {
    Object.keys(errors.fields || {}).forEach(field => {
      formattedErrors[field] = errors.fields[field].message;
    });
    return formattedErrors;
  }
  
  // For API validation errors
  if (Array.isArray(errors)) {
    errors.forEach(error => {
      if (error.param) {
        formattedErrors[error.param] = error.msg;
      }
    });
    return formattedErrors;
  }
  
  // For object format errors
  if (typeof errors === 'object') {
    Object.keys(errors).forEach(key => {
      formattedErrors[key] = errors[key];
    });
  }
  
  return formattedErrors;
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
  categorizeError,
  reportError,
  ERROR_TYPES,
  handleApiError,
  handleValidationErrors,
  handleAuthError,
  safeJsonParse,
  formatErrorMessage,
  getErrorType,
  notifyError,
  handleFormErrors,
  getErrorBoundaryProps,
  ErrorSeverity,
  ErrorType
}; 