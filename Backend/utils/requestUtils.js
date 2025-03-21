/**
 * Request utilities
 * Helper functions for handling HTTP requests
 */

/**
 * Get the client IP address from the request
 * Handles various proxy configurations
 * 
 * @param {Object} req - Express request object
 * @returns {string} - Client IP address
 */
export const getClientIp = (req) => {
    // Try to get IP from X-Forwarded-For header (common for proxies)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
        // X-Forwarded-For can contain multiple IPs, first one is the client
        const ips = forwardedFor.split(',').map(ip => ip.trim());
        if (ips.length > 0 && ips[0]) {
            return ips[0];
        }
    }
    
    // Try X-Real-IP header (used by some proxies)
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
        return realIp;
    }
    
    // Fall back to Express's built-in IP detection
    return req.ip || 
           (req.connection && req.connection.remoteAddress) || 
           (req.socket && req.socket.remoteAddress) ||
           'unknown';
};

/**
 * Sanitize user input to prevent injection attacks
 * 
 * @param {string} input - User-provided input
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') {
        return input;
    }
    
    // Remove HTML/script tags
    return input
        .replace(/<(script|style|iframe|object|embed|applet|form|input|button|textarea).*?>.*?<\/\1>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/data:/gi, '');
};

/**
 * Check if a request is coming from a trusted origin
 * 
 * @param {Object} req - Express request object
 * @returns {boolean} - Whether the request is from a trusted origin
 */
export const isFromTrustedOrigin = (req) => {
    const origin = req.headers.origin || req.headers.referer || '';
    
    // Define trusted origins
    const trustedOrigins = [
        // Local development
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:3001',
        // Render deployment URLs
        'https://t-shirt-customizer-backend.onrender.com',
        'https://t-shirt-customizer-frontend.onrender.com',
        // Include all subdomains of onrender.com
        'onrender.com',
        // Allow requests with no explicit origin for local testing
        ''
    ];
    
    // Check if we need to bypass this check during development
    if (process.env.NODE_ENV !== 'production') {
        return true; // Allow all origins in development mode
    }
    
    // Check if origin exactly matches or starts with any trusted origin
    return trustedOrigins.some(trusted => {
        if (trusted === '') return origin === '';
        // If it's a domain suffix (like onrender.com) without http/https
        if (!trusted.startsWith('http')) {
            return origin.includes(trusted);
        }
        return origin === trusted || origin.startsWith(trusted);
    });
};

export default {
    getClientIp,
    sanitizeInput,
    isFromTrustedOrigin
}; 