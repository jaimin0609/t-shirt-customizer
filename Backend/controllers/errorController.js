/**
 * Error handling controller providing utilities for consistent error responses
 */
const errorController = {
  /**
   * Wraps async route handlers to catch and forward errors to the global error handler
   * 
   * @param {Function} fn - The async route handler function
   * @returns {Function} Wrapped function that catches and forwards errors
   */
  catchAsync: (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  },

  /**
   * Creates a 404 error for resources not found
   * 
   * @param {string} resource - The resource type that was not found
   * @returns {Error} A formatted 404 error
   */
  notFound: (resource = 'Resource') => {
    const error = new Error(`${resource} not found`);
    error.status = 404;
    return error;
  },

  /**
   * Creates a 401 error for authentication failures
   * 
   * @param {string} message - Optional custom message
   * @returns {Error} A formatted 401 error
   */
  unauthorized: (message = 'Authentication required') => {
    const error = new Error(message);
    error.status = 401;
    return error;
  },

  /**
   * Creates a 403 error for permission issues
   * 
   * @param {string} message - Optional custom message
   * @returns {Error} A formatted 403 error
   */
  forbidden: (message = 'Access denied') => {
    const error = new Error(message);
    error.status = 403;
    return error;
  },

  /**
   * Creates a 400 error for bad requests
   * 
   * @param {string} message - Optional custom message
   * @returns {Error} A formatted 400 error
   */
  badRequest: (message = 'Invalid request') => {
    const error = new Error(message);
    error.status = 400;
    return error;
  }
};

export default errorController; 