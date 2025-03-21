/**
 * Error handling utilities
 */

/**
 * Formats an error response for API consumption
 * Ensures sensitive information is not exposed in production
 * 
 * @param {Error} error - The error object
 * @param {string} operation - Description of the operation that failed
 * @returns {Object} Formatted error response
 */
export const formatError = (error, operation) => {
    // Always log the full error in server logs for debugging
    console.error(`Error ${operation}:`, error);
    
    // For client responses, sanitize based on environment
    const isProd = process.env.NODE_ENV === 'production';
    
    return {
        message: isProd 
            ? `An error occurred during ${operation}` 
            : `Error ${operation}: ${error.message}`,
        error: isProd ? 'Internal server error' : error.message,
        // Only include stack trace in development
        ...(isProd ? {} : { stack: error.stack })
    };
};

/**
 * Common error response objects
 */
export const errorResponses = {
    notFound: (resource) => ({
        message: `${resource} not found`,
        status: 404
    }),
    
    invalidInput: (message) => ({
        message: message || 'Invalid input provided',
        status: 400
    }),
    
    unauthorized: {
        message: 'Unauthorized access',
        status: 401
    },
    
    forbidden: {
        message: 'Access forbidden',
        status: 403
    },
    
    serverError: {
        message: 'Internal server error',
        status: 500
    }
};

/**
 * Error handler middleware for route handlers
 * 
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} operation - Description of the operation
 */
export const handleError = (res, error, operation) => {
    const formattedError = formatError(error, operation);
    res.status(error.status || 500).json(formattedError);
};

/**
 * Async route wrapper to handle promise rejections
 * 
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped route handler
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
        handleError(res, error, 'processing request');
    });
}; 