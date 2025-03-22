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
    // Always bypass in development mode
    if (process.env.NODE_ENV !== 'production') {
        return true;
    }
    
    // Get the origin and host from the request
    const origin = req.headers.origin || '';
    const referer = req.headers.referer || '';
    const host = req.headers.host || '';
    
    console.log('Request details for CORS validation:');
    console.log('Origin:', origin);
    console.log('Referer:', referer);
    console.log('Host:', host);
    
    // If there's no origin header, this is likely a same-origin request
    // or a request from a non-browser client (like curl or Postman)
    if (!origin) {
        // For API endpoints, we'll trust requests without an origin
        // since these could be server-to-server requests or direct API calls
        return true;
    }
    
    // Same-origin requests should always be allowed
    // If the origin header matches the host, it's same-origin
    try {
        const originHostname = new URL(origin).hostname;
        if (host === originHostname || host.includes(originHostname) || originHostname.includes(host)) {
            console.log('Same-origin request detected, allowing');
            return true;
        }
    } catch (e) {
        console.error('Error parsing origin URL:', e);
    }
    
    // Define trusted origins - keep it very permissive for now
    const trustedDomains = [
        'localhost',
        '127.0.0.1',
        'onrender.com',
        't-shirt-customizer-backend.onrender.com',
        't-shirt-customizer-frontend.onrender.com',
        'uniqverse-five.vercel.app',
        'vercel.app'
    ];
    
    // Check if the origin contains any of our trusted domains
    for (const domain of trustedDomains) {
        if (origin.includes(domain)) {
            console.log(`Trusted domain match: ${domain}`);
            return true;
        }
    }
    
    console.log('Origin validation failed - untrusted origin');
    return false;
};

export default {
    getClientIp,
    sanitizeInput,
    isFromTrustedOrigin
}; 