/**
 * Global error handler middleware
 * Catch-all for unhandled errors in the application
 * 
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
    // Always log full error details for server-side debugging
    console.error('Server error:', err);
    
    // Determine environment
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Handle specific error types with appropriate responses
    if (err.name === 'SequelizeValidationError') {
        // For validation errors, return the specific error messages
        // These are safe to expose even in production
        return res.status(400).json({
            error: 'Validation Error',
            details: err.errors.map(e => e.message)
        });
    }
    
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Authentication Error',
            message: 'Invalid or expired token'
        });
    }
    
    // Generic error response - sanitized in production
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: isProduction ? 'Something went wrong' : err.message,
        ...(isProduction ? {} : { stack: err.stack })
    });
};

export default errorHandler; 