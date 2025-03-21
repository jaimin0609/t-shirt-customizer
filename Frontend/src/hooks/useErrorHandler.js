import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  handleApiError, 
  handleAuthError, 
  notifyError, 
  ERROR_TYPES,
  categorizeError,
  reportError
} from '../services/errorHandler';
import config from '../config/appConfig';

/**
 * A custom hook for centralized error handling in React components
 * Provides methods for handling different types of errors and maintaining error state
 * 
 * @returns {Object} Error handling methods and state
 */
const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const errorTimeoutRef = useRef(null);
  const errorCountRef = useRef({});
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Clears the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
    
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
  }, []);

  /**
   * Auto-clears error after a specified duration
   * 
   * @param {number} duration - Time in ms before auto-clearing
   */
  const autoClearError = useCallback((duration = 8000) => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    
    errorTimeoutRef.current = setTimeout(() => {
      clearError();
      errorTimeoutRef.current = null;
    }, duration);
  }, [clearError]);

  /**
   * Tracks error frequency to detect recurring issues
   * 
   * @param {Error} err - The error to track
   * @returns {boolean} - True if error frequency threshold exceeded
   */
  const trackErrorFrequency = useCallback((err) => {
    if (!err || !err.message) return false;
    
    const now = Date.now();
    const errorKey = err.message.substring(0, 50); // Use start of message as key
    const errorEntry = errorCountRef.current[errorKey] || { count: 0, firstSeen: now, lastSeen: now };
    
    // Update error tracking
    errorEntry.count += 1;
    errorEntry.lastSeen = now;
    errorCountRef.current[errorKey] = errorEntry;
    
    // Check for frequency threshold - 3 times within 1 minute
    const isFrequent = (
      errorEntry.count >= 3 && 
      (now - errorEntry.firstSeen) < 60000
    );
    
    // Report recurring errors
    if (isFrequent && config.FEATURES.ENABLE_ERROR_REPORTING) {
      reportError(err, 'recurring');
    }
    
    return isFrequent;
  }, []);

  /**
   * Handles errors with appropriate actions based on error type
   * 
   * @param {Error} err - The error to handle
   * @param {string} fallbackMessage - Fallback message if error details are missing
   * @param {Object} options - Additional options for error handling
   * @returns {Object} - Formatted error object
   */
  const handleError = useCallback((err, fallbackMessage = 'An error occurred', options = {}) => {
    try {
      const { 
        shouldNotify = true, 
        shouldAutoClear = true,
        notificationType = 'error',
        retryFn = null
      } = options;
      
      // Get error type if not already categorized
      const errorType = err.type || categorizeError(err);
      
      // Format the error based on type
      let formattedError;
      
      if (errorType === ERROR_TYPES.AUTH) {
        formattedError = handleAuthError(err);
      } else {
        formattedError = {
          message: err.message || fallbackMessage,
          type: errorType,
          originalError: err,
          timestamp: new Date().toISOString()
        };
      }
      
      // Check if this is a recurring error
      const isRecurring = trackErrorFrequency(err);
      formattedError.isRecurring = isRecurring;
      
      // Add retry function if provided
      if (retryFn && typeof retryFn === 'function') {
        formattedError.retry = retryFn;
      }
      
      // Set the error state
      setError(formattedError);

      // Show notification if requested
      if (shouldNotify) {
        notifyError(formattedError.message, notificationType);
      }

      // Auto-clear error after delay if requested
      if (shouldAutoClear) {
        autoClearError();
      }
      
      // Handle redirects for auth errors
      if (formattedError.action === 'redirect' && formattedError.path) {
        window.location.href = formattedError.path;
      }
      
      return formattedError;
    } catch (handlingError) {
      console.error('Error in error handler:', handlingError);
      setError({ message: fallbackMessage });
      return { message: fallbackMessage };
    }
  }, [autoClearError, trackErrorFrequency]);

  /**
   * Wraps an async function with error handling and loading state
   * 
   * @param {Function} asyncFn - Async function to execute
   * @param {Object} options - Configuration options
   * @returns {Function} - Wrapped function with error handling
   */
  const withErrorHandling = useCallback((asyncFn, options = {}) => {
    const { 
      fallbackMessage = 'Operation failed', 
      showNotification = true,
      resetErrorOnStart = true,
      autoRetry = false,
      maxRetries = 1,
      errorHandlingOptions = {}
    } = options;

    // Keep track of retry attempts
    let retryCount = 0;

    const executeWithRetries = async (...args) => {
      try {
        if (resetErrorOnStart) {
          clearError();
        }
        
        setIsLoading(true);
        return await asyncFn(...args);
      } catch (err) {
        console.error(`Error executing ${asyncFn.name || 'async function'}:`, err);
        
        // Create retry function if auto-retry is enabled
        let retryFn = null;
        if (autoRetry && retryCount < maxRetries) {
          retryFn = () => {
            retryCount++;
            return executeWithRetries(...args);
          };
        }
        
        // Handle the error
        return handleError(err, fallbackMessage, {
          shouldNotify: showNotification,
          retryFn,
          ...errorHandlingOptions
        });
      } finally {
        setIsLoading(false);
      }
    };

    return executeWithRetries;
  }, [clearError, handleError]);

  return {
    error,
    setError,
    clearError,
    handleError,
    withErrorHandling,
    isLoading,
    setIsLoading,
    autoClearError
  };
};

export default useErrorHandler; 