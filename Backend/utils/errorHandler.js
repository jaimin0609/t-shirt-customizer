// Error response formatter
export const formatError = (error, operation) => {
    console.error(`Error ${operation}:`, error);
    return {
        message: `Error ${operation}`,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
};

// Common error responses
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
    }
};

// Error handler middleware
export const handleError = (res, error, operation) => {
    const formattedError = formatError(error, operation);
    res.status(error.status || 500).json(formattedError);
};

// Async route wrapper to handle promise rejections
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
        handleError(res, error, 'processing request');
    });
}; 